import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { verifyCredentials, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '$lib/server/auth.js';

export const actions = {
	default: async ({ request, cookies, url }) => {
		const fd = await request.formData();
		const username = String(fd.get('username') || '');
		const password = String(fd.get('password') || '');

		const user = await verifyCredentials(username, password);
		if (!user) return fail(401, { error: 'Username atau password salah.', username });

		cookies.set(SESSION_COOKIE, await createSessionToken(user), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: SESSION_MAX_AGE
		});

		const next = url.searchParams.get('next') || '/';
		throw redirect(303, next.startsWith('/') ? next : '/');
	}
};
