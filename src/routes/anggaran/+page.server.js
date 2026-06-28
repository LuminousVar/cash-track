import { getDashboardData, getBudget } from '$lib/server/expenses.js';
import { readConfig, writeConfig } from '$lib/server/config.js';
import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';

/** @param {string} key */
function get(key) {
	const cfg = readConfig();
	return cfg[key] || env[key] || '';
}

export async function load() {
	const data = await getDashboardData();
	const now = new Date();
	const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
	const daysLeft = daysInMonth - now.getDate();
	const projected =
		now.getDate() > 0
			? Math.round((data.summary.thisMonth / now.getDate()) * daysInMonth)
			: data.summary.thisMonth;

	const firstAllowedId = (get('TELEGRAM_ALLOWED_IDS') || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)[0] ?? '';

	return {
		budget: getBudget(),
		warnPct: Number(get('BUDGET_WARN_PCT')) || 80,
		notifyChatId: get('BUDGET_NOTIFY_CHAT_ID'),
		firstAllowedId,
		monthlyFlow: data.monthlyFlow,
		summary: data.summary,
		demo: data.demo,
		daysLeft,
		projected
	};
}

export const actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const val = (/** @type {string} */ key) => form.get(key)?.toString() ?? '';
		try {
			writeConfig({
				MONTHLY_BUDGET: val('MONTHLY_BUDGET'),
				BUDGET_WARN_PCT: val('BUDGET_WARN_PCT'),
				BUDGET_NOTIFY_CHAT_ID: val('BUDGET_NOTIFY_CHAT_ID')
			});
			return { success: true };
		} catch {
			return fail(500, { error: 'Gagal menyimpan pengaturan anggaran.' });
		}
	}
};
