import { getDashboardData, getBudget } from '$lib/server/expenses.js';
import { readConfig, writeConfig } from '$lib/server/config.js';
import { getWarnPct } from '$lib/server/budget.js';
import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';

export async function load() {
	const [data, cfg, budget, warnPct] = await Promise.all([getDashboardData(), readConfig(), getBudget(), getWarnPct()]);
	const firstAllowedId =
		(env.TELEGRAM_ALLOWED_IDS || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)[0] ?? '';

	return {
		budget,
		warnPct,
		notifyChatId: cfg.BUDGET_NOTIFY_CHAT_ID || env.BUDGET_NOTIFY_CHAT_ID || '',
		firstAllowedId,
		// Default aktif. Cron hanya jalan kalau CRON_SECRET diisi (lihat /api/cron/daily).
		dailySummary: cfg.DAILY_SUMMARY !== 'off',
		cronReady: !!env.CRON_SECRET,
		summary: data.summary
	};
}

export const actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const val = (/** @type {string} */ key) => form.get(key)?.toString().trim() ?? '';

		const budget = Number(val('MONTHLY_BUDGET'));
		const warn = Number(val('BUDGET_WARN_PCT'));
		const chatId = val('BUDGET_NOTIFY_CHAT_ID');
		if (!Number.isFinite(budget) || budget <= 0) return fail(400, { error: 'Target anggaran harus lebih dari 0.' });
		if (!Number.isInteger(warn) || warn < 1 || warn > 99) return fail(400, { error: 'Batas peringatan harus 1 sampai 99.' });
		if (chatId && !/^-?\d+$/.test(chatId)) return fail(400, { error: 'ID Telegram hanya berisi angka.' });

		try {
			await writeConfig({
				MONTHLY_BUDGET: String(Math.round(budget)),
				BUDGET_WARN_PCT: String(warn),
				BUDGET_NOTIFY_CHAT_ID: chatId,
				DAILY_SUMMARY: form.get('DAILY_SUMMARY') ? 'on' : 'off'
			});
			return { success: true };
		} catch (err) {
			console.error('simpan anggaran gagal', err);
			return fail(500, { error: 'Gagal menyimpan pengaturan anggaran.' });
		}
	}
};
