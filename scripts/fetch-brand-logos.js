// Unduh logo merek (src/lib/brands.js) ke static/brands/ dan tulis daftar file yang
// tersedia ke src/lib/brand-logos.js. Jalankan setelah menambah merek:
//   bun scripts/fetch-brand-logos.js           hanya merek yang belum punya logo
//   bun scripts/fetch-brand-logos.js --force   unduh ulang semua
// Hasilnya di-commit. Aplikasi tidak pernah memanggil layanan pihak ketiga saat dipakai.
//
// Sumber, berurutan (yang pertama berhasil dipakai):
// 1. `si`: Simple Icons (CC0). Path SVG dibungkus jadi ikon kotak berwarna merek.
// 2. `wiki`: file logo di Wikimedia Commons (thumbnail PNG).
// 3. `app`: ikon aplikasi di App Store Indonesia.
// 4. apple-touch-icon atau ikon besar dari situs resmi (`domain`).
// 5. Layanan favicon Google (128px).
// Gambar raster dari sumber 2-5 dinormalisasi lewat Chromium jadi WebP 128x128 di atas
// latar putih, logo lebar diberi ruang supaya tidak terpotong. SVG dari situs luar
// sengaja tidak disimpan: dibuka langsung, SVG bisa menjalankan skrip di domain aplikasi.
// Butuh Chromium: @sparticuz/chromium di Linux, atau env CHROME_PATH.
import { mkdirSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { BRANDS } from '../src/lib/brands.js';

const SI_VERSION = '16.36.0';
const OUT = 'static/brands';
const MANIFEST = 'src/lib/brand-logos.js';
const SIZE = 128;
const MIN_SOURCE = 48;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const force = process.argv.includes('--force');

/** @typedef {import('../src/lib/brands.js').Brand} Brand */

mkdirSync(OUT, { recursive: true });
const existing = new Set(readdirSync(OUT));

/** @param {string} url */
async function get(url) {
	const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow', signal: AbortSignal.timeout(10_000) });
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	return res;
}

// Normalisasi gambar lewat canvas di Chromium
const browser = await puppeteer.launch({
	executablePath: process.env.CHROME_PATH || (await chromium.executablePath()),
	args: process.env.CHROME_PATH ? [] : await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
	headless: 'shell'
});
const page = await browser.newPage();
await page.setContent('<!doctype html><title>logo</title>');

/**
 * Gambar apa pun yang bisa dibaca Chromium jadi WebP SIZE x SIZE.
 * @param {Uint8Array} bytes
 * @param {string} mime
 */
async function normalize(bytes, mime) {
	const src = `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
	const r = await page.evaluate(
		async (src, size) => {
			const img = new Image();
			img.src = src;
			await img.decode();
			const w = img.naturalWidth;
			const h = img.naturalHeight;
			const c = document.createElement('canvas');
			c.width = c.height = size;
			const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, size, size);
			// Ikon persegi memenuhi kotak; logo lebar diberi tepi supaya tidak menempel.
			const fit = (Math.min(size / w, size / h)) * (Math.abs(w - h) / Math.max(w, h) > 0.1 ? 0.86 : 1);
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(img, (size - w * fit) / 2, (size - h * fit) / 2, w * fit, h * fit);
			return { w, h, out: c.toDataURL('image/webp', 0.9) };
		},
		src,
		SIZE
	);
	if (Math.max(r.w, r.h) < MIN_SOURCE) throw new Error(`terlalu kecil ${r.w}x${r.h}`);
	return { bytes: Buffer.from(r.out.split(',')[1], 'base64'), w: r.w, h: r.h };
}

/** @param {string} url */
async function downloadImage(url) {
	const res = await get(url);
	const mime = (res.headers.get('content-type') ?? '').split(';')[0].trim();
	if (!mime.startsWith('image/') || mime.includes('svg')) throw new Error(`bukan gambar raster (${mime || 'tanpa tipe'}): ${url}`);
	const img = await normalize(new Uint8Array(await res.arrayBuffer()), mime);
	return { ...img, via: `${new URL(url).hostname} ${img.w}x${img.h}` };
}

/**
 * Kandidat ikon dari HTML beranda, terbesar dulu.
 * @param {string} domain
 */
async function siteIconUrls(domain) {
	const res = await get(`https://${domain}/`);
	const html = (await res.text()).slice(0, 300_000);
	/** @type {{ url: string, score: number }[]} */
	const found = [];
	for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
		const rel = /rel\s*=\s*["']?([^"'>]+)/i.exec(tag)?.[1]?.toLowerCase() ?? '';
		const href = /href\s*=\s*["']?([^"'\s>]+)/i.exec(tag)?.[1];
		if (!href || !rel.includes('icon') || /\.(svg|ico)(\?|$)/i.test(href)) continue;
		const size = Number(/sizes\s*=\s*["']?(\d+)/i.exec(tag)?.[1]) || (rel.includes('apple-touch') ? 180 : 32);
		found.push({ url: new URL(href.replace(/&amp;/g, '&'), res.url).href, score: size });
	}
	found.push({ url: new URL('/apple-touch-icon.png', res.url).href, score: 100 });
	return found.sort((a, b) => b.score - a.score).map((f) => f.url);
}

/**
 * URL ikon aplikasi di App Store Indonesia, atau null.
 * @param {{ term: string, match: string }} app
 */
async function appStoreIconUrl(app) {
	const url = `https://itunes.apple.com/search?term=${encodeURIComponent(app.term)}&country=id&entity=software&limit=5`;
	const { results = [] } = await (await get(url)).json();
	const hit = results.find((/** @type {any} */ r) => `${r.trackName} ${r.sellerName}`.toLowerCase().includes(app.match));
	return hit?.artworkUrl512 ? String(hit.artworkUrl512).replace(/\/[^/]+$/, '/256x256bb.png') : null;
}

/**
 * URL thumbnail PNG sebuah file di Wikimedia Commons, atau null.
 * @param {string} title  mis. "File:Alfamidi 2015.svg"
 */
async function wikiThumbUrl(title) {
	const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=256&format=json`;
	const data = await (await get(url)).json();
	return Object.values(data.query?.pages ?? {})[0]?.imageinfo?.[0]?.thumburl ?? null;
}

/** Relative luminance warna hex, untuk memilih glyph putih atau hitam. @param {string} hex */
function luminance(hex) {
	const c = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

const siData = await (await get(`https://cdn.jsdelivr.net/npm/simple-icons@${SI_VERSION}/data/simple-icons.json`)).json();
/** @type {Map<string, string>} */
const siHex = new Map(siData.map((/** @type {{ slug: string, hex: string }} */ i) => [i.slug, i.hex]));

/** @param {Brand} brand */
async function fromSimpleIcons(brand) {
	const hex = siHex.get(/** @type {string} */ (brand.si));
	if (!hex) throw new Error(`slug Simple Icons tidak ada: ${brand.si}`);
	const svg = await (await get(`https://cdn.jsdelivr.net/npm/simple-icons@${SI_VERSION}/icons/${brand.si}.svg`)).text();
	const d = /<path d="([^"]+)"/.exec(svg)?.[1] ?? '';
	// Hanya perintah path dan angka, supaya tidak ada yang bisa disisipkan ke file SVG.
	if (!/^[MmLlHhVvCcSsQqTtAaZz0-9.,\-\s]+$/.test(d)) throw new Error(`path tidak wajar: ${brand.si}`);
	const fg = luminance(hex) > 0.45 ? '#000000' : '#ffffff';
	const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#${hex}"/><path transform="translate(7 7) scale(0.75)" fill="${fg}" d="${d}"/></svg>\n`;
	return { ext: 'svg', bytes: new TextEncoder().encode(out), via: 'simple-icons' };
}

/** @param {Brand} brand */
async function fromWeb(brand) {
	/** @type {string[]} */
	const urls = [];
	const wiki = brand.wiki ? await wikiThumbUrl(brand.wiki).catch(() => null) : null;
	if (wiki) urls.push(wiki);
	const app = brand.app ? await appStoreIconUrl(brand.app).catch(() => null) : null;
	if (app) urls.push(app);
	try {
		urls.push(...(await siteIconUrls(brand.domain)));
	} catch {
		/* situs menolak atau tidak bisa dibuka: lanjut ke cadangan */
	}
	urls.push(`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`);

	let lastError = '';
	for (const url of urls) {
		try {
			return { ext: 'webp', ...(await downloadImage(url)) };
		} catch (e) {
			lastError = e instanceof Error ? e.message : String(e);
		}
	}
	throw new Error(lastError);
}

/** @type {Record<string, string>} */
const logos = {};
/** @type {string[]} */
const missing = [];

// Satu per satu: halaman canvas Chromium dipakai bersama.
for (const brand of BRANDS) {
	const have = [...existing].find((f) => f.startsWith(`${brand.slug}.`));
	if (brand.nologo) {
		if (have) unlinkSync(`${OUT}/${have}`);
		continue;
	}
	if (have && !force) {
		logos[brand.slug] = have;
		continue;
	}
	try {
		const got = brand.si ? await fromSimpleIcons(brand) : await fromWeb(brand);
		const file = `${brand.slug}.${got.ext}`;
		if (have && have !== file) unlinkSync(`${OUT}/${have}`);
		writeFileSync(`${OUT}/${file}`, got.bytes);
		logos[brand.slug] = file;
		console.log(`ok    ${brand.slug.padEnd(16)} ${got.via}`);
	} catch (e) {
		// Gagal sementara (situs down, 404 acak) tidak boleh menghapus logo yang sudah ada.
		if (have) logos[brand.slug] = have;
		else missing.push(brand.slug);
		console.log(`gagal ${brand.slug.padEnd(16)} ${e instanceof Error ? e.message : e}${have ? ' (logo lama dipakai)' : ''}`);
	}
}
await browser.close();

const sorted = Object.fromEntries(Object.entries(logos).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(
	MANIFEST,
	`// Dibuat oleh scripts/fetch-brand-logos.js, jangan diedit manual.\n// Merek tanpa entri di sini tampil sebagai inisial.\n/** @type {Record<string, string>} */\nexport const BRAND_LOGOS = ${JSON.stringify(sorted, null, '\t')};\n`
);
console.log(`\n${Object.keys(sorted).length}/${BRANDS.length} merek punya logo.${missing.length ? ` Tanpa logo: ${missing.join(', ')}` : ''}`);
