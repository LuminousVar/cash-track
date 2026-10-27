// Webhook Telegram: foto struk dibaca Vision OCR, diurai DeepSeek, disimpan ke Sheet, lalu dibalas konfirmasi.
import { env } from '$env/dynamic/private';
import { getFile, downloadFileBase64, sendMessage } from '$lib/server/telegram.js';
import { visionOcr } from '$lib/server/google.js';
import { parseReceipt } from '$lib/server/deepseek.js';
import { addReceipt, deleteExpense, lastTelegramExpense, findByPhoto } from '$lib/server/expenses.js';
import { checkBudgetAlert } from '$lib/server/budget.js';
import { listGoals, addContribution } from '$lib/server/goals.js';
import { formatRp, parseAmount, cycleLabel } from '$lib/format.js';

// Pipeline OCR+LLM bisa makan waktu, beri ruang di Vercel.
export const config = { maxDuration: 60 };

const ok = () => new Response('ok');

// update_id yang sedang/baru diproses di instance ini. Telegram mengirim ulang
// update kalau balasan lambat (OCR + AI bisa lama), dan kiriman ulang itu bisa
// datang saat yang pertama masih jalan. Lintas instance ditangani findByPhoto.
/** @type {Set<number>} */
const seenUpdates = new Set();
/** @param {number | undefined} id */
function alreadySeen(id) {
	if (typeof id !== 'number') return false;
	if (seenUpdates.has(id)) return true;
	seenUpdates.add(id);
	if (seenUpdates.size > 500) seenUpdates.delete(seenUpdates.values().next().value ?? id);
	return false;
}

/**
 * Whitelist: TELEGRAM_ALLOWED_IDS = "123,456". Kalau kosong, semua diizinkan (dev).
 * @param {number | string | undefined} userId
 */
function isAllowed(userId) {
	const list = (env.TELEGRAM_ALLOWED_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
	return list.length === 0 || list.includes(String(userId));
}

const COMMANDS = [
	'/hapus : batalkan catatan terakhir',
	'/hapus <id> : hapus catatan tertentu',
	'/goals : lihat progres goals',
	'/nabung <nominal> <goal> : setor ke goal, mis. /nabung 500rb laptop',
	'/tarik <nominal> <goal> : ambil dari goal'
].join('\n');

const HINT = `Kirim foto struk ya, nanti aku catat otomatis.\n\nPerintah lain:\n${COMMANDS}`;

/** @param {import('$lib/server/goals.js').Goal} g */
const goalLine = (g) => `${g.name}: ${formatRp(g.saved)} dari ${formatRp(g.target)} (${g.pct}%)`;

/**
 * /goals, /nabung, /tarik. Setoran dicatat ke tab GoalLog, terpisah dari pengeluaran.
 * @param {string} cmd
 * @param {string} rest  teks setelah perintah
 * @param {number | string | undefined} userId
 */
async function handleGoal(cmd, rest, userId) {
	const goals = (await listGoals()).filter((g) => !g.archived);
	if (cmd === '/goals') {
		if (goals.length === 0) return 'Belum ada goal. Buat dulu di halaman Goals.';
		return ['Goals:', ...goals.map((g) => `- ${goalLine(g)}${g.perMonth ? `, perlu ${formatRp(g.perMonth)}/bulan` : ''}`)].join('\n');
	}

	const [rawAmount = '', ...words] = rest.split(/\s+/);
	const amount = parseAmount(rawAmount);
	if (amount <= 0) return `Format: ${cmd} <nominal> <nama goal>\nContoh: ${cmd} 500rb laptop`;

	// Cocokkan sebagian nama, tanpa beda huruf besar kecil. Cukup satu goal: tidak perlu nama.
	const query = words.join(' ').toLowerCase();
	const hits = query ? goals.filter((g) => g.name.toLowerCase().includes(query)) : goals;
	if (hits.length !== 1) {
		const list = goals.map((g) => `- ${g.name}`).join('\n');
		if (goals.length === 0) return 'Belum ada goal. Buat dulu di halaman Goals.';
		return `${hits.length === 0 ? 'Goal tidak ditemukan.' : 'Sebutkan goal yang mana.'} Pilihan:\n${list}`;
	}
	const goal = hits[0];
	if (cmd === '/tarik' && amount > goal.saved) return `Terkumpul di ${goal.name} baru ${formatRp(goal.saved)}.`;

	const signed = cmd === '/tarik' ? -amount : amount;
	const { persisted } = await addContribution(goal.id, { amount: signed, source: 'telegram', user: String(userId ?? '') });
	if (!persisted) return 'Mode demo: belum tersambung ke Sheet, jadi tidak disimpan.';

	const saved = goal.saved + signed;
	const pct = goal.target > 0 ? Math.min(100, Math.round((saved / goal.target) * 100)) : 0;
	const lines = [
		`${cmd === '/tarik' ? 'Penarikan' : 'Setoran'} ${formatRp(amount)} untuk ${goal.name} tercatat.`,
		`Terkumpul ${formatRp(saved)} dari ${formatRp(goal.target)} (${pct}%).`
	];
	if (saved >= goal.target) lines.push('Target tercapai!');
	else if (goal.deadline) lines.push(`Kurang ${formatRp(goal.target - saved)} sampai ${cycleLabel(goal.deadline.slice(0, 7))}.`);
	return lines.join('\n');
}

/**
 * Tangani pesan teks (bukan foto). Mengembalikan balasan yang akan dikirim.
 * @param {string} text
 * @param {number | string | undefined} userId
 * @returns {Promise<string>}
 */
async function handleText(text, userId) {
	// Telegram menambahkan @namabot pada perintah di grup.
	const [, rawCmd = '', rest = ''] = /^(\S*)\s*([\s\S]*)$/.exec(text.trim()) ?? [];
	const cmd = rawCmd.split('@')[0].toLowerCase();
	const arg = rest.split(/\s+/)[0];

	if (cmd === '/start') {
		return `Halo!\n\nKirim foto struk belanjaanmu ke sini. Aku baca, rapikan, dan catat otomatis ke spreadsheet.\n\n${COMMANDS}`;
	}

	if (cmd === '/goals' || cmd === '/nabung' || cmd === '/tarik') return handleGoal(cmd, rest.trim(), userId);

	if (cmd !== '/hapus') return HINT;

	// /hapus <id>: hapus catatan tertentu. Tanpa argumen: catatan terakhir.
	const target = arg?.trim() || (await lastTelegramExpense(userId))?.id;
	if (!target) return 'Tidak ada catatan dari Telegram yang bisa dihapus.';

	const { persisted, notFound, expense } = await deleteExpense(target);
	if (notFound) return `Catatan dengan id ${target} tidak ditemukan.`;
	if (!persisted) return 'Mode demo: belum tersambung ke Sheet, jadi tidak ada yang dihapus.';
	return `Dihapus: ${expense?.merchant || 'Tanpa nama'}, ${formatRp(expense?.total ?? 0)}`;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	// Validasi header rahasia dari setWebhook.
	if (env.TELEGRAM_SECRET_TOKEN && request.headers.get('x-telegram-bot-api-secret-token') !== env.TELEGRAM_SECRET_TOKEN) {
		return new Response('forbidden', { status: 401 });
	}

	/** @type {any} */
	let update;
	try {
		update = await request.json();
	} catch {
		return ok();
	}

	// Hanya pesan baru. edited_message diabaikan: mengedit caption foto struk
	// tidak boleh mencatat struk yang sama untuk kedua kalinya.
	const msg = update.message;
	const chatId = msg?.chat?.id;
	if (!chatId) return ok();
	if (alreadySeen(update.update_id)) return ok();

	try {
		if (!isAllowed(msg?.from?.id)) {
			await sendMessage(chatId, 'Maaf, kamu tidak punya akses ke bot ini.');
			return ok();
		}

		const photos = msg.photo;
		if (!Array.isArray(photos) || photos.length === 0) {
			await sendMessage(chatId, await handleText(String(msg.text ?? ''), msg.from?.id));
			return ok();
		}

		const fileId = photos[photos.length - 1].file_id; // resolusi terbesar
		const existing = await findByPhoto(fileId);
		if (existing) {
			await sendMessage(chatId, `Struk ini sudah tercatat (ID ${existing.id || '-'}). Tidak dicatat ulang.`);
			return ok();
		}
		const base64 = await downloadFileBase64(await getFile(fileId));
		const rawText = await visionOcr(base64);
		if (!rawText.trim()) {
			await sendMessage(chatId, 'Hmm, fotonya kurang terbaca. Coba foto struk lebih terang & fokus ya.');
			return ok();
		}

		const parsed = await parseReceipt(rawText);
		const { persisted, id } = await addReceipt(parsed, { fileId, rawText, user: msg.from?.id });
		if (persisted) void checkBudgetAlert();

		const lines = [
			'Tercatat.',
			`Merchant : ${parsed.merchant || '-'}`,
			`Total    : ${formatRp(parsed.total)}`,
			`Kategori : ${parsed.category}`,
			`Tanggal  : ${parsed.date}`
		];
		// ID dicantumkan supaya salah baca bisa langsung dibatalkan: /hapus <id>
		if (id) lines.push(`ID       : ${id}`, `Salah? Balas /hapus ${id}`);
		if (!persisted) lines.push('', '(mode demo: belum tersimpan ke Sheet, atur kredensial Google)');
		await sendMessage(chatId, lines.join('\n'));
	} catch (err) {
		console.error('telegram pipeline error', err);
		await sendMessage(chatId, 'Maaf, ada kendala saat memproses struk. Coba lagi sebentar lagi.');
	}

	return ok(); // selalu 200 agar Telegram tidak retry beruntun
}
