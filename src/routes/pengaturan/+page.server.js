import { getBudget, isConfigured } from '$lib/server/expenses.js';
import { readConfig, writeConfig, isVercel } from '$lib/server/config.js';
import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';

/** Baca nilai dari file config dulu, fallback ke env var. @param {string} key */
function get(key) {
	const file = readConfig();
	return file[key] || env[key] || '';
}

/** Sensor: tampilkan 6 char pertama, sisanya ●. @param {string} val */
function mask(val) {
	return val ? val.slice(0, 6) + '••••••' : '';
}

export function load() {
	return {
		budget: getBudget(),
		configured: isConfigured(),
		isVercel,
		telegram: {
			hasToken: !!get('TELEGRAM_BOT_TOKEN'),
			hasSecret: !!get('TELEGRAM_SECRET_TOKEN'),
			allowedIds: get('TELEGRAM_ALLOWED_IDS') || null,
			tokenMasked: mask(get('TELEGRAM_BOT_TOKEN')),
		},
		deepseek: {
			configured: !!get('DEEPSEEK_API_KEY'),
			keyMasked: mask(get('DEEPSEEK_API_KEY')),
			model: 'deepseek-v4',
		},
		google: {
			configured: !!get('GOOGLE_SERVICE_ACCOUNT') && !!get('GOOGLE_SHEET_ID'),
			sheetId: get('GOOGLE_SHEET_ID') ? get('GOOGLE_SHEET_ID').slice(0, 12) + '…' : null,
			sheetTab: get('GOOGLE_SHEET_TAB') || 'Sheet1',
			hasServiceAccount: !!get('GOOGLE_SERVICE_ACCOUNT'),
		},
	};
}

export const actions = {
	/** Simpan konfigurasi ke file lokal. Field kosong = tetap pakai nilai lama. */
	save: async ({ request }) => {
		const form = await request.formData();

		/** @param {string} key */
		const val = (key) => form.get(key)?.toString() ?? '';

		const updates = {
			TELEGRAM_BOT_TOKEN: val('TELEGRAM_BOT_TOKEN'),
			TELEGRAM_SECRET_TOKEN: val('TELEGRAM_SECRET_TOKEN'),
			TELEGRAM_ALLOWED_IDS: val('TELEGRAM_ALLOWED_IDS'),
			DEEPSEEK_API_KEY: val('DEEPSEEK_API_KEY'),
			GOOGLE_SERVICE_ACCOUNT: val('GOOGLE_SERVICE_ACCOUNT'),
			GOOGLE_SHEET_ID: val('GOOGLE_SHEET_ID'),
			GOOGLE_SHEET_TAB: val('GOOGLE_SHEET_TAB'),
			MONTHLY_BUDGET: val('MONTHLY_BUDGET'),
		};

		try {
			writeConfig(updates);
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Gagal menyimpan konfigurasi.' });
		}
	},
};
