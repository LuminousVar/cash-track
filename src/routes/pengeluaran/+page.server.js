import { fail } from '@sveltejs/kit';
import { getExpenses, updateExpense, deleteExpense } from '$lib/server/expenses.js';
import { checkBudgetAlert } from '$lib/server/budget.js';

export async function load() {
	return { expenses: await getExpenses() };
}

/**
 * Baca field pengeluaran dari FormData. Dipakai action `update`.
 * @param {FormData} fd
 */
function readFields(fd) {
	/** @type {{ name?: string, qty?: number, price?: number }[]} */
	let items = [];
	try {
		items = JSON.parse(String(fd.get('items') || '[]'));
	} catch {
		/* abaikan */
	}
	return {
		date: String(fd.get('date') || ''),
		category: String(fd.get('category') || 'Lainnya'),
		method: String(fd.get('method') || ''),
		merchant: String(fd.get('merchant') || ''),
		notes: String(fd.get('notes') || ''),
		items: items.map((i) => ({ name: String(i.name ?? ''), qty: Number(i.qty) || 0, price: Number(i.price) || 0 })),
		total: items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0)
	};
}

// Action update & delete didefinisikan sekali di sini; halaman lain (dashboard,
// riwayat) memposting ke "/pengeluaran?/update" lewat use:enhance.
export const actions = {
	update: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') || '');
		if (!id) return fail(400, { error: 'Transaksi ini belum punya ID. Jalankan scripts/backfill-ids.js dulu.' });

		const fields = readFields(fd);
		if (!fields.date || fields.total <= 0) {
			return fail(400, { error: 'Isi tanggal dan minimal satu barang dengan harga.' });
		}

		const { persisted, notFound } = await updateExpense(id, fields);
		if (notFound) return fail(404, { error: 'Transaksi tidak ditemukan, mungkin sudah dihapus.' });
		// Total bulan ini bisa berubah, jadi ambang anggaran perlu dicek ulang.
		if (persisted) void checkBudgetAlert();
		return { success: true, persisted, action: 'update' };
	},

	delete: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') || '');
		if (!id) return fail(400, { error: 'Transaksi ini belum punya ID. Jalankan scripts/backfill-ids.js dulu.' });

		const { persisted, notFound } = await deleteExpense(id);
		if (notFound) return fail(404, { error: 'Transaksi tidak ditemukan, mungkin sudah dihapus.' });
		if (persisted) void checkBudgetAlert();
		return { success: true, persisted, action: 'delete' };
	}
};
