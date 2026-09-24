import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, readSessionToken, authConfigured } from '$lib/server/auth.js';

// Route yang boleh diakses tanpa login. Webhook Telegram punya autentikasi
// sendiri (x-telegram-bot-api-secret-token), jadi dia satu-satunya /api/* yang
// terbuka. Route /api/* lain terlindungi secara default.
/** @param {string} path */
const isPublic = (path) => path === '/login' || path === '/api/telegram';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.user = token ? await readSessionToken(token) : null;

	// Kalau auth belum dikonfigurasi (dev tanpa env), jangan kunci apa pun.
	if (authConfigured()) {
		const path = event.url.pathname;
		if (!event.locals.user && !isPublic(path)) throw redirect(303, '/login?next=' + encodeURIComponent(path));
		if (event.locals.user && path === '/login') throw redirect(303, '/');
	}

	return resolve(event);
}
