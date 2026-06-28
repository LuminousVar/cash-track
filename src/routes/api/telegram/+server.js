// Webhook Telegram: foto struk → Vision OCR → DeepSeek → Sheet → balas konfirmasi.
import { env } from '$env/dynamic/private';
import { getFile, downloadFileBase64, sendMessage } from '$lib/server/telegram.js';
import { visionOcr } from '$lib/server/google.js';
import { parseReceipt } from '$lib/server/deepseek.js';
import { addReceipt } from '$lib/server/expenses.js';
import { checkBudgetAlert } from '$lib/server/budget.js';
import { formatRp } from '$lib/format.js';

// Pipeline OCR+LLM bisa makan waktu — beri ruang di Vercel.
export const config = { maxDuration: 60 };

const ok = () => new Response('ok');

/**
 * Whitelist: TELEGRAM_ALLOWED_IDS = "123,456". Kosong → izinkan semua (dev).
 * @param {number | string | undefined} userId
 */
function isAllowed(userId) {
	const list = (env.TELEGRAM_ALLOWED_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
	return list.length === 0 || list.includes(String(userId));
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

	const msg = update.message ?? update.edited_message;
	const chatId = msg?.chat?.id;
	if (!chatId) return ok();

	try {
		if (!isAllowed(msg?.from?.id)) {
			await sendMessage(chatId, 'Maaf, kamu tidak punya akses ke bot ini.');
			return ok();
		}

		const photos = msg.photo;
		if (!Array.isArray(photos) || photos.length === 0) {
			await sendMessage(chatId, 'Kirim foto struk ya — nanti aku catat otomatis. 🧾');
			return ok();
		}

		const fileId = photos[photos.length - 1].file_id; // resolusi terbesar
		const base64 = await downloadFileBase64(await getFile(fileId));
		const rawText = await visionOcr(base64);
		if (!rawText.trim()) {
			await sendMessage(chatId, 'Hmm, fotonya kurang terbaca — coba foto struk lebih terang & fokus ya.');
			return ok();
		}

		const parsed = await parseReceipt(rawText);
		const { persisted } = await addReceipt(parsed, { fileId, rawText, user: msg.from?.id });
		if (persisted) void checkBudgetAlert();

		const lines = [
			'✅ Tercatat!',
			`🏪 ${parsed.merchant || '-'}`,
			`💸 ${formatRp(parsed.total)}`,
			`🏷️ ${parsed.category}`,
			`📅 ${parsed.date}`
		];
		if (!persisted) lines.push('', '(mode demo: belum tersimpan ke Sheet — atur kredensial Google)');
		await sendMessage(chatId, lines.join('\n'));
	} catch (err) {
		console.error('telegram pipeline error', err);
		await sendMessage(chatId, 'Maaf, ada kendala saat memproses struk. Coba lagi sebentar lagi 🙏');
	}

	return ok(); // selalu 200 agar Telegram tidak retry beruntun
}
