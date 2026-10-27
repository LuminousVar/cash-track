import { error } from '@sveltejs/kit';
import { getPeriodReport } from '$lib/server/report.js';
import { reportHtml } from '$lib/server/report-pdf.js';
import { htmlToPdf } from '$lib/server/pdf.js';
import { getCycleStartDay } from '$lib/server/cycle.js';
import { reportReady, todayJakarta, cycleRange, cycleLabel, formatLongDate } from '$lib/format.js';

// Fungsi Vercel sendiri (split) karena membawa Chromium ~70MB. Tanpa split, route lain
// dengan config sama (webhook Telegram, maxDuration 60) ikut digabung ke fungsi berat ini.
/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = { maxDuration: 60, split: true };

export async function GET({ params, locals }) {
	const key = params.period;
	if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) error(404, 'Periode tidak dikenal.');

	const startDay = getCycleStartDay();
	if (!reportReady(key, startDay, todayJakarta())) {
		const end = cycleRange(key, startDay).end;
		error(409, `Laporan ${cycleLabel(key)} baru bisa diunduh mulai ${formatLongDate(end)}.`);
	}

	const report = await getPeriodReport(key);
	const pdf = await htmlToPdf(reportHtml(report, { user: locals.user }));

	return new Response(/** @type {BodyInit} */ (pdf), {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="cashtrack-laporan-${key}.pdf"`,
			'cache-control': 'private, no-store'
		}
	});
}
