// Lapisan data pengeluaran: baca/tulis Google Sheet + hitung ringkasan dashboard.
// Saat env Google belum diisi (dev), pakai DEMO agar dashboard tetap tampil penuh.
import { env } from '$env/dynamic/private';
import { readRows, appendRow, updateRow, deleteRow, isConfigured, SHEET_TAB } from './google.js';
import { readConfig } from './config.js';
import { currentCycle } from './cycle.js';
import { MONTHS, CATEGORIES, cycleKey, prevCycleKey } from '$lib/format.js';

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

/**
 * Tandai nilai sebagai teks biasa untuk Sheets (valueInputOption=USER_ENTERED).
 * Tanpa awalan ', teks OCR seperti "+62 812..." atau "=..." dibaca sebagai angka
 * atau rumus, dan id seperti "12e45678" jadi notasi ilmiah. Awalan ' tidak ikut
 * tersimpan sebagai isi sel, jadi nilai yang dibaca kembali tetap sama.
 * @param {string} v
 */
const text = (v) => (v ? `'${v}` : '');

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
 * "Bulan" di sini = periode gajian (lihat cycle.js), bukan bulan kalender.
 * @param {Expense[]} expenses
 */
function computeDashboard(expenses) {
	const cycle = currentCycle();
	const [year, monthNum] = cycle.key.split('-').map(Number);
	const month = monthNum - 1;
	const prevKey = prevCycleKey(cycle.key);
	const flow = MONTHS.map((m) => ({ month: m, amount: 0, telegram: 0 }));
	/** @type {Record<string, number>} */
	const catThisMonth = {};
	let totalAllTime = 0,
		prevPeriod = 0,
		count = 0,
		fromTelegram = 0,
		fromManual = 0;

	for (const e of expenses) {
		const amt = e.total;
		totalAllTime += amt;
		const key = cycleKey(e.date, cycle.startDay);
		if (!key) continue;
		const [ky, km] = key.split('-').map(Number);
		if (ky === year) {
			flow[km - 1].amount += amt;
			if (e.source === 'telegram') flow[km - 1].telegram += amt;
		}
		if (key === prevKey) prevPeriod += amt;
		if (key === cycle.key) {
			count++;
			// Kategori di luar daftar (mis. diedit langsung di Sheet) masuk "Lainnya".
			const cat = CATEGORIES.includes(e.category) ? e.category : 'Lainnya';
			catThisMonth[cat] = (catThisMonth[cat] || 0) + amt;
			e.source === 'manual' ? fromManual++ : fromTelegram++;
		}
	}

	const thisMonth = flow[month].amount;
	const budget = monthlyBudget();
	// Semua kategori yang punya pengeluaran di periode ini, terbesar dulu.
	const categories = Object.entries(catThisMonth)
		.sort((a, b) => b[1] - a[1])
		.map(([name, amount]) => ({ name, amount }));

	return {
		monthlyFlow: flow,
		categories,
		summary: {
			totalAllTime,
			thisYear: flow.reduce((s, m) => s + m.amount, 0),
			thisMonth,
			prevPeriod,
			dailyAvg: Math.round(thisMonth / Math.max(1, cycle.dayIndex)),
			budget,
			budgetPct: Math.round((thisMonth / budget) * 100),
			count,
			fromTelegram,
			fromManual,
			cycle
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
		return { demo: true, monthlyFlow: DEMO.monthlyFlow, summary: demoSummary(), categoryTotals: DEMO_CATEGORY_TOTALS };
	}
	const expenses = await listExpenses();
	const { summary, monthlyFlow } = computeDashboard(expenses);
	// Periode sama dengan monthlyFlow (tahun periode berjalan). Kategori di luar daftar
	// (mis. hasil edit manual di Sheet) masuk "Lainnya" supaya totalnya tetap cocok.
	const year = summary.cycle.key.slice(0, 4);
	/** @type {Record<string, number>} */
	const map = {};
	for (const e of expenses) {
		if (cycleKey(e.date, summary.cycle.startDay).slice(0, 4) !== year) continue;
		const cat = CATEGORIES.includes(e.category) ? e.category : 'Lainnya';
		map[cat] = (map[cat] || 0) + e.total;
	}
	const categoryTotals = CATEGORIES.map((c) => ({ name: c, amount: map[c] || 0 })).sort((a, b) => b.amount - a.amount);
	return { demo: false, monthlyFlow, summary, categoryTotals };
}

/** Data untuk halaman dashboard. Pakai DEMO bila Sheet belum dikonfigurasi. */
export async function getDashboardData() {
	if (!isConfigured()) return { ...DEMO, transactions: DEMO.transactions.slice(0, 8), summary: demoSummary(), demo: true };
	const expenses = await listExpenses();
	const { summary, monthlyFlow, categories } = computeDashboard(expenses);
	return { transactions: expenses.slice(0, 8), summary, monthlyFlow, categories, demo: false };
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
		text(input.merchant || ''), // merchant
		String(Math.round(Number(input.total) || 0)), // total
		'IDR', // currency
		text(input.category || 'Lainnya'), // category
		text(input.method || ''), // payment_method
		text(JSON.stringify(input.items ?? [])), // items
		'', // photo_url
		'', // raw_text
		'manual', // source
		text(input.user || 'manual'), // user
		text(input.notes || ''), // notes
		text(id) // id
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
		text(parsed.merchant || ''), // merchant
		String(Math.round(Number(parsed.total) || 0)), // total
		parsed.currency || 'IDR', // currency
		text(parsed.category || 'Lainnya'), // category
		text(parsed.payment_method || ''), // payment_method
		text(JSON.stringify(parsed.items ?? [])), // items
		text(fileId), // photo_url (Telegram file_id)
		text(rawText), // raw_text (OCR)
		'telegram', // source
		text(String(user)), // user
		'', // notes
		text(id) // id
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
	// Baris ditulis ulang utuh, jadi kolom teks lama juga perlu ditandai ulang.
	const row = [
		o.timestamp,
		patch.date ?? o.date,
		text(patch.merchant ?? o.merchant),
		String(Math.round(Number(patch.total ?? o.total) || 0)),
		o.currency || 'IDR',
		text(patch.category ?? o.category),
		text(patch.method ?? o.payment_method),
		text(JSON.stringify(items)),
		text(o.photo_url),
		text(o.raw_text),
		o.source,
		text(o.user),
		text(patch.notes ?? o.notes),
		text(id)
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
 * Cari struk Telegram yang sudah tersimpan berdasarkan file_id fotonya.
 * Dipakai webhook supaya update yang dikirim ulang Telegram tidak tercatat dua kali.
 * Baca langsung (bukan cache) karena instance lain bisa baru saja menulis.
 * @param {string} fileId
 */
export async function findByPhoto(fileId) {
	if (!isConfigured() || !fileId) return null;
	const rows = await readRows();
	_cache = { rows, at: Date.now() };
	const col = HEADER.indexOf('photo_url');
	for (let i = rows.length - 1; i >= 1; i--) {
		if ((rows[i][col] ?? '') === fileId) return rowToExpense(rows[i], i + 1);
	}
	return null;
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
	// Jumlahnya = summary.thisMonth.
	categories: [
		{ name: 'Makanan', amount: 2_850_000 },
		{ name: 'Transport', amount: 1_640_000 },
		{ name: 'Belanja', amount: 1_430_000 },
		{ name: 'Tagihan', amount: 600_000 },
		{ name: 'Hiburan', amount: 350_000 },
		{ name: 'Kesehatan', amount: 200_000 },
		{ name: 'Lainnya', amount: 55_000 }
	],
	summary: {
		totalAllTime: 70_875_000, thisYear: 70_875_000, thisMonth: 7_125_000, prevPeriod: 5_400_000, dailyAvg: 237_500,
		budget: 9_500_000, budgetPct: 75, count: 142, fromTelegram: 118, fromManual: 24
	}
};

/** Ringkasan demo + info periode berjalan, supaya bentuknya sama dengan data asli. */
const demoSummary = () => ({ ...DEMO.summary, cycle: currentCycle() });
