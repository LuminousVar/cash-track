import { getReport, getBudget } from '$lib/server/expenses.js';
import { getWarnPct } from '$lib/server/budget.js';

export async function load() {
	return { report: await getReport(), budget: getBudget(), warnPct: getWarnPct() };
}
