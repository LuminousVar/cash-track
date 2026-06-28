// Data contoh untuk dashboard. Nanti diganti hasil readRows() dari Google Sheet
// di +page.server.js (lihat RENCANA.md). Struktur baris mengikuti skema kolom final.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const CATEGORIES = ['Makanan', 'Belanja', 'Transport', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'];

export const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Transfer', 'Kartu Debit', 'Kartu Kredit', 'E-wallet'];

/** Warna chip/avatar per kategori (selaras palet brand). */
export const CATEGORY_TONE = {
	Makanan: { bg: '#ecf4e5', fg: '#2e5c45' },
	Belanja: { bg: '#e4f5ee', fg: '#1f8d68' },
	Transport: { bg: '#f1f8db', fg: '#6f9216' },
	Tagihan: { bg: '#eef0f1', fg: '#4b5563' },
	Kesehatan: { bg: '#e4f5ee', fg: '#1f8d68' },
	Hiburan: { bg: '#f1f8db', fg: '#6f9216' },
	Lainnya: { bg: '#eef0f1', fg: '#6b7280' }
};

/** Format angka jadi Rupiah: 1250000 → "Rp 1.250.000". */
export function formatRp(n) {
	return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0));
}

/** Versi ringkas untuk label kecil: 1250000 → "1,3jt". */
export function formatRpShort(n) {
	const v = Number(n) || 0;
	if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + 'jt';
	if (v >= 1_000) return Math.round(v / 1_000) + 'rb';
	return String(v);
}

/** Format tanggal ISO → "02 Jul 2024". */
export function formatDate(iso) {
	const d = new Date(iso);
	return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Total pengeluaran per bulan (Rupiah) — sumber chart "Arus Pengeluaran".
export const monthlyFlow = [
	{ month: 'Jan', amount: 4_200_000 },
	{ month: 'Feb', amount: 3_850_000 },
	{ month: 'Mar', amount: 5_100_000 },
	{ month: 'Apr', amount: 4_600_000 },
	{ month: 'Mei', amount: 6_200_000 },
	{ month: 'Jun', amount: 5_400_000 },
	{ month: 'Jul', amount: 7_125_000 },
	{ month: 'Agu', amount: 6_800_000 },
	{ month: 'Sep', amount: 5_900_000 },
	{ month: 'Okt', amount: 6_500_000 },
	{ month: 'Nov', amount: 7_000_000 },
	{ month: 'Des', amount: 8_200_000 }
];

// Pengeluaran terbesar bulan ini per kategori.
export const topCategories = [
	{ name: 'Makanan', amount: 2_850_000, tone: 'forest' },
	{ name: 'Transport', amount: 1_640_000, tone: 'lime' },
	{ name: 'Belanja', amount: 1_430_000, tone: 'emerald' }
];

const THIS_MONTH = 7_125_000;
const BUDGET = 9_500_000;

export const summary = {
	totalAllTime: monthlyFlow.reduce((s, m) => s + m.amount, 0),
	thisMonth: THIS_MONTH,
	dailyAvg: Math.round(THIS_MONTH / 30),
	budget: BUDGET,
	budgetPct: Math.round((THIS_MONTH / BUDGET) * 100),
	count: 142,
	fromTelegram: 118,
	fromManual: 24
};

// Riwayat transaksi (terbaru). source: 'telegram' (ada struk) | 'manual' (input web).
export const transactions = [
	{ merchant: 'Indomaret', date: '2024-07-02', category: 'Belanja', method: 'QRIS', total: 87_500, source: 'telegram' },
	{ merchant: 'Gojek', date: '2024-07-02', category: 'Transport', method: 'E-wallet', total: 32_000, source: 'telegram' },
	{ merchant: 'Kopi Kenangan', date: '2024-07-01', category: 'Makanan', method: 'QRIS', total: 25_000, source: 'telegram' },
	{ merchant: 'Token Listrik PLN', date: '2024-07-01', category: 'Tagihan', method: 'Transfer', total: 200_000, source: 'manual' },
	{ merchant: 'Tokopedia', date: '2024-06-30', category: 'Belanja', method: 'Kartu Kredit', total: 349_000, source: 'telegram' },
	{ merchant: 'Warteg Bahari', date: '2024-06-30', category: 'Makanan', method: 'Tunai', total: 18_000, source: 'manual' },
	{ merchant: 'Netflix', date: '2024-06-29', category: 'Hiburan', method: 'Kartu Kredit', total: 186_000, source: 'telegram' },
	{ merchant: 'Apotek K24', date: '2024-06-29', category: 'Kesehatan', method: 'Tunai', total: 64_000, source: 'manual' }
];
