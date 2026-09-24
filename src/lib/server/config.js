import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// Di Vercel (serverless) filesystem read-only, jadi pakai /tmp (ephemeral per instance).
// Di lokal, pakai config.local.json di root project (gitignored).
const isVercel = !!process.env.VERCEL;
export const CONFIG_PATH = isVercel ? '/tmp/ct-config.json' : './config.local.json';

/** @returns {Record<string, string>} */
export function readConfig() {
	if (!existsSync(CONFIG_PATH)) return {};
	try {
		return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
	} catch {
		return {};
	}
}

/**
 * Update config file. Field kosong = hapus entry (fallback ke env var).
 * @param {Record<string, string>} updates
 */
export function writeConfig(updates) {
	const current = readConfig();
	const merged = { ...current };
	for (const [k, v] of Object.entries(updates)) {
		const trimmed = v?.trim() ?? '';
		if (trimmed) merged[k] = trimmed;
		else delete merged[k];
	}
	writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
}

export { isVercel };
