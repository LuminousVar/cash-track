// Helper Telegram Bot API (web-standard fetch; aman di Vercel Node runtime).
import { env } from '$env/dynamic/private';

const api = () => `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
const fileApi = () => `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}`;

/**
 * Kirim pesan teks ke chat. Mengembalikan true kalau Telegram menerimanya,
 * supaya pemanggil bisa membedakan terkirim dan gagal (mis. chat ID salah).
 * @param {number | string} chatId
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function sendMessage(chatId, text) {
	try {
		const res = await fetch(`${api()}/sendMessage`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ chat_id: chatId, text })
		});
		const data = /** @type {any} */ (await res.json().catch(() => ({})));
		if (!res.ok || !data.ok) {
			console.error('Telegram sendMessage gagal', res.status, data.description ?? '');
			return false;
		}
		return true;
	} catch (err) {
		console.error('Telegram sendMessage error', err);
		return false;
	}
}

/**
 * Tukar file_id jadi file_path (untuk diunduh).
 * @param {string} fileId
 * @returns {Promise<string>}
 */
export async function getFile(fileId) {
	const res = await fetch(`${api()}/getFile?file_id=${encodeURIComponent(fileId)}`);
	const data = /** @type {any} */ (await res.json());
	if (!data.ok) throw new Error('Telegram getFile gagal');
	return data.result.file_path;
}

/**
 * Unduh file dari Telegram sebagai base64 (untuk Vision OCR).
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function downloadFileBase64(filePath) {
	const res = await fetch(`${fileApi()}/${filePath}`);
	const buf = await res.arrayBuffer();
	return Buffer.from(buf).toString('base64');
}
