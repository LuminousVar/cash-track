import { getDashboardData, getBudget } from '$lib/server/expenses.js';
import { readConfig, writeConfig, isVercel } from '$lib/server/config.js';
import { getWarnPct } from '$lib/server/budget.js';
import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';

/** @param {string} key */
function get(key) {
	const cfg = readConfig();
	return cfg[key] || env[key] || '';
}

export async function load() {
	const data = await getDashboardData();
	const firstAllowedId =
		(get('TELEGRAM_ALLOWED_IDS') || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)[0] ?? '';

	return {
		budget: getBudget(),
		warnPct: getWarnPct(),
		notifyChatId: get('BUDGET_NOTIFY_CHAT_ID'),
		firstAllowedId,
		summary: data.summary,
		isVercel
	};
}

export const actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const val = (/** @type {string} */ key) => form.get(key)?.toString().trim() ?? '';

		const budget = Number(val('MONTHLY_BUDGET'));
		const warn = Number(val('BUDGET_WARN_PCT'));
		const chatId = val('BUDGET_NOTIFY_CHAT_ID');
		if (!Number.isFinite(budget) || budget <= 0) return fail(400, { error: 'Target anggaran harus lebih dari 0.' });
		if (!Number.isInteger(warn) || warn < 1 || warn > 99) return fail(400, { error: 'Batas peringatan harus 1 sampai 99.' });
		if (chatId && !/^-?\d+$/.test(chatId)) return fail(400, { error: 'ID Telegram hanya berisi angka.' });

		try {
			writeConfig({
				MONTHLY_BUDGET: String(Math.round(budget)),
				BUDGET_WARN_PCT: String(warn),
				BUDGET_NOTIFY_CHAT_ID: chatId
			});
			return { success: true };
		} catch {
			return fail(500, { error: 'Gagal menyimpan pengaturan anggaran.' });
		}
	}
};
