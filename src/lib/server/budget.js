// Cek anggaran bulan ini dan kirim notif Telegram bila threshold terlampaui.
import { env } from '$env/dynamic/private';
import { readConfig, writeConfig } from './config.js';
import { sendMessage } from './telegram.js';
import { listExpenses, isConfigured, getBudget } from './expenses.js';
import { formatRp } from '$lib/format.js';

/** Chat ID tujuan notif, dari config, fallback ke ID pertama whitelist. */
function getNotifyChatId() {
	const cfg = readConfig();
	if (cfg.BUDGET_NOTIFY_CHAT_ID) return cfg.BUDGET_NOTIFY_CHAT_ID;
	const ids = (cfg.TELEGRAM_ALLOWED_IDS || env.TELEGRAM_ALLOWED_IDS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	return ids[0] || '';
}

/** Threshold peringatan (%), default 80. */
function getWarnPct() {
	const cfg = readConfig();
	return Number(cfg.BUDGET_WARN_PCT || env.BUDGET_WARN_PCT || '') || 80;
}

/**
 * Jalankan setelah expense ditambahkan (fire-and-forget via void).
 * Kirim notif Telegram bila pengeluaran bulan ini melewati threshold.
 */
export async function checkBudgetAlert() {
	const chatId = getNotifyChatId();
	const token = env.TELEGRAM_BOT_TOKEN;
	if (!chatId || !token || !isConfigured()) return;

	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

	try {
		const expenses = await listExpenses();
		const thisMonth = expenses
			.filter((e) => {
				const d = new Date(e.date);
				return d.getFullYear() === year && d.getMonth() === month;
			})
			.reduce((s, e) => s + e.total, 0);

		const budget = getBudget();
		const pct = Math.round((thisMonth / budget) * 100);
		const warnPct = getWarnPct();
		const cfg = readConfig();
		/** @type {Record<string, string>} */
		const updates = {};

		if (pct >= 100 && cfg.BUDGET_EXCEED_SENT !== monthKey) {
			await sendMessage(
				chatId,
				`Budget Bulanan Terlampaui\n\n` +
					`Pengeluaran : ${formatRp(thisMonth)}\n` +
					`Budget      : ${formatRp(budget)}\n` +
					`Kelebihan   : ${formatRp(thisMonth - budget)}\n\n` +
					`Yuk rem dulu pengeluarannya.`
			);
			updates.BUDGET_EXCEED_SENT = monthKey;
			updates.BUDGET_WARN_SENT = monthKey;
		} else if (pct >= warnPct && cfg.BUDGET_WARN_SENT !== monthKey) {
			await sendMessage(
				chatId,
				`Peringatan Anggaran: ${pct}% terpakai\n\n` +
					`Terpakai : ${formatRp(thisMonth)}\n` +
					`Budget   : ${formatRp(budget)}\n` +
					`Sisa     : ${formatRp(Math.max(0, budget - thisMonth))}\n\n` +
					`Hati-hati ya.`
			);
			updates.BUDGET_WARN_SENT = monthKey;
		}

		if (Object.keys(updates).length > 0) writeConfig(updates);
	} catch (err) {
		console.error('checkBudgetAlert error', err);
	}
}
