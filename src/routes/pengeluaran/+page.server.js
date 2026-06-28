import { getExpenses } from '$lib/server/expenses.js';

export async function load() {
	return { expenses: await getExpenses() };
}
