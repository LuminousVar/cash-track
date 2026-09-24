// Isi kolom `id` (kolom N) untuk baris lama yang belum punya.
// Jalankan sekali setelah upgrade ke sheet 14 kolom:
//   bun scripts/backfill-ids.js
//
// Baca kredensial langsung dari .env. Script ini di luar SvelteKit, jadi tidak
// bisa pakai $env/dynamic/private.
import { readFileSync } from 'node:fs';
import { GoogleAuth } from 'google-auth-library';

// Salin .env ke process.env (hanya key yang belum diset di shell).
try {
	for (const line of readFileSync('.env', 'utf8').split('\n')) {
		const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
		if (!m) continue;
		const val = m[2].trim().replace(/^['"]|['"]$/g, '');
		if (!process.env[m[1]]) process.env[m[1]] = val;
	}
} catch {
	/* tanpa .env, andalkan env shell */
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TAB = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
const RAW = process.env.GOOGLE_SERVICE_ACCOUNT?.trim();
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

if (!SHEET_ID || !RAW) {
	console.error('GOOGLE_SHEET_ID dan GOOGLE_SERVICE_ACCOUNT harus diisi.');
	process.exit(1);
}

const credentials = JSON.parse(RAW.startsWith('{') ? RAW : Buffer.from(RAW, 'base64').toString('utf8'));
const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
const client = await auth.getClient();

const res = await client.request({ url: `${BASE}/${SHEET_ID}/values/${encodeURIComponent(TAB)}` });
const rows = res.data.values ?? [];

if (rows.length <= 1) {
	console.log('Tidak ada data untuk di-backfill.');
	process.exit(0);
}

// Kolom N (indeks 13). Baris 1 ikut ditulis supaya header kolom baru terisi.
const ids = [['id']];
let filled = 0;
for (let i = 1; i < rows.length; i++) {
	const existing = rows[i][13] ?? '';
	if (existing) {
		ids.push([existing]);
	} else {
		ids.push([crypto.randomUUID().slice(0, 8)]);
		filled++;
	}
}

if (filled === 0) {
	console.log(`Semua ${rows.length - 1} baris sudah punya id. Tidak ada yang diubah.`);
	process.exit(0);
}

const range = `${TAB}!N1:N${rows.length}`;
await client.request({
	url: `${BASE}/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
	method: 'PUT',
	data: { range, values: ids }
});

console.log(`Selesai: ${filled} baris diberi id baru (dari total ${rows.length - 1}).`);
