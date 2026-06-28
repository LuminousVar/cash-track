// Akses Google Sheets via REST + service account (JWT). Lihat RENCANA.md.
// GOOGLE_SERVICE_ACCOUNT bisa berupa JSON 1-baris ATAU base64 dari JSON-nya.
import { GoogleAuth } from 'google-auth-library';
import { env } from '$env/dynamic/private';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
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
