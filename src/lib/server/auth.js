// Autentikasi: verifikasi password (argon2id) + token sesi bertanda-tangan (HMAC).
// Kredensial dari env, default 1 user. Lihat plan & README.
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { verify } from '@node-rs/argon2';

export const SESSION_COOKIE = 'ct_session';

// Sesi berakhir setelah 30 menit tanpa aktivitas, dan paling lama 12 jam sejak login.
// Cookie-nya cookie sesi (tanpa Max-Age), tapi itu saja tidak cukup: Chrome/Edge
// dengan "lanjutkan dari terakhir" memulihkan cookie sesi setelah restart. Batas
// waktu di token inilah yang menjamin sesi tidak "nyangkut" setelah laptop dimatikan.
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_MAX_MS = 12 * 60 * 60 * 1000;

/** Opsi cookie sesi. Sengaja tanpa maxAge/expires. */
export const SESSION_COOKIE_OPTIONS = /** @type {const} */ ({ path: '/', httpOnly: true, sameSite: 'lax', secure: !dev });

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
 * Verifikasi username (case-insensitive) + password. Mengembalikan username asli atau null.
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

// Pembatas percobaan login
// Per IP, di memori instance. Di Vercel tiap instance punya hitungan sendiri, jadi ini
// rem tambahan di atas argon2 yang sudah lambat, bukan jaminan mutlak.
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

/** @type {Map<string, { fails: number, until: number }>} */
const attempts = new Map();

/**
 * Sisa waktu blokir (ms) untuk sebuah IP, 0 kalau boleh mencoba.
 * @param {string} ip
 */
export function loginLockedFor(ip) {
	const a = attempts.get(ip);
	if (!a || a.until <= Date.now()) return 0;
	return a.until - Date.now();
}

/**
 * Catat hasil percobaan login. Berhasil = hitungan direset.
 * @param {string} ip
 * @param {boolean} ok
 */
export function recordLogin(ip, ok) {
	if (ok) {
		attempts.delete(ip);
		return;
	}
	const a = attempts.get(ip) ?? { fails: 0, until: 0 };
	// Blokir sebelumnya sudah lewat: mulai hitung dari nol lagi.
	if (a.until && a.until <= Date.now()) Object.assign(a, { fails: 0, until: 0 });
	a.fails++;
	if (a.fails >= MAX_FAILS) a.until = Date.now() + LOCK_MS;
	attempts.set(ip, a);
}

// Token sesi: "<payloadB64>.<hmacB64>", payload { u, iat, last }.
const enc = new TextEncoder();

/** Kunci HMAC. Di produksi wajib SESSION_SECRET: tanpa itu token bisa dipalsukan siapa pun. */
async function hmacKey() {
	const secret = env.SESSION_SECRET || (dev ? 'dev-insecure-secret' : '');
	if (!secret) throw new Error('SESSION_SECRET belum diset. Login dimatikan sampai env ini diisi.');
	return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/**
 * @param {{ u: string, iat: number, last: number }} data
 */
async function encode(data) {
	const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
	const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(payload));
	return `${payload}.${Buffer.from(new Uint8Array(sig)).toString('base64url')}`;
}

/** @param {string} username */
export async function createSessionToken(username) {
	const now = Date.now();
	return encode({ u: username, iat: now, last: now });
}

/**
 * Baca token. Null kalau tanda tangan salah, sudah idle terlalu lama, atau melewati
 * batas maksimal sejak login.
 * @param {string | undefined} token
 * @returns {Promise<{ u: string, iat: number, last: number } | null>}
 */
export async function readSessionToken(token) {
	if (!token || !token.includes('.')) return null;
	const [payload, sig] = token.split('.');
	try {
		// subtle.verify membandingkan tanda tangan secara constant-time.
		const ok = await crypto.subtle.verify('HMAC', await hmacKey(), Buffer.from(sig, 'base64url'), enc.encode(payload));
		if (!ok) return null;
		const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
		const now = Date.now();
		if (typeof data.u !== 'string' || !(now - data.iat < SESSION_MAX_MS) || !(now - data.last < SESSION_IDLE_MS)) return null;
		return data;
	} catch {
		return null;
	}
}

/**
 * Token baru dengan waktu aktivitas terakhir = sekarang. Waktu login (iat) tetap,
 * jadi batas 12 jam tidak ikut bergeser.
 * @param {{ u: string, iat: number }} session
 */
export async function touchSessionToken(session) {
	return encode({ u: session.u, iat: session.iat, last: Date.now() });
}
