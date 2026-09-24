// Akses Google Sheets via REST + service account (JWT). Lihat RENCANA.md.
// GOOGLE_SERVICE_ACCOUNT bisa berupa JSON 1-baris ATAU base64 dari JSON-nya.
import { GoogleAuth } from 'google-auth-library';
import { env } from '$env/dynamic/private';

// Satu service account untuk Sheets + Vision (lihat RENCANA.md).
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/cloud-platform'];
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/** Nama tab sheet (default "Sheet1"). */
export const SHEET_TAB = env.GOOGLE_SHEET_TAB || 'Sheet1';

function credentials() {
	const raw = env.GOOGLE_SERVICE_ACCOUNT?.trim();
	if (!raw) return null;
	const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
	return JSON.parse(json);
}

/** True kalau service account + sheet id sudah diisi di env. */
export function isConfigured() {
	return !!(env.GOOGLE_SERVICE_ACCOUNT && env.GOOGLE_SHEET_ID);
}

/** @type {import('google-auth-library').AnyAuthClient | undefined} */
let _client;
async function getClient() {
	if (_client) return _client;
	const creds = credentials();
	if (!creds) throw new Error('GOOGLE_SERVICE_ACCOUNT belum diset');
	const auth = new GoogleAuth({ credentials: creds, scopes: SCOPES });
	_client = await auth.getClient();
	return _client;
}

/**
 * Baca semua baris pada range (default seluruh tab).
 * @param {string} [range]
 * @returns {Promise<string[][]>}
 */
export async function readRows(range = SHEET_TAB) {
	const client = await getClient();
	const url = `${BASE}/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}`;
	const res = await client.request({ url });
	return /** @type {any} */ (res.data).values ?? [];
}

/**
 * Tambah satu baris ke akhir tab. `values` = array sesuai urutan kolom.
 * @param {(string | number)[]} values
 * @param {string} [range]
 */
export async function appendRow(values, range = SHEET_TAB) {
	const client = await getClient();
	const url = `${BASE}/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
	await client.request({ url, method: 'POST', data: { values: [values] } });
}

/**
 * Timpa isi sebuah range. `rows` = array baris, tiap baris array kolom.
 * @param {string} range  mis. "Sheet1!A5:N5"
 * @param {(string | number)[][]} rows
 */
export async function writeRange(range, rows) {
	const client = await getClient();
	const url = `${BASE}/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
	await client.request({ url, method: 'PUT', data: { range, values: rows } });
}

/**
 * Timpa satu baris penuh (kolom A..N).
 * @param {number} rowNumber  nomor baris di sheet, 1-based (baris 1 = header)
 * @param {(string | number)[]} values
 * @param {string} [tab]
 */
export async function updateRow(rowNumber, values, tab = SHEET_TAB) {
	await writeRange(`${tab}!A${rowNumber}:N${rowNumber}`, [values]);
}

// Gid tab tidak pernah berubah, jadi cache seperti _client.
/** @type {number | undefined} */
let _sheetId;

/**
 * Ubah nama tab jadi sheetId (gid numerik). Dibutuhkan batchUpdate.
 * @param {string} [tab]
 * @returns {Promise<number>}
 */
export async function getSheetId(tab = SHEET_TAB) {
	if (_sheetId !== undefined) return _sheetId;
	const client = await getClient();
	const res = await client.request({ url: `${BASE}/${env.GOOGLE_SHEET_ID}?fields=sheets.properties` });
	const sheets = /** @type {any} */ (res.data).sheets ?? [];
	const found = sheets.find((/** @type {any} */ s) => s.properties?.title === tab);
	if (!found) throw new Error(`Tab "${tab}" tidak ada di spreadsheet`);
	_sheetId = Number(found.properties.sheetId);
	return _sheetId;
}

/**
 * Hapus satu baris. Values API tak bisa menghapus baris, harus lewat batchUpdate.
 * @param {number} rowNumber  nomor baris di sheet, 1-based
 * @param {string} [tab]
 */
export async function deleteRow(rowNumber, tab = SHEET_TAB) {
	const client = await getClient();
	const sheetId = await getSheetId(tab);
	await client.request({
		url: `${BASE}/${env.GOOGLE_SHEET_ID}:batchUpdate`,
		method: 'POST',
		data: {
			requests: [
				{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: rowNumber - 1, endIndex: rowNumber } } }
			]
		}
	});
}

/**
 * OCR gambar (base64) via Cloud Vision DOCUMENT_TEXT_DETECTION, hasilnya teks mentah.
 * @param {string} base64
 * @returns {Promise<string>}
 */
export async function visionOcr(base64) {
	const client = await getClient();
	const body = {
		requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }]
	};
	const res = await client.request({ url: 'https://vision.googleapis.com/v1/images:annotate', method: 'POST', data: body });
	const r = /** @type {any} */ (res.data).responses?.[0];
	return r?.fullTextAnnotation?.text ?? '';
}
