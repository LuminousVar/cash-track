import { isConfigured } from '$lib/server/expenses.js';

export function load({ locals }) {
	return { user: locals.user, demo: !isConfigured() };
}
