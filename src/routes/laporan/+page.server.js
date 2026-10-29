import { getReport, getBudget } from '$lib/server/expenses.js';
import { getWarnPct } from '$lib/server/budget.js';
import { todayJakarta } from '$lib/format.js';

export async function load() {
	// `today` dari server (WIB) supaya status unduhan PDF tidak bergantung zona waktu browser.
	const [report, budget, warnPct] = await Promise.all([getReport(), getBudget(), getWarnPct()]);
	return { report, budget, warnPct, today: todayJakarta() };
}
