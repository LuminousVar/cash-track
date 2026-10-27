import { isConfigured } from '$lib/server/expenses.js';
import { currentCycle } from '$lib/server/cycle.js';
import { authConfigured, SESSION_IDLE_MS } from '$lib/server/auth.js';

export function load({ locals }) {
	// Info periode gajian dipakai halaman yang mengelompokkan per bulan di browser.
	const cycle = currentCycle();
	return {
		user: locals.user,
		demo: !isConfigured(),
		cycleStartDay: cycle.startDay,
		currentCycleKey: cycle.key,
		sessionIdleMs: authConfigured() ? SESSION_IDLE_MS : 0
	};
}
