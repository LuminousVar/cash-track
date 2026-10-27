import { getReport, getBudget } from '$lib/server/expenses.js';
import { getWarnPct } from '$lib/server/budget.js';
import { todayJakarta } from '$lib/format.js';

export async function load() {
	// `today` dari server (WIB) supaya status unduhan PDF tidak bergantung zona waktu browser.
	return { report: await getReport(), budget: getBudget(), warnPct: getWarnPct(), today: todayJakarta() };
}
