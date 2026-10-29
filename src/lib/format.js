// Helper & konstanta yang aman dipakai di client maupun server.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const MONTHS_LONG = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const CATEGORIES = ['Makanan & Minuman', 'Belanja', 'Transport', 'Tagihan', 'Kesehatan', 'Hiburan', 'Investasi', 'Lainnya'];

/** Uang yang dipindahkan, bukan dihabiskan: tercatat, tapi tidak dihitung ke anggaran. */
export const INVESTMENT = 'Investasi';

export const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Transfer', 'Kartu Debit', 'Kartu Kredit', 'E-wallet'];

/** Jenis goal, urutan = urutan pilihan di form. */
export const GOAL_TYPES = ['Kebutuhan masa depan', 'Keinginan', 'Dana darurat', 'Lainnya'];

/**
 * Nominal dari teks bebas: "250000", "250.000", "100rb", "100k", "1,5jt", "2 juta".
 * 0 kalau tidak terbaca.
 * @param {string} s
 */
export function parseAmount(s) {
	const m = /^([\d.,]+)\s*(rb|ribu|k|jt|juta)?$/i.exec(String(s ?? '').trim());
	if (!m) return 0;
	const unit = (m[2] ?? '').toLowerCase();
	if (!unit) return Number(m[1].replace(/[.,]/g, '')) || 0;
	const n = parseFloat(m[1].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
	return Math.round((Number.isFinite(n) ? n : 0) * (unit === 'jt' || unit === 'juta' ? 1_000_000 : 1_000));
}

// Catat cepat lewat teks Telegram. Kata kunci dicocokkan dalam huruf kecil.
/** @type {Record<string, string>} */
const QUICK_CATEGORY = {
	makan: 'Makanan & Minuman',
	makanan: 'Makanan & Minuman',
	minum: 'Makanan & Minuman',
	minuman: 'Makanan & Minuman',
	belanja: 'Belanja',
	transport: 'Transport',
	transportasi: 'Transport',
	tagihan: 'Tagihan',
	kesehatan: 'Kesehatan',
	hiburan: 'Hiburan',
	investasi: 'Investasi',
	lainnya: 'Lainnya'
};
/** @type {Record<string, string>} */
const QUICK_METHOD = {
	tunai: 'Tunai', cash: 'Tunai',
	qris: 'QRIS',
	transfer: 'Transfer', tf: 'Transfer', trf: 'Transfer',
	debit: 'Kartu Debit',
	kredit: 'Kartu Kredit', cc: 'Kartu Kredit',
	ewallet: 'E-wallet', 'e-wallet': 'E-wallet', gopay: 'E-wallet', ovo: 'E-wallet', dana: 'E-wallet', shopeepay: 'E-wallet'
};
const QUICK_YESTERDAY = ['kemarin', 'kemaren', 'kmrn'];
const AMOUNT_UNIT = /^(rb|ribu|k|jt|juta)$/;

/**
 * Token untuk dicocokkan: huruf kecil, tanpa tanda baca di akhir.
 * @param {string | undefined} t
 */
const quickWord = (t) => (t ?? '').toLowerCase().replace(/[.,;:!?]+$/, '');

/**
 * @typedef {{ merchant: string, total: number, date: string, category: string, payment_method: string }} QuickEntry
 */

/**
 * Pengeluaran dari teks bebas: "kopi 25rb", "parkir 5000 transport",
 * "makan siang warteg 22.000 tunai", "grab 18k kemarin".
 * - Nominal dibaca parseAmount, termasuk "25 rb" dan awalan "rp". Kalau ada beberapa
 *   angka ("beli 2 kopi 50rb"), yang terbesar dianggap nominal.
 * - Kata kategori dan metode bayar hanya dibaca sesudah nominal, supaya "makan" di
 *   "makan siang warteg" tetap jadi bagian nama. Kata kategori di dalam nama tetap
 *   dipakai sebagai petunjuk kategori.
 * - "kemarin" di posisi mana pun memundurkan tanggal satu hari.
 * `category` kosong kalau tidak ada petunjuk, pemanggil yang menebak. null kalau tidak
 * ada nama atau nominal di luar Rp100 s.d. Rp1 miliar (angka iseng, nomor HP).
 * @param {string} text
 * @param {string} [today]  "YYYY-MM-DD" WIB
 * @returns {QuickEntry | null}
 */
export function parseQuickEntry(text, today = todayJakarta()) {
	const tokens = String(text ?? '').trim().split(/\s+/).filter(Boolean);

	let total = 0,
		at = -1,
		span = 0;
	tokens.forEach((tok, i) => {
		const t = quickWord(tok).replace(/^rp\.?/, '');
		const next = quickWord(tokens[i + 1]);
		const unit = /^[\d.,]+$/.test(t) && AMOUNT_UNIT.test(next) ? next : '';
		const n = parseAmount(t + unit);
		if (n > total) [total, at, span] = [n, i, unit ? 2 : 1];
	});
	if (total < 100 || total > 1_000_000_000) return null;

	let date = today,
		category = '',
		method = '';
	/** @type {string[]} */
	const name = [];
	/** @type {string[]} */
	const categoryWords = [];
	tokens.forEach((tok, i) => {
		if (i >= at && i < at + span) return;
		const w = quickWord(tok);
		if (w === 'rp') return;
		if (QUICK_YESTERDAY.includes(w)) date = addDays(today, -1);
		else if (i > at && QUICK_METHOD[w]) method ||= QUICK_METHOD[w];
		else if (i > at && QUICK_CATEGORY[w]) {
			category ||= QUICK_CATEGORY[w];
			categoryWords.push(tok);
		} else name.push(tok);
	});

	// "25rb makan": kata kategorinya sekalian jadi nama.
	const merchant = (name.length ? name : categoryWords).join(' ');
	if (!merchant) return null;
	category ||= name.map((t) => QUICK_CATEGORY[quickWord(t)]).find(Boolean) ?? '';
	return { merchant: merchant[0].toUpperCase() + merchant.slice(1), total, date, category, payment_method: method };
}

// Nama lama dan variasi yang mungkin ada di Sheet atau dikirim DeepSeek. Baris lama
// berkategori "Makanan" tidak perlu diubah: dibaca sebagai "Makanan & Minuman".
/** @type {Record<string, string>} */
const CATEGORY_ALIASES = {
	makanan: 'Makanan & Minuman',
	minuman: 'Makanan & Minuman',
	'makanan/minuman': 'Makanan & Minuman',
	'makanan dan minuman': 'Makanan & Minuman',
	investment: 'Investasi',
	investasi: 'Investasi'
};

/**
 * Kategori resmi untuk sebuah nilai. Di luar daftar dan alias jadi "Lainnya".
 * @param {unknown} category
 */
export function normCategory(category) {
	const s = String(category ?? '').trim();
	if (CATEGORIES.includes(s)) return s;
	return CATEGORY_ALIASES[s.toLowerCase()] ?? 'Lainnya';
}

/** Kunci token CSS per kategori (lihat --color-cat-* di layout.css). */
/** @type {Record<string, string>} */
const CATEGORY_KEYS = {
	'Makanan & Minuman': 'makanan',
	Belanja: 'belanja',
	Transport: 'transport',
	Tagihan: 'tagihan',
	Kesehatan: 'kesehatan',
	Hiburan: 'hiburan',
	Investasi: 'investasi',
	Lainnya: 'lainnya'
};

/**
 * Warna kategori sebagai CSS variable (didefinisikan per tema di layout.css).
 * Kategori di luar daftar memakai warna "Lainnya".
 * @param {string} category
 */
export function categoryColor(category) {
	return `var(--color-cat-${CATEGORY_KEYS[normCategory(category)]})`;
}

/**
 * True kalau transaksi ikut dihitung ke anggaran (semua kecuali Investasi).
 * @param {{ category: string }} e
 */
export const countsToBudget = (e) => normCategory(e.category) !== INVESTMENT;

/**
 * Status pemakaian anggaran: 'ok' di bawah ambang peringatan, 'warn' dari ambang
 * sampai 100%, 'over' di atas 100%. Satu sumber supaya semua halaman konsisten.
 * @param {number} pct
 * @param {number} warnPct
 * @returns {'ok' | 'warn' | 'over'}
 */
export function budgetStatus(pct, warnPct) {
	if (pct > 100) return 'over';
	if (pct >= warnPct) return 'warn';
	return 'ok';
}

/** Label dan token warna per status anggaran. */
export const STATUS_STYLE = {
	ok: { label: 'Aman', fg: 'text-success', bg: 'bg-success-bg', bar: 'bg-success' },
	warn: { label: 'Mendekati batas', fg: 'text-warn', bg: 'bg-warn-bg', bar: 'bg-warn' },
	over: { label: 'Melebihi anggaran', fg: 'text-danger', bg: 'bg-danger-bg', bar: 'bg-danger' }
};

/**
 * Posisi anggaran periode berjalan. Satu hitungan untuk panel Sisa anggaran, /sisa,
 * dan ringkasan harian Telegram.
 * - `daysIncl`: sisa hari termasuk hari ini, supaya jatah harian tidak membagi dengan
 *   nol di hari terakhir. `perDay` dibagi dengan ini.
 * - `nextPerDay`: jatah per hari mulai besok, untuk ringkasan malam saat hari ini
 *   dianggap selesai. 0 di hari terakhir periode.
 * @param {{ spent: number, budget: number, cycle: { days: number, dayIndex: number, daysLeft: number } }} p
 */
export function budgetOutlook({ spent, budget, cycle }) {
	const remaining = budget - spent;
	const daysIncl = Math.max(1, cycle.daysLeft + 1);
	return {
		pct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
		remaining,
		daysIncl,
		perDay: Math.max(0, Math.floor(remaining / daysIncl)),
		nextPerDay: cycle.daysLeft > 0 ? Math.max(0, Math.floor(remaining / cycle.daysLeft)) : 0,
		projected: Math.round((spent / Math.max(1, cycle.dayIndex)) * cycle.days)
	};
}

/**
 * Angka dengan pemisah ribuan titik untuk input, misalnya 20000 jadi "20.000".
 * @param {number} n
 */
export function formatNumber(n) {
	return n ? new Intl.NumberFormat('id-ID').format(Math.round(n)) : '';
}

/**
 * Ambil angka bulat dari teks berformat ("20.000", "Rp 20,000").
 * @param {string} s
 */
export function parseNumber(s) {
	return Number(String(s).replace(/[^\d]/g, '')) || 0;
}

/**
 * Format angka jadi Rupiah, misalnya 1250000 jadi "Rp 1.250.000".
 * @param {number} n
 */
export function formatRp(n) {
	return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0));
}

/**
 * Versi ringkas untuk label kecil, misalnya 1250000 jadi "1,3jt".
 * @param {number} n
 */
export function formatRpShort(n) {
	const v = Number(n) || 0;
	if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + 'jt';
	if (v >= 1_000) return Math.round(v / 1_000) + 'rb';
	return String(v);
}

// Periode gajian
// Satu periode berjalan dari tanggal `startDay` sampai `startDay - 1` bulan berikutnya,
// dan dinamai dengan bulan yang dibiayai gaji. Dengan startDay 25, 25 Sep s.d. 24 Okt
// adalah periode "2026-10". startDay 1 berarti bulan kalender biasa.

/** @param {number} n */
const pad = (n) => String(n).padStart(2, '0');

/**
 * Tanggal gajian yang valid (1 s.d. 28, supaya ada di setiap bulan).
 * @param {unknown} v
 */
export function normStartDay(v) {
	const n = Math.floor(Number(v)) || 1;
	return Math.min(28, Math.max(1, n));
}

/**
 * Tanggal hari ini di WIB, format "YYYY-MM-DD". Server Vercel berjalan di UTC.
 * @param {Date} [now]
 */
export function todayJakarta(now = new Date()) {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/**
 * Pecah tanggal jadi [tahun, bulan 1-12, hari]. Format sheet "YYYY-MM-DD" dibaca
 * langsung tanpa Date supaya tidak bergeser karena zona waktu.
 * @param {string} s
 * @returns {[number, number, number] | null}
 */
function ymd(s) {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
	if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
	const d = new Date(s);
	return Number.isNaN(d.getTime()) ? null : [d.getFullYear(), d.getMonth() + 1, d.getDate()];
}

/**
 * Selisih hari antara dua tanggal "YYYY-MM-DD" (b - a).
 * @param {string} a
 * @param {string} b
 */
export function daysBetween(a, b) {
	const [ay, am, ad] = ymd(a) ?? [1970, 1, 1];
	const [by, bm, bd] = ymd(b) ?? [1970, 1, 1];
	return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/**
 * Kunci periode "YYYY-MM" untuk sebuah tanggal. String kosong kalau tanggal tak terbaca.
 * @param {string} date
 * @param {number} [startDay]
 */
export function cycleKey(date, startDay = 1) {
	const p = ymd(date);
	if (!p) return '';
	let [y, m, d] = p;
	if (startDay > 1 && d >= startDay) {
		m++;
		if (m > 12) {
			m = 1;
			y++;
		}
	}
	return `${y}-${pad(m)}`;
}

/**
 * Tanggal awal, akhir, dan jumlah hari sebuah periode.
 * @param {string} key  "YYYY-MM"
 * @param {number} [startDay]
 */
export function cycleRange(key, startDay = 1) {
	const [y, m] = key.split('-').map(Number);
	let start, end;
	if (startDay <= 1) {
		start = `${key}-01`;
		end = `${key}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`;
	} else {
		const py = m === 1 ? y - 1 : y;
		const pm = m === 1 ? 12 : m - 1;
		start = `${py}-${pad(pm)}-${pad(startDay)}`;
		end = `${key}-${pad(startDay - 1)}`;
	}
	return { start, end, days: daysBetween(start, end) + 1 };
}

/**
 * Nama periode, misalnya "2026-10" jadi "Okt 2026".
 * @param {string} key
 */
export function cycleLabel(key) {
	const [y, m] = key.split('-').map(Number);
	return `${MONTHS[m - 1] ?? ''} ${y}`;
}

/**
 * Rentang tanggal periode, misalnya "25 Sep - 24 Okt". Kosong untuk bulan kalender.
 * @param {string} key
 * @param {number} [startDay]
 */
export function cycleRangeLabel(key, startDay = 1) {
	if (startDay <= 1) return '';
	const { start, end } = cycleRange(key, startDay);
	const [, sm, sd] = ymd(start) ?? [0, 1, 1];
	const [, em, ed] = ymd(end) ?? [0, 1, 1];
	return `${sd} ${MONTHS[sm - 1]} - ${ed} ${MONTHS[em - 1]}`;
}

/**
 * Kunci periode sebelumnya, misalnya "2026-01" jadi "2025-12".
 * @param {string} key
 */
export function prevCycleKey(key) {
	const [y, m] = key.split('-').map(Number);
	return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
}

/**
 * Laporan PDF sebuah periode bisa diunduh mulai hari terakhir periodenya. Dengan
 * gajian tanggal 25, laporan periode Okt (25 Sep - 24 Okt) terbuka tanggal 24 Okt.
 * @param {string} key
 * @param {number} startDay
 * @param {string} today  "YYYY-MM-DD" (WIB)
 */
export function reportReady(key, startDay, today) {
	return today >= cycleRange(key, startDay).end;
}

/**
 * Geser tanggal "YYYY-MM-DD" sebanyak `n` hari.
 * @param {string} iso
 * @param {number} n
 */
export function addDays(iso, n) {
	const [y, m, d] = ymd(iso) ?? [1970, 1, 1];
	const t = new Date(Date.UTC(y, m - 1, d + n));
	return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/**
 * Tanggal dan bulan singkat, misalnya "2026-10-05" jadi "5 Okt".
 * @param {string} iso
 */
export function formatDayMonth(iso) {
	const p = ymd(iso);
	return p ? `${p[2]} ${MONTHS[p[1] - 1]}` : (iso ?? '');
}

/**
 * Tanggal dengan nama hari, misalnya "Kamis, 24 Sep 2026". Dibaca dari komponen
 * string supaya tidak bergeser karena zona waktu.
 * @param {string} iso
 */
export function formatDay(iso) {
	const p = ymd(iso);
	if (!p) return iso ?? '';
	const d = new Date(p[0], p[1] - 1, p[2]);
	const day = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
	return `${day}, ${p[2]} ${MONTHS[p[1] - 1]} ${p[0]}`;
}

/**
 * Tanggal panjang tanpa nama hari, misalnya "24 Oktober 2026".
 * @param {string} iso
 */
export function formatLongDate(iso) {
	const p = ymd(iso);
	return p ? `${p[2]} ${MONTHS_LONG[p[1] - 1]} ${p[0]}` : (iso ?? '');
}

/**
 * Format tanggal ISO jadi "02 Jul 2024".
 * @param {string} iso
 */
export function formatDate(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso ?? '';
	return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
