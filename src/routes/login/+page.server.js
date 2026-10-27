import { fail, redirect } from '@sveltejs/kit';
import {
	verifyCredentials, createSessionToken, loginLockedFor, recordLogin, SESSION_COOKIE, SESSION_COOKIE_OPTIONS
} from '$lib/server/auth.js';

export function load({ url }) {
	// Diisi hooks.server.js saat cookie sesi ada tapi sudah tidak berlaku.
	return { expired: url.searchParams.get('reason') === 'expired' || url.searchParams.get('reason') === 'idle' };
}

export const actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const fd = await request.formData();
		const username = String(fd.get('username') || '');
		const password = String(fd.get('password') || '');

		const ip = getClientAddress();
		const locked = loginLockedFor(ip);
		if (locked > 0) {
			return fail(429, { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(locked / 60000)} menit.`, username });
		}

		const user = await verifyCredentials(username, password);
		recordLogin(ip, !!user);
		if (!user) return fail(401, { error: 'Username atau password salah.', username });

		let token;
		try {
			token = await createSessionToken(user);
		} catch (err) {
			console.error('login error', err);
			return fail(500, { error: 'Server belum siap: SESSION_SECRET belum diset.', username });
		}
		cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);

		// Hanya path lokal. "//host" dan "/\host" dibaca browser sebagai URL ke domain lain.
		const next = url.searchParams.get('next') || '/';
		const safe = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\');
		throw redirect(303, safe ? next : '/');
	}
};
