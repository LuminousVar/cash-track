// Strukturkan teks struk (hasil OCR) jadi JSON via DeepSeek (chat JSON mode).
import { env } from '$env/dynamic/private';
import { CATEGORIES, PAYMENT_METHODS, normCategory, todayJakarta } from '$lib/format.js';

/**
 * @typedef {{ name: string, qty: number, price: number }} Item
 * @typedef {{ merchant: string, date: string, total: number, currency: string, category: string, payment_method: string, items: Item[] }} ParsedReceipt
 */

// Aturan kategori, dipakai untuk struk maupun catatan teks singkat.
const CATEGORY_RULE = `WAJIB salah satu dari: ${CATEGORIES.join(', ')}
  (Makanan & Minuman = makan, minum, kopi, jajanan, restoran, pesan antar makanan;
   Investasi = pembelian reksa dana, saham, emas, kripto, deposito, setoran tabungan berjangka)`;

const SYSTEM = `Kamu mengekstrak data dari teks struk belanja (kebanyakan Bahasa Indonesia).
Balas HANYA JSON dengan field:
- merchant: nama toko/penjual (string)
- date: tanggal transaksi format "YYYY-MM-DD" (kalau tak ada, kosongkan)
- total: total akhir yang dibayar (number, tanpa pemisah ribuan)
- currency: kode mata uang, default "IDR"
- category: ${CATEGORY_RULE}
- payment_method: salah satu dari: ${PAYMENT_METHODS.join(', ')} (atau "" jika tak jelas)
- items: array {name, qty, price} untuk tiap barang (price = harga satuan; number)
Jika ragu kategori, pakai "Lainnya". Jangan menambah teks lain di luar JSON.`;

/** Nama model DeepSeek. Cek daftar yang valid: GET https://api.deepseek.com/models */
export const DEEPSEEK_MODEL = 'deepseek-flash';

/** @param {string} c */
const pickCategory = normCategory;
/** @param {string} m */
const pickMethod = (m) => (PAYMENT_METHODS.includes(m) ? m : '');

/** @param {unknown} d */
function normDate(d) {
	if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
	// Struk tanpa tanggal: pakai hari ini WIB (server Vercel berjalan di UTC).
	return todayJakarta();
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
 * Satu panggilan chat DeepSeek dalam JSON mode, hasilnya objek JSON.
 * @param {string} system
 * @param {string} user
 * @param {AbortSignal} [signal]
 * @returns {Promise<any>}
 */
async function chatJson(system, user, signal) {
	const res = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
		body: JSON.stringify({
			model: DEEPSEEK_MODEL,
			response_format: { type: 'json_object' },
			temperature: 0.1,
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user }
			]
		}),
		signal
	});
	if (!res.ok) {
		// Sertakan pesan dari DeepSeek supaya log Vercel langsung menunjukkan penyebabnya.
		const detail = await res.text().catch(() => '');
		throw new Error(`DeepSeek error ${res.status}: ${detail.slice(0, 300)}`);
	}

	const data = /** @type {any} */ (await res.json());
	return JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
}

/**
 * @param {string} text  teks mentah hasil OCR
 * @returns {Promise<ParsedReceipt>}
 */
export async function parseReceipt(text) {
	const parsed = await chatJson(SYSTEM, text);

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

const GUESS_SYSTEM = `Kamu memberi kategori untuk catatan pengeluaran singkat (Bahasa Indonesia),
mis. "Parkir", "Bensin pertamina", "Kopi". Balas HANYA JSON {"category": "..."}.
category ${CATEGORY_RULE}
Jika ragu, pakai "Lainnya".`;

/**
 * Tebak kategori catatan teks singkat yang tidak menyebut kategori.
 * Gagal, lambat, atau tanpa API key: "Lainnya". Pencatatan tidak boleh gagal hanya
 * karena tebakan, dan kategorinya bisa diubah dari web.
 * @param {string} description
 * @returns {Promise<string>}
 */
export async function guessCategory(description) {
	if (!env.DEEPSEEK_API_KEY) return 'Lainnya';
	try {
		const parsed = await chatJson(GUESS_SYSTEM, description, AbortSignal.timeout(10_000));
		return pickCategory(parsed.category);
	} catch (err) {
		console.error('guessCategory gagal', err);
		return 'Lainnya';
	}
}
