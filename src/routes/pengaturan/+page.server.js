import { getBudget, isConfigured } from '$lib/server/expenses.js';

export function load() {
	return { budget: getBudget(), configured: isConfigured() };
}
