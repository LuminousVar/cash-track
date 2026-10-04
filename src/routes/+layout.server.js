import { isConfigured } from '$lib/server/expenses.js';
import { currentCycle } from '$lib/server/cycle.js';

export function load({ locals }) {
	// Info periode gajian dipakai halaman yang mengelompokkan per bulan di browser.
	const cycle = currentCycle();
	return { user: locals.user, demo: !isConfigured(), cycleStartDay: cycle.startDay, currentCycleKey: cycle.key };
}
