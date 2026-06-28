// Autentikasi: verifikasi password (argon2id) + token sesi bertanda-tangan (HMAC).
// Kredensial dari env — default 1 user. Lihat plan & README.
import { env } from '$env/dynamic/private';
import { verify } from '@node-rs/argon2';

export const SESSION_COOKIE = 'ct_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari (detik)

/**
 * Daftar user dari AUTH_USERS (JSON) atau fallback AUTH_USERNAME/AUTH_PASSWORD_HASH.
 * @returns {{ username: string, hash: string }[]}
 */
export function getUsers() {
	if (env.AUTH_USERS) {
		try {
			return JSON.parse(env.AUTH_USERS).map((/** @type {{ u: string, h: string }} */ x) => ({ username: x.u, hash: x.h }));
		} catch {
			/* abaikan JSON rusak */
		}
	}
	if (env.AUTH_USERNAME && env.AUTH_PASSWORD_HASH) {
		return [{ username: env.AUTH_USERNAME, hash: env.AUTH_PASSWORD_HASH }];
	}
	return [];
}

/** True kalau minimal satu user terdefinisi. Bila false, auth dimatikan (dev). */
export function authConfigured() {
	return getUsers().length > 0;
}

/**
 * Verifikasi username (case-insensitive) + password. → username asli | null.
 * @param {string} username
 * @param {string} password
 */
export async function verifyCredentials(username, password) {
	const uname = String(username || '').trim().toLowerCase();
	const user = getUsers().find((u) => u.username.toLowerCase() === uname);
	if (!user) return null;
	try {
		return (await verify(user.hash, String(password || ''))) ? user.username : null;
	} catch {
		return null;
	}
}

// ── Token sesi: "<payloadB64>.<hmacB64>" ─────────────────────────────────────
const enc = new TextEncoder();

/** @param {string} data */
async function sign(data) {
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(env.SESSION_SECRET || 'dev-insecure-secret'),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
	return Buffer.from(new Uint8Array(sig)).toString('base64url');
}

/** @param {string} username */
export async function createSessionToken(username) {
	const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString('base64url');
	return `${payload}.${await sign(payload)}`;
}

/** @param {string | undefined} token */
export async function readSessionToken(token) {
	if (!token || !token.includes('.')) return null;
	const [payload, sig] = token.split('.');
	if (sig !== (await sign(payload))) return null;
	try {
		const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
		if (!data.exp || data.exp < Date.now()) return null;
		return data.u;
	} catch {
		return null;
	}
}
