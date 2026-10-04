// Halaman ini hanya menampilkan status. Kunci API dibaca bot, OCR, DeepSeek, dan
// Sheets langsung dari Environment Variables, jadi status juga dibaca dari sana.
// Form pengisian kunci dihapus karena nilainya tidak pernah dipakai (lihat notes.txt).
import { isConfigured } from '$lib/server/expenses.js';
import { DEEPSEEK_MODEL } from '$lib/server/deepseek.js';
import { getCycleStartDay } from '$lib/server/cycle.js';
import { env } from '$env/dynamic/private';

export function load() {
	const allowed = (env.TELEGRAM_ALLOWED_IDS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	return {
		integrations: [
			{
				name: 'Bot Telegram',
				ok: !!env.TELEGRAM_BOT_TOKEN && !!env.TELEGRAM_SECRET_TOKEN,
				detail: !env.TELEGRAM_BOT_TOKEN
					? 'TELEGRAM_BOT_TOKEN belum diisi.'
					: !env.TELEGRAM_SECRET_TOKEN
						? 'TELEGRAM_SECRET_TOKEN belum diisi, webhook tidak diverifikasi.'
						: 'Token dan secret webhook terpasang.'
			},
			{
				name: 'Whitelist Telegram',
				ok: allowed.length > 0,
				detail: allowed.length > 0 ? `${allowed.length} ID diizinkan.` : 'Kosong: siapa pun bisa memakai bot.'
			},
			{
				name: 'DeepSeek',
				ok: !!env.DEEPSEEK_API_KEY,
				detail: env.DEEPSEEK_API_KEY ? `Model ${DEEPSEEK_MODEL}.` : 'DEEPSEEK_API_KEY belum diisi.'
			},
			{
				name: 'Google Sheets & Vision',
				ok: isConfigured(),
				detail: isConfigured() ? `Tab ${env.GOOGLE_SHEET_TAB || 'Sheet1'}.` : 'GOOGLE_SERVICE_ACCOUNT atau GOOGLE_SHEET_ID belum diisi.'
			}
		],
		cycleStartDay: getCycleStartDay()
	};
}
