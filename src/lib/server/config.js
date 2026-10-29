// Pengaturan yang bisa diubah dari aplikasi (anggaran, ambang peringatan, chat notif,
// ringkasan harian) plus penanda "notif sudah dikirim".
// Kalau Sheet tersambung, disimpan di tab "Config" (key, value) supaya tetap ada saat
// instance Vercel daur ulang. Tanpa Sheet (demo/dev), pakai file lokal.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readRows, writeRange, ensureTab, isConfigured } from './google.js';

const CONFIG_TAB = 'Config';
const CONFIG_HEADER = ['key', 'value'];

// Fallback tanpa Sheet. Di Vercel filesystem read-only kecuali /tmp (ephemeral per instance).
const LOCAL_PATH = process.env.VERCEL ? '/tmp/ct-config.json' : './config.local.json';

/**
 * Tandai nilai sebagai teks biasa untuk Sheets (lihat penjelasan di expenses.js).
 * Tanpa ini "2026-10" terbaca sebagai tanggal dan chat ID "-100..." sebagai angka.
 * @param {string} v
 */
const text = (v) => (v ? `'${v}` : '');

// Cache per instance, berumur pendek. Satu halaman bisa membaca config beberapa kali
// (budget, ambang, chat ID); promise in-flight membuat semuanya memakai satu request.
const CACHE_TTL = 30_000;

/** @type {{ values: Record<string, string>, at: number } | null} */
let _cache = null;
/** @type {Promise<Record<string, string>> | null} */
let _loading = null;
// Naik setiap kali config ditulis. Bacaan yang mulai sebelum tulisan tidak boleh
// mengisi cache dengan nilai lama.
let _gen = 0;

/** @returns {Record<string, string>} */
function readLocal() {
	if (!existsSync(LOCAL_PATH)) return {};
	try {
		return JSON.parse(readFileSync(LOCAL_PATH, 'utf-8'));
	} catch {
		return {};
	}
}

/** Baris key/value di tab Config, tanpa header. */
async function readSheetRows() {
	await ensureTab(CONFIG_TAB, CONFIG_HEADER);
	return (await readRows(CONFIG_TAB)).slice(1);
}

async function loadSheet() {
	const gen = _gen;
	/** @type {Record<string, string>} */
	const values = {};
	// Value kosong = tidak diatur, supaya fallback ke env var tetap jalan.
	for (const [k = '', v = ''] of await readSheetRows()) if (k && v) values[k] = v;
	if (gen === _gen) _cache = { values, at: Date.now() };
	return values;
}

/** @returns {Promise<Record<string, string>>} */
export async function readConfig() {
	if (!isConfigured()) return readLocal();
	if (_cache && Date.now() - _cache.at < CACHE_TTL) return _cache.values;
	_loading ??= loadSheet().finally(() => (_loading = null));
	return _loading;
}

/**
 * Update config. Field kosong = hapus entry (fallback ke env var).
 * @param {Record<string, string>} updates
 */
export async function writeConfig(updates) {
	if (!isConfigured()) {
		const merged = readLocal();
		for (const [k, v] of Object.entries(updates)) {
			const trimmed = v?.trim() ?? '';
			if (trimmed) merged[k] = trimmed;
			else delete merged[k];
		}
		writeFileSync(LOCAL_PATH, JSON.stringify(merged, null, 2), 'utf-8');
		return;
	}

	// Baca langsung, bukan cache, supaya tulisan instance lain tidak tertimpa nilai lama.
	// Key yang dihapus tetap di barisnya dengan value kosong, jadi baris tidak bergeser.
	const rows = await readSheetRows();
	const keys = rows.map((r) => r[0] ?? '');
	const values = rows.map((r) => r[1] ?? '');
	for (const [k, v] of Object.entries(updates)) {
		const trimmed = v?.trim() ?? '';
		const i = keys.indexOf(k);
		if (i >= 0) values[i] = trimmed;
		else if (trimmed) {
			keys.push(k);
			values.push(trimmed);
		}
	}
	if (keys.length > 0) {
		await writeRange(`${CONFIG_TAB}!A2:B${keys.length + 1}`, keys.map((k, i) => [text(k), text(values[i])]));
	}
	_gen++;
	_cache = null;
}
