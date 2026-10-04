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
	// Hitungan hari mengikuti periode gajian, bukan bulan kalender.
	const { cycle } = data.summary;
	const daysLeft = cycle.daysLeft;
	const projected = Math.round((data.summary.thisMonth / Math.max(1, cycle.dayIndex)) * cycle.days);

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
		projected,
		cycleRange: cycle.rangeLabel
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
