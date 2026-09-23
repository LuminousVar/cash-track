import { getDashboardData } from '$lib/server/expenses.js';
import { readConfig } from '$lib/server/config.js';
import { env } from '$env/dynamic/private';

export async function load() {
	const data = await getDashboardData();
	const cfg = readConfig();
	return {
		transactions: data.transactions,
		summary: data.summary,
		warnPct: Number(cfg.BUDGET_WARN_PCT || env.BUDGET_WARN_PCT || '') || 80
	};
}
