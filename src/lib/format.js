// Helper & konstanta yang aman dipakai di client maupun server.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const CATEGORIES = ['Makanan', 'Belanja', 'Transport', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'];

export const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Transfer', 'Kartu Debit', 'Kartu Kredit', 'E-wallet'];

/**
 * Warna chip/avatar per kategori (selaras palet brand).
 * @type {Record<string, { bg: string, fg: string }>}
 */
export const CATEGORY_TONE = {
	Makanan: { bg: '#ecf4e5', fg: '#2e5c45' },
	Belanja: { bg: '#e4f5ee', fg: '#1f8d68' },
	Transport: { bg: '#f1f8db', fg: '#6f9216' },
	Tagihan: { bg: '#eef0f1', fg: '#4b5563' },
	Kesehatan: { bg: '#e4f5ee', fg: '#1f8d68' },
	Hiburan: { bg: '#f1f8db', fg: '#6f9216' },
	Lainnya: { bg: '#eef0f1', fg: '#6b7280' }
};

/**
 * Format angka jadi Rupiah: 1250000 → "Rp 1.250.000".
 * @param {number} n
 */
export function formatRp(n) {
	return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0));
}

/**
 * Versi ringkas untuk label kecil: 1250000 → "1,3jt".
 * @param {number} n
 */
export function formatRpShort(n) {
	const v = Number(n) || 0;
	if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + 'jt';
	if (v >= 1_000) return Math.round(v / 1_000) + 'rb';
	return String(v);
}

/**
 * Format tanggal ISO → "02 Jul 2024".
 * @param {string} iso
 */
export function formatDate(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso ?? '';
	return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
