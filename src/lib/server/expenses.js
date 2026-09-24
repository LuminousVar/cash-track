// Lapisan data pengeluaran: baca/tulis Google Sheet + hitung ringkasan dashboard.
// Saat env Google belum diisi (dev), pakai DEMO agar dashboard tetap tampil penuh.
import { env } from '$env/dynamic/private';
import { readRows, appendRow, updateRow, deleteRow, isConfigured, SHEET_TAB } from './google.js';
import { readConfig } from './config.js';
import { MONTHS, CATEGORIES } from '$lib/format.js';

export { isConfigured };

// Urutan kolom header di Sheet (14 kolom). `id` sengaja ditaruh paling belakang
// supaya sheet lama yang masih 13 kolom tetap terbaca. Baris lama id-nya kosong
// sampai di-backfill (lihat scripts/backfill-ids.js).
export const HEADER = [
	'timestamp', 'date', 'merchant', 'total', 'currency', 'category',
	'payment_method', 'items', 'photo_url', 'raw_text', 'source', 'user', 'notes', 'id'
];

const ID_COL = HEADER.indexOf('id');
const USER_COL = HEADER.indexOf('user');

/** ID pendek: cukup unik untuk skala personal, cukup ringkas untuk pesan Telegram. */
const newId = () => crypto.randomUUID().slice(0, 8);

// Cache baris sheet
// Per-instance & berumur pendek. Di Vercel ikut hilang saat instance daur ulang;
// itu tidak masalah karena tak ada state yang bergantung padanya.
const CACHE_TTL = 60_000;

/** @type {{ rows: string[][], at: number } | null} */
let _cache = null;

async function cachedRows() {
	if (_cache && Date.now() - _cache.at < CACHE_TTL) return _cache.rows;
	const rows = await readRows();
	_cache = { rows, at: Date.now() };
	return rows;
}

/** Buang cache. WAJIB dipanggil setiap kali sheet berubah. */
function invalidate() {
	_cache = null;
}

function monthlyBudget() {
	const cfg = readConfig();
	return Number(cfg.MONTHLY_BUDGET || env.MONTHLY_BUDGET) || 9_500_000;
}

/**
 * @typedef {{ name: string, qty: number, price: number }} Item
 * @typedef {{ merchant: string, date: string, category: string, method: string, total: number, source: 'telegram' | 'manual', notes?: string, id?: string, rowNumber?: number, items?: Item[] }} Expense
 */

/**
 * Parse kolom `items` (JSON string) jadi array. Aman terhadap isi rusak.
 * @param {string} raw
 * @returns {Item[]}
 */
function parseItems(raw) {
	try {
		const v = JSON.parse(raw || '[]');
		if (!Array.isArray(v)) return [];
		return v.map((i) => ({ name: String(i?.name ?? ''), qty: Number(i?.qty) || 0, price: Number(i?.price) || 0 }));
	} catch {
		return [];
	}
}

/**
 * Ubah baris sheet jadi objek pengeluaran yang dipakai UI.
 * @param {string[]} row
 * @param {number} [rowNumber]  nomor baris di sheet (1-based), untuk update/delete
 * @returns {Expense}
 */
function rowToExpense(row, rowNumber = 0) {
	/** @type {Record<string, string>} */
	const o = {};
	HEADER.forEach((h, i) => (o[h] = row[i] ?? ''));
	return {
		id: o.id,
		rowNumber,
		merchant: o.merchant,
		date: o.date,
		category: o.category,
		method: o.payment_method,
		total: Number(o.total) || 0,
		items: parseItems(o.items),
		source: o.source === 'manual' ? 'manual' : 'telegram',
		notes: o.notes
	};
}

/** Ambil semua pengeluaran (terbaru dulu). */
export async function listExpenses() {
	const rows = await cachedRows();
	if (rows.length <= 1) return [];
	// Nomor baris ditangkap SEBELUM sort, karena setelah diurutkan posisi array tidak
	// lagi mencerminkan posisi di sheet. Baris 1 = header, jadi offset +2.
	return rows
		.slice(1)
		.map((row, i) => rowToExpense(row, i + 2))
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Hitung ringkasan, arus bulanan, dan kategori teratas dari daftar pengeluaran.
 * @param {Expense[]} expenses
 */
function computeDashboard(expenses) {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const flow = MONTHS.map((m) => ({ month: m, amount: 0, telegram: 0 }));
	/** @type {Record<string, number>} */
	const catThisMonth = {};
	let totalAllTime = 0,
		count = 0,
		fromTelegram = 0,
		fromManual = 0;

	for (const e of expenses) {
		const amt = e.total;
		totalAllTime += amt;
		const d = new Date(e.date);
		if (Number.isNaN(d.getTime())) continue;
		if (d.getFullYear() === year) {
			flow[d.getMonth()].amount += amt;
			if (e.source === 'telegram') flow[d.getMonth()].telegram += amt;
		}
		if (d.getFullYear() === year && d.getMonth() === month) {
			count++;
			catThisMonth[e.category] = (catThisMonth[e.category] || 0) + amt;
			e.source === 'manual' ? fromManual++ : fromTelegram++;
		}
	}

	const thisMonth = flow[month].amount;
	const budget = monthlyBudget();
	const tones = ['forest', 'lime', 'emerald'];
	const topCategories = Object.entries(catThisMonth)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([name, amount], i) => ({ name, amount, tone: tones[i] }));

	return {
		monthlyFlow: flow,
		topCategories,
		summary: {
			totalAllTime,
			thisYear: flow.reduce((s, m) => s + m.amount, 0),
			thisMonth,
			dailyAvg: Math.round(thisMonth / Math.max(1, now.getDate())),
			budget,
			budgetPct: Math.round((thisMonth / budget) * 100),
			count,
			fromTelegram,
			fromManual
		}
	};
}

/** Semua pengeluaran (terbaru dulu). DEMO bila Sheet belum dikonfigurasi. */
export async function getExpenses() {
	return isConfigured() ? listExpenses() : DEMO.transactions;
}

/** Anggaran bulanan aktif (dari env, default). */
export function getBudget() {
	return monthlyBudget();
}

/** Laporan: arus bulanan, ringkasan, dan total per kategori (tahun berjalan). */
export async function getReport() {
	if (!isConfigured()) {
		return { demo: true, monthlyFlow: DEMO.monthlyFlow, summary: DEMO.summary, categoryTotals: DEMO_CATEGORY_TOTALS };
	}
	const expenses = await listExpenses();
	const { summary, monthlyFlow } = computeDashboard(expenses);
	// Periode sama dengan monthlyFlow (tahun berjalan). Kategori di luar daftar
	// (mis. hasil edit manual di Sheet) masuk "Lainnya" supaya totalnya tetap cocok.
	const year = new Date().getFullYear();
	/** @type {Record<string, number>} */
	const map = {};
	for (const e of expenses) {
		if (new Date(e.date).getFullYear() !== year) continue;
		const cat = CATEGORIES.includes(e.category) ? e.category : 'Lainnya';
		map[cat] = (map[cat] || 0) + e.total;
	}
	const categoryTotals = CATEGORIES.map((c) => ({ name: c, amount: map[c] || 0 })).sort((a, b) => b.amount - a.amount);
	return { demo: false, monthlyFlow, summary, categoryTotals };
}

/** Data untuk halaman dashboard. Pakai DEMO bila Sheet belum dikonfigurasi. */
export async function getDashboardData() {
	if (!isConfigured()) return { ...DEMO, demo: true };
	const expenses = await listExpenses();
	const { summary, monthlyFlow, topCategories } = computeDashboard(expenses);
	return { transactions: expenses.slice(0, 12), summary, monthlyFlow, topCategories, demo: false };
}

/**
 * Tambah pengeluaran manual ke Sheet (source='manual').
 * @param {{ date: string, category?: string, method?: string, merchant?: string, notes?: string, items?: unknown[], total: number, user?: string }} input
 */
export async function addExpense(input) {
	if (!isConfigured()) return { persisted: false };
	const id = newId();
	const row = [
		new Date().toISOString(), // timestamp
		input.date, // date
		input.merchant || '', // merchant
		String(Math.round(Number(input.total) || 0)), // total
		'IDR', // currency
		input.category || 'Lainnya', // category
		input.method || '', // payment_method
		JSON.stringify(input.items ?? []), // items
		'', // photo_url
		'', // raw_text
		'manual', // source
		input.user || 'manual', // user
		input.notes || '', // notes
		id // id
	];
	await appendRow(row, SHEET_TAB);
	invalidate();
	return { persisted: true, id };
}

/**
 * Simpan hasil struk dari Telegram ke Sheet (source='telegram').
 * @param {import('./deepseek.js').ParsedReceipt} parsed
 * @param {{ fileId?: string, rawText?: string, user?: string | number }} meta
 */
export async function addReceipt(parsed, { fileId = '', rawText = '', user = '' }) {
	if (!isConfigured()) return { persisted: false };
	const id = newId();
	const row = [
		new Date().toISOString(), // timestamp
		parsed.date, // date
		parsed.merchant || '', // merchant
		String(Math.round(Number(parsed.total) || 0)), // total
		parsed.currency || 'IDR', // currency
		parsed.category || 'Lainnya', // category
		parsed.payment_method || '', // payment_method
		JSON.stringify(parsed.items ?? []), // items
		fileId, // photo_url (Telegram file_id)
		rawText, // raw_text (OCR)
		'telegram', // source
		String(user), // user
		'', // notes
		id // id
	];
	await appendRow(row, SHEET_TAB);
	invalidate();
	return { persisted: true, id };
}

// Ubah & hapus

/**
 * Cari baris berdasarkan id. Sengaja baca langsung (bukan cache) supaya nomor
 * baris akurat. Webhook Telegram bisa menyisipkan baris kapan saja antara
 * halaman dirender dan form dikirim.
 * @param {string} id
 * @returns {Promise<{ row: string[], rowNumber: number } | null>}
 */
async function findById(id) {
	if (!id) return null;
	const rows = await readRows();
	_cache = { rows, at: Date.now() };
	for (let i = 1; i < rows.length; i++) {
		if ((rows[i][ID_COL] ?? '') === id) return { row: rows[i], rowNumber: i + 1 };
	}
	return null;
}

/**
 * Ubah sebagian field satu pengeluaran. Field yang tidak boleh diubah
 * (timestamp, source, raw_text, photo_url, user, id) dipertahankan apa adanya.
 * @param {string} id
 * @param {{ date?: string, merchant?: string, total?: number, category?: string, method?: string, notes?: string, items?: Item[] }} patch
 */
export async function updateExpense(id, patch) {
	if (!isConfigured()) return { persisted: false };
	const found = await findById(id);
	if (!found) return { persisted: false, notFound: true };

	/** @type {Record<string, string>} */
	const o = {};
	HEADER.forEach((h, i) => (o[h] = found.row[i] ?? ''));

	const items = patch.items ?? parseItems(o.items);
	const row = [
		o.timestamp,
		patch.date ?? o.date,
		patch.merchant ?? o.merchant,
		String(Math.round(Number(patch.total ?? o.total) || 0)),
		o.currency || 'IDR',
		patch.category ?? o.category,
		patch.method ?? o.payment_method,
		JSON.stringify(items),
		o.photo_url,
		o.raw_text,
		o.source,
		o.user,
		patch.notes ?? o.notes,
		id
	];

	await updateRow(found.rowNumber, row, SHEET_TAB);
	invalidate();
	return { persisted: true };
}

/**
 * Hapus satu pengeluaran. Mengembalikan data yang dihapus untuk pesan konfirmasi.
 * @param {string} id
 */
export async function deleteExpense(id) {
	if (!isConfigured()) return { persisted: false };
	const found = await findById(id);
	if (!found) return { persisted: false, notFound: true };

	const expense = rowToExpense(found.row, found.rowNumber);
	await deleteRow(found.rowNumber, SHEET_TAB);
	invalidate();
	return { persisted: true, expense };
}

/**
 * Pengeluaran terakhir yang masuk lewat Telegram dari user tertentu.
 * Dipakai `/hapus` tanpa argumen.
 * @param {string | number | undefined} user
 */
export async function lastTelegramExpense(user) {
	if (!isConfigured() || user === undefined) return null;
	const rows = await readRows();
	_cache = { rows, at: Date.now() };
	for (let i = rows.length - 1; i >= 1; i--) {
		const e = rowToExpense(rows[i], i + 1);
		if (e.source === 'telegram' && String(rows[i][USER_COL] ?? '') === String(user) && e.id) return e;
	}
	return null;
}

// Data contoh (dev/preview)
/** @type {Expense[]} */
const DEMO_TX = [
	{ merchant: 'Indomaret', date: '2024-07-02', category: 'Belanja', method: 'QRIS', total: 87_500, source: 'telegram' },
	{ merchant: 'Gojek', date: '2024-07-02', category: 'Transport', method: 'E-wallet', total: 32_000, source: 'telegram' },
	{ merchant: 'Kopi Kenangan', date: '2024-07-01', category: 'Makanan', method: 'QRIS', total: 25_000, source: 'telegram' },
	{ merchant: 'Token Listrik PLN', date: '2024-07-01', category: 'Tagihan', method: 'Transfer', total: 200_000, source: 'manual' },
	{ merchant: 'Tokopedia', date: '2024-06-30', category: 'Belanja', method: 'Kartu Kredit', total: 349_000, source: 'telegram' },
	{ merchant: 'Warteg Bahari', date: '2024-06-30', category: 'Makanan', method: 'Tunai', total: 18_000, source: 'manual' },
	{ merchant: 'Netflix', date: '2024-06-29', category: 'Hiburan', method: 'Kartu Kredit', total: 186_000, source: 'telegram' },
	{ merchant: 'Apotek K24', date: '2024-06-29', category: 'Kesehatan', method: 'Tunai', total: 64_000, source: 'manual' }
];

// Total per kategori untuk demo. Jumlahnya = DEMO.summary.thisYear.
const DEMO_CATEGORY_TOTALS = [
	{ name: 'Makanan', amount: 24_500_000 },
	{ name: 'Belanja', amount: 16_200_000 },
	{ name: 'Transport', amount: 11_800_000 },
	{ name: 'Tagihan', amount: 9_400_000 },
	{ name: 'Hiburan', amount: 4_600_000 },
	{ name: 'Kesehatan', amount: 2_900_000 },
	{ name: 'Lainnya', amount: 1_475_000 }
];

const DEMO = {
	transactions: DEMO_TX,
	monthlyFlow: [
		{ month: 'Jan', amount: 4_200_000, telegram: 200_000 },
		{ month: 'Feb', amount: 3_850_000, telegram: 350_000 },
		{ month: 'Mar', amount: 5_100_000, telegram: 700_000 },
		{ month: 'Apr', amount: 4_600_000, telegram: 1_000_000 },
		{ month: 'Mei', amount: 6_200_000, telegram: 1_900_000 },
		{ month: 'Jun', amount: 5_400_000, telegram: 2_300_000 },
		{ month: 'Jul', amount: 7_125_000, telegram: 3_400_000 },
		{ month: 'Agu', amount: 6_800_000, telegram: 3_700_000 },
		{ month: 'Sep', amount: 5_900_000, telegram: 3_600_000 },
		{ month: 'Okt', amount: 6_500_000, telegram: 4_400_000 },
		{ month: 'Nov', amount: 7_000_000, telegram: 5_200_000 },
		{ month: 'Des', amount: 8_200_000, telegram: 6_400_000 }
	],
	topCategories: [
		{ name: 'Makanan', amount: 2_850_000, tone: 'forest' },
		{ name: 'Transport', amount: 1_640_000, tone: 'lime' },
		{ name: 'Belanja', amount: 1_430_000, tone: 'emerald' }
	],
	summary: {
		totalAllTime: 70_875_000, thisYear: 70_875_000, thisMonth: 7_125_000, dailyAvg: 237_500,
		budget: 9_500_000, budgetPct: 75, count: 142, fromTelegram: 118, fromManual: 24
	}
};
