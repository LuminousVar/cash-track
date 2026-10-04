import { fail } from '@sveltejs/kit';
import { getDashboardData, addExpense } from '$lib/server/expenses.js';
import { checkBudgetAlert, getWarnPct } from '$lib/server/budget.js';

export async function load() {
	const data = await getDashboardData();
	return { ...data, warnPct: getWarnPct() };
}

export const actions = {
	// Tambah pengeluaran manual (source='manual').
	add: async ({ request, locals }) => {
		const fd = await request.formData();
		const date = String(fd.get('date') || '');
		const category = String(fd.get('category') || 'Lainnya');
		const method = String(fd.get('method') || '');
		const merchant = String(fd.get('merchant') || '');
		const notes = String(fd.get('notes') || '');

		/** @type {{ name?: string, qty?: number, price?: number }[]} */
		let items = [];
		try {
			items = JSON.parse(String(fd.get('items') || '[]'));
		} catch {
			/* abaikan */
		}
		// Total dibayar dari form (bisa beda dari jumlah barang karena diskon/pajak).
		const total =
			Math.round(Number(fd.get('total'))) ||
			items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);

		if (!date || total <= 0) {
			return fail(400, { error: 'Isi tanggal dan total yang lebih dari 0.' });
		}

		const { persisted } = await addExpense({ date, category, method, merchant, notes, items, total, user: locals.user || 'manual' });
		if (persisted) void checkBudgetAlert();
		return { success: true, persisted };
	}
};
