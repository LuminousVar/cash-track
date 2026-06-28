// Strukturkan teks struk (hasil OCR) → JSON via DeepSeek (chat JSON mode).
import { env } from '$env/dynamic/private';
import { CATEGORIES, PAYMENT_METHODS } from '$lib/format.js';

/**
 * @typedef {{ name: string, qty: number, price: number }} Item
 * @typedef {{ merchant: string, date: string, total: number, currency: string, category: string, payment_method: string, items: Item[] }} ParsedReceipt
 */

const SYSTEM = `Kamu mengekstrak data dari teks struk belanja (kebanyakan Bahasa Indonesia).
Balas HANYA JSON dengan field:
- merchant: nama toko/penjual (string)
- date: tanggal transaksi format "YYYY-MM-DD" (kalau tak ada, kosongkan)
- total: total akhir yang dibayar (number, tanpa pemisah ribuan)
- currency: kode mata uang, default "IDR"
- category: WAJIB salah satu dari: ${CATEGORIES.join(', ')}
- payment_method: salah satu dari: ${PAYMENT_METHODS.join(', ')} (atau "" jika tak jelas)
- items: array {name, qty, price} untuk tiap barang (price = harga satuan; number)
Jika ragu kategori, pakai "Lainnya". Jangan menambah teks lain di luar JSON.`;

/** @param {string} c */
const pickCategory = (c) => (CATEGORIES.includes(c) ? c : 'Lainnya');
/** @param {string} m */
const pickMethod = (m) => (PAYMENT_METHODS.includes(m) ? m : '');

/** @param {unknown} d */
function normDate(d) {
	if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
	return new Date().toISOString().slice(0, 10);
}

/**
 * @param {unknown} items
 * @returns {Item[]}
 */
function normItems(items) {
	if (!Array.isArray(items)) return [];
	return items.map((i) => ({ name: String(i?.name ?? ''), qty: Number(i?.qty) || 1, price: Number(i?.price) || 0 }));
}

/**
 * @param {string} text  teks mentah hasil OCR
 * @returns {Promise<ParsedReceipt>}
 */
export async function parseReceipt(text) {
	const res = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
		body: JSON.stringify({
			model: 'deepseek-chat',
			response_format: { type: 'json_object' },
			temperature: 0.1,
			messages: [
				{ role: 'system', content: SYSTEM },
				{ role: 'user', content: text }
			]
		})
	});
	if (!res.ok) throw new Error(`DeepSeek error ${res.status}`);

	const data = /** @type {any} */ (await res.json());
	const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');

	const items = normItems(parsed.items);
	const total = Number(parsed.total) || items.reduce((s, i) => s + i.qty * i.price, 0);

	return {
		merchant: String(parsed.merchant ?? '').trim(),
		date: normDate(parsed.date),
		total,
		currency: parsed.currency || 'IDR',
		category: pickCategory(parsed.category),
		payment_method: pickMethod(parsed.payment_method),
		items
	};
}
