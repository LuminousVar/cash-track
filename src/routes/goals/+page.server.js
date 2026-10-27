import { fail } from '@sveltejs/kit';
import { listGoals, createGoal, updateGoal, deleteGoal, addContribution, deleteContribution } from '$lib/server/goals.js';
import { GOAL_TYPES, parseAmount, todayJakarta } from '$lib/format.js';

export async function load() {
	return { goals: await listGoals(), today: todayJakarta() };
}

/**
 * Field goal dari form. Tenggat dikirim sebagai "YYYY-MM" (input month) dan disimpan
 * sebagai hari terakhir bulan itu.
 * @param {FormData} fd
 */
function readGoal(fd) {
	const month = String(fd.get('deadline') || '');
	let deadline = '';
	if (/^\d{4}-\d{2}$/.test(month)) {
		const [y, m] = month.split('-').map(Number);
		deadline = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
	}
	const type = String(fd.get('type') || '');
	return {
		name: String(fd.get('name') || '').trim().slice(0, 80),
		type: GOAL_TYPES.includes(type) ? type : 'Lainnya',
		target: parseAmount(String(fd.get('target') || '')),
		deadline,
		notes: String(fd.get('notes') || '').trim().slice(0, 300)
	};
}

/** @param {{ persisted: boolean, notFound?: boolean }} r */
const done = (r) => (r.notFound ? fail(404, { error: 'Goal tidak ditemukan, mungkin sudah dihapus.' }) : { success: true, persisted: r.persisted });

export const actions = {
	create: async ({ request }) => {
		const g = readGoal(await request.formData());
		if (!g.name || g.target <= 0) return fail(400, { error: 'Isi nama goal dan target yang lebih dari 0.' });
		return done(await createGoal(g));
	},

	update: async ({ request }) => {
		const fd = await request.formData();
		const g = readGoal(fd);
		if (!g.name || g.target <= 0) return fail(400, { error: 'Isi nama goal dan target yang lebih dari 0.' });
		return done(await updateGoal(String(fd.get('id') || ''), g));
	},

	archive: async ({ request }) => {
		const fd = await request.formData();
		return done(await updateGoal(String(fd.get('id') || ''), { archived: fd.get('archived') === '1' }));
	},

	delete: async ({ request }) => {
		const fd = await request.formData();
		return done(await deleteGoal(String(fd.get('id') || '')));
	},

	contribute: async ({ request, locals }) => {
		const fd = await request.formData();
		const amount = parseAmount(String(fd.get('amount') || ''));
		if (amount <= 0) return fail(400, { error: 'Isi nominal yang lebih dari 0.' });
		const sign = fd.get('kind') === 'withdraw' ? -1 : 1;
		const date = String(fd.get('date') || '');
		return done(
			await addContribution(String(fd.get('id') || ''), {
				amount: sign * amount,
				date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayJakarta(),
				note: String(fd.get('note') || '').trim().slice(0, 200),
				source: 'web',
				user: locals.user ?? ''
			})
		);
	},

	uncontribute: async ({ request }) => {
		const fd = await request.formData();
		return done(await deleteContribution(String(fd.get('logId') || '')));
	}
};
