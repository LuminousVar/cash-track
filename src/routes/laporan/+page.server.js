import { getReport } from '$lib/server/expenses.js';

export async function load() {
	return { report: await getReport() };
}
