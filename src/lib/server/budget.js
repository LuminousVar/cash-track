// Cek anggaran bulan ini dan kirim notif Telegram bila threshold terlampaui.
import { env } from '$env/dynamic/private';
import { readConfig, writeConfig } from './config.js';
import { sendMessage } from './telegram.js';
import { getExpenses, isConfigured, getBudget } from './expenses.js';
import { currentCycle } from './cycle.js';
import { formatRp, cycleKey, countsToBudget, todayJakarta, budgetOutlook, formatDay, formatDayMonth } from '$lib/format.js';

/** Chat ID tujuan notif, dari config, fallback ke ID pertama whitelist. */
export async function getNotifyChatId() {
	const cfg = await readConfig();
	if (cfg.BUDGET_NOTIFY_CHAT_ID) return cfg.BUDGET_NOTIFY_CHAT_ID;
	const ids = (env.TELEGRAM_ALLOWED_IDS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	return ids[0] || '';
}

/** Threshold peringatan (%), default 80. Dipakai juga oleh halaman untuk warna status. */
export async function getWarnPct() {
	const cfg = await readConfig();
	return Number(cfg.BUDGET_WARN_PCT || env.BUDGET_WARN_PCT || '') || 80;
}

/**
 * Posisi anggaran periode berjalan beserta pengeluaran hari ini (WIB). Satu sumber
 * untuk notif anggaran, /sisa, dan ringkasan harian. Investasi tidak dihitung.
 */
export async function getBudgetSnapshot() {
	const cycle = currentCycle();
	const today = todayJakarta();
	const [expenses, budget, warnPct] = await Promise.all([getExpenses(), getBudget(), getWarnPct()]);
	let spent = 0,
		todayTotal = 0,
		todayCount = 0;
	for (const e of expenses) {
		if (!countsToBudget(e) || cycleKey(e.date, cycle.startDay) !== cycle.key) continue;
		spent += e.total;
		if (e.date.slice(0, 10) === today) {
			todayTotal += e.total;
			todayCount++;
		}
	}
	return { cycle, today, spent, todayTotal, todayCount, budget, warnPct, ...budgetOutlook({ spent, budget, cycle }) };
}

/** @typedef {Awaited<ReturnType<typeof getBudgetSnapshot>>} BudgetSnapshot */

/** @param {number} n */
const signedRp = (n) => (n < 0 ? '-' : '') + formatRp(Math.abs(n));

/**
 * Satu baris sisa anggaran, ditambahkan ke balasan setelah transaksi tercatat.
 * @param {BudgetSnapshot} s
 */
export function remainingLine(s) {
	if (s.remaining < 0) return `Anggaran periode ini terlewati ${formatRp(-s.remaining)}.`;
	return `Sisa anggaran ${formatRp(s.remaining)}, sekitar ${formatRp(s.perDay)}/hari sampai ${formatDayMonth(s.cycle.end)}.`;
}

/**
 * Balasan /sisa.
 * @param {BudgetSnapshot} s
 */
export function remainingMessage(s) {
	const lines = [
		`Anggaran periode ${s.cycle.label}${s.cycle.rangeLabel ? ` (${s.cycle.rangeLabel})` : ''}`,
		'',
		`Sisa       : ${signedRp(s.remaining)}`,
		`Terpakai   : ${formatRp(s.spent)} dari ${formatRp(s.budget)} (${s.pct}%)`,
		`Hari ini   : ${formatRp(s.todayTotal)} (${s.todayCount} transaksi)`
	];
	if (s.remaining >= 0) lines.push(`Jatah aman : ${formatRp(s.perDay)}/hari, ${s.daysIncl} hari termasuk hari ini`);
	else lines.push('', 'Sudah melewati anggaran. Yuk rem dulu pengeluarannya.');
	return lines.join('\n');
}

/**
 * Ringkasan malam dari cron. Hari ini dianggap selesai, jadi jatah dihitung mulai besok.
 * @param {BudgetSnapshot} s
 */
export function dailySummaryMessage(s) {
	const lines = [
		`Ringkasan ${formatDay(s.today)}`,
		'',
		`Hari ini : ${formatRp(s.todayTotal)} (${s.todayCount} transaksi)`,
		`Terpakai : ${formatRp(s.spent)} dari ${formatRp(s.budget)} (${s.pct}%)`,
		`Sisa     : ${signedRp(s.remaining)}`
	];
	if (s.cycle.daysLeft === 0) lines.push(`Periode ${s.cycle.label} berakhir hari ini.`);
	else if (s.remaining >= 0) lines.push(`Jatah    : ${formatRp(s.nextPerDay)}/hari untuk ${s.cycle.daysLeft} hari ke depan`);
	if (s.todayCount === 0) lines.push('', 'Belum ada catatan hari ini. Ada yang terlewat? Kirim foto struk atau ketik, mis. kopi 25rb.');
	return lines.join('\n');
}

/**
 * Jalankan setelah expense ditambahkan (fire-and-forget via void).
 * Kirim notif Telegram bila pengeluaran bulan ini melewati threshold.
 */
export async function checkBudgetAlert() {
	const token = env.TELEGRAM_BOT_TOKEN;
	if (!token || !isConfigured()) return;

	try {
		const chatId = await getNotifyChatId();
		if (!chatId) return;

		// Kunci periode gajian berjalan, juga dipakai sebagai penanda "sudah dikirim".
		const { cycle, spent, budget, pct, warnPct } = await getBudgetSnapshot();
		const monthKey = cycle.key;
		const cfg = await readConfig();
		/** @type {Record<string, string>} */
		const updates = {};

		// Penanda hanya disimpan kalau pesan benar-benar terkirim, supaya kegagalan
		// (chat ID salah, token bermasalah) dicoba lagi di transaksi berikutnya.
		if (pct >= 100 && cfg.BUDGET_EXCEED_SENT !== monthKey) {
			const sent = await sendMessage(
				chatId,
				`Budget Bulanan Terlampaui\n\n` +
					`Pengeluaran : ${formatRp(spent)}\n` +
					`Budget      : ${formatRp(budget)}\n` +
					`Kelebihan   : ${formatRp(spent - budget)}\n\n` +
					`Yuk rem dulu pengeluarannya.`
			);
			if (sent) {
				updates.BUDGET_EXCEED_SENT = monthKey;
				updates.BUDGET_WARN_SENT = monthKey;
			}
		} else if (pct >= warnPct && cfg.BUDGET_WARN_SENT !== monthKey) {
			const sent = await sendMessage(
				chatId,
				`Peringatan Anggaran: ${pct}% terpakai\n\n` +
					`Terpakai : ${formatRp(spent)}\n` +
					`Budget   : ${formatRp(budget)}\n` +
					`Sisa     : ${formatRp(Math.max(0, budget - spent))}\n\n` +
					`Hati-hati ya.`
			);
			if (sent) updates.BUDGET_WARN_SENT = monthKey;
		}

		if (Object.keys(updates).length > 0) await writeConfig(updates);
	} catch (err) {
		console.error('checkBudgetAlert error', err);
	}
}
