// Lapisan data pengeluaran: baca/tulis Google Sheet + hitung ringkasan dashboard.
// Saat env Google belum diisi (dev), pakai DEMO agar dashboard tetap tampil penuh.
import { env } from '$env/dynamic/private';
import { readRows, appendRow, isConfigured, SHEET_TAB } from './google.js';
import { MONTHS, CATEGORIES } from '$lib/format.js';

export { isConfigured };

// Urutan kolom header di Sheet (13 kolom). Lihat plan.
export const HEADER = [
	'timestamp', 'date', 'merchant', 'total', 'currency', 'category',
	'payment_method', 'items', 'photo_url', 'raw_text', 'source', 'user', 'notes'
];

function monthlyBudget() {
	return Number(env.MONTHLY_BUDGET) || 9_500_000;
}

/**
 * @typedef {{ merchant: string, date: string, category: string, method: string, total: number, source: 'telegram' | 'manual', notes?: string }} Expense
 */

/**
 * Baris sheet → objek pengeluaran yang dipakai UI.
 * @param {string[]} row
 * @returns {Expense}
 */
function rowToExpense(row) {
	/** @type {Record<string, string>} */
	const o = {};
	HEADER.forEach((h, i) => (o[h] = row[i] ?? ''));
	return {
		merchant: o.merchant,
		date: o.date,
		category: o.category,
		method: o.payment_method,
		total: Number(o.total) || 0,
		source: o.source === 'manual' ? 'manual' : 'telegram',
		notes: o.notes
	};
}

/** Ambil semua pengeluaran (terbaru dulu). */
export async function listExpenses() {
	const rows = await readRows();
	if (rows.length <= 1) return [];
	return rows
		.slice(1)
		.map(rowToExpense)
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

/** Laporan: arus bulanan, ringkasan, dan total per kategori (all-time). */
export async function getReport() {
	if (!isConfigured()) {
		return { demo: true, monthlyFlow: DEMO.monthlyFlow, summary: DEMO.summary, categoryTotals: DEMO_CATEGORY_TOTALS };
	}
	const expenses = await listExpenses();
	const { summary, monthlyFlow } = computeDashboard(expenses);
	/** @type {Record<string, number>} */
	const map = {};
	for (const e of expenses) map[e.category] = (map[e.category] || 0) + e.total;
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
		input.notes || '' // notes
	];
	await appendRow(row, SHEET_TAB);
	return { persisted: true };
}

/**
 * Simpan hasil struk dari Telegram ke Sheet (source='telegram').
 * @param {import('./deepseek.js').ParsedReceipt} parsed
 * @param {{ fileId?: string, rawText?: string, user?: string | number }} meta
 */
export async function addReceipt(parsed, { fileId = '', rawText = '', user = '' }) {
	if (!isConfigured()) return { persisted: false };
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
		'' // notes
	];
	await appendRow(row, SHEET_TAB);
	return { persisted: true };
}

// ── Data contoh (dev/preview) ───────────────────────────────────────────────
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

// Total per kategori (all-time) untuk demo — jumlahnya = DEMO.summary.totalAllTime.
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
		totalAllTime: 70_875_000, thisMonth: 7_125_000, dailyAvg: 237_500,
		budget: 9_500_000, budgetPct: 75, count: 142, fromTelegram: 118, fromManual: 24
	}
};
