// Ringkasan harian ke Telegram, dipanggil Vercel Cron setiap malam (lihat vercel.json).
// Vercel mengirim "Authorization: Bearer <CRON_SECRET>"; tanpa CRON_SECRET route ini
// selalu menolak, supaya siapa pun tidak bisa memicu pesan.
import { env } from '$env/dynamic/private';
import { readConfig } from '$lib/server/config.js';
import { sendMessage } from '$lib/server/telegram.js';
import { getBudgetSnapshot, getNotifyChatId, dailySummaryMessage } from '$lib/server/budget.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
	if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
		return new Response('unauthorized', { status: 401 });
	}

	const cfg = await readConfig();
	if (cfg.DAILY_SUMMARY === 'off') return new Response('nonaktif');

	const chatId = await getNotifyChatId();
	if (!chatId || !env.TELEGRAM_BOT_TOKEN) return new Response('chat ID atau token bot belum diatur');

	const sent = await sendMessage(chatId, dailySummaryMessage(await getBudgetSnapshot()));
	return new Response(sent ? 'terkirim' : 'gagal', { status: sent ? 200 : 502 });
}
