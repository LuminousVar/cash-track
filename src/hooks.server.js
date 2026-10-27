import { redirect } from '@sveltejs/kit';
import {
	SESSION_COOKIE, SESSION_COOKIE_OPTIONS, readSessionToken, touchSessionToken, authConfigured
} from '$lib/server/auth.js';

// Route yang boleh diakses tanpa login. Webhook Telegram punya autentikasi
// sendiri (x-telegram-bot-api-secret-token), jadi dia satu-satunya /api/* yang
// terbuka. Route /api/* lain terlindungi secara default.
/** @param {string} path */
const isPublic = (path) => path === '/login' || path === '/api/telegram';

// Cookie ditulis ulang paling sering sekali per menit, bukan di setiap request.
const TOUCH_EVERY_MS = 60 * 1000;

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const token = event.cookies.get(SESSION_COOKIE);
	const session = token ? await readSessionToken(token) : null;
	event.locals.user = session?.u ?? null;

	if (session && Date.now() - session.last > TOUCH_EVERY_MS) {
		// Geser batas idle: setiap request yang lolos dihitung sebagai aktivitas.
		event.cookies.set(SESSION_COOKIE, await touchSessionToken(session), SESSION_COOKIE_OPTIONS);
	} else if (token && !session) {
		// Kedaluwarsa atau tidak sah: buang supaya browser tidak terus mengirimnya.
		event.cookies.delete(SESSION_COOKIE, { path: '/' });
	}

	// Kalau auth belum dikonfigurasi (dev tanpa env), jangan kunci apa pun.
	if (authConfigured()) {
		const path = event.url.pathname;
		if (!event.locals.user && !isPublic(path)) {
			const reason = token ? '&reason=expired' : '';
			throw redirect(303, '/login?next=' + encodeURIComponent(path) + reason);
		}
		if (event.locals.user && path === '/login') throw redirect(303, '/');
	}

	return resolve(event);
}
