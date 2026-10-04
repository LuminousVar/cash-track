// Helper & konstanta yang aman dipakai di client maupun server.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const CATEGORIES = ['Makanan', 'Belanja', 'Transport', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'];

export const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Transfer', 'Kartu Debit', 'Kartu Kredit', 'E-wallet'];

/**
 * Warna kategori sebagai CSS variable (didefinisikan per tema di layout.css).
 * Kategori di luar daftar memakai warna "Lainnya".
 * @param {string} category
 */
export function categoryColor(category) {
	const key = CATEGORIES.includes(category) ? category.toLowerCase() : 'lainnya';
	return `var(--color-cat-${key})`;
}

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
 * Format tanggal ISO jadi "02 Jul 2024".
 * @param {string} iso
 */
export function formatDate(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso ?? '';
	return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
