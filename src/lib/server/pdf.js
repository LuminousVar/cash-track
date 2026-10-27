// Render HTML jadi PDF dengan headless Chromium. Di Vercel pakai @sparticuz/chromium
// (Chromium khusus serverless, versinya dipasangkan dengan puppeteer-core: keduanya
// Chrome 153). Di lokal bisa diarahkan ke Chrome lain lewat env CHROME_PATH.
import { env } from '$env/dynamic/private';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// PDF tidak butuh WebGL. Tanpa grafis, swiftshader tidak perlu diekstrak saat cold start.
chromium.setGraphicsMode = false;

/**
 * @param {string} html  dokumen lengkap tanpa resource eksternal
 * @returns {Promise<Uint8Array>}
 */
export async function htmlToPdf(html) {
	const local = env.CHROME_PATH;
	const browser = await puppeteer.launch({
		executablePath: local || (await chromium.executablePath()),
		args: local ? ['--no-sandbox'] : await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
		headless: 'shell'
	});
	try {
		const page = await browser.newPage();
		// Semua isi laporan inline (font data URI, SVG). JavaScript dimatikan dan request
		// jaringan ditolak, jadi teks OCR yang lolos escape pun tidak bisa menjalankan
		// atau memuat apa-apa. Penting karena argumen Chromium serverless mematikan web security.
		await page.setJavaScriptEnabled(false);
		await page.setRequestInterception(true);
		page.on('request', (req) => (req.url().startsWith('data:') ? req.continue() : req.abort()));
		await page.setContent(html, { waitUntil: 'load' });
		return await page.pdf({ printBackground: true, preferCSSPageSize: true });
	} finally {
		await browser.close();
	}
}
