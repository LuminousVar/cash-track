// Template HTML laporan PDF per periode. Diturunkan dari template Kami
// "equity-report-en" (kertas parchment, satu serif, aksen ink-blue), lalu dirender
// Chromium di ./pdf.js. CSS di bawah sengaja mengikuti token Kami, jangan diganti
// warna aplikasi.
import charisSil from './fonts/CharisSIL-Regular-latin.woff2?inline';
import { cumulative, niceTicks, linePath, labelIndexes } from '$lib/chart.js';
import { MONTHS_LONG, formatRp, formatRpShort, formatDayMonth, formatLongDate, addDays, STATUS_STYLE } from '$lib/format.js';

/** @typedef {Awaited<ReturnType<typeof import('./report.js').getPeriodReport>>} PeriodReport */

/**
 * Escape teks untuk HTML. Merchant dan catatan berasal dari OCR / input bebas.
 * @param {unknown} s
 */
const esc = (s) =>
	String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

/** @param {string} key "YYYY-MM" jadi "Oktober 2026" */
const longLabel = (key) => `${MONTHS_LONG[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
/** @param {string} key "YYYY-MM" jadi "Oktober" */
const monthName = (key) => MONTHS_LONG[Number(key.slice(5, 7)) - 1];

/** @param {number} n */
const signedRp = (n) => (n > 0 ? '+' : n < 0 ? '-' : '') + formatRp(Math.abs(n));

/** @param {number} part @param {number} whole */
const share = (part, whole) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '-');

/**
 * Chart garis kumulatif per hari, warna data chart Kami: periode ini ink-blue,
 * periode lalu abu hangat, anggaran garis putus-putus.
 * @param {PeriodReport} r
 */
function chartSvg(r) {
	const W = 696;
	const H = 232;
	const P = { l: 64, r: 16, t: 16, b: 32 };
	const cur = cumulative(r.daily);
	const prev = r.prevTotal > 0 ? cumulative(r.prevDaily) : [];
	const n = Math.max(cur.length, prev.length);
	const ticks = niceTicks(Math.max(r.budget, ...cur, ...prev) * 1.04);
	const yMax = ticks.at(-1) ?? 1;
	const plotW = W - P.l - P.r;
	const plotH = H - P.t - P.b;
	/** @param {number} i */
	const x = (i) => P.l + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
	/** @param {number} v */
	const y = (v) => P.t + plotH - (v / yMax) * plotH;

	const grid = ticks
		.map(
			(t) =>
				`<line x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}" stroke="${t === 0 ? '#d4d3cd' : '#e8e6dc'}" stroke-width="1"/>` +
				`<text x="${P.l - 8}" y="${y(t)}" dy="0.32em" text-anchor="end">${t === 0 ? '0' : formatRpShort(t)}</text>`
		)
		.join('');
	const xLabels = labelIndexes(n, plotW, 72)
		.map((i) => `<text x="${x(i)}" y="${H - 10}" text-anchor="${i === 0 ? 'start' : 'middle'}">${formatDayMonth(addDays(r.range.start, i))}</text>`)
		.join('');

	const by = y(r.budget);
	const budget =
		`<line x1="${P.l}" x2="${W - P.r}" y1="${by}" y2="${by}" stroke="#6b6a64" stroke-width="1" stroke-dasharray="4 4"/>` +
		`<text x="${P.l + 4}" y="${by < P.t + 16 ? by + 16 : by - 6}">Anggaran ${formatRpShort(r.budget)}</text>`;

	const line = (/** @type {number[]} */ v, /** @type {string} */ color) =>
		v.length ? `<path d="${linePath(v.map((val, i) => [x(i), y(val)]))}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : '';

	// Label nilai akhir hanya di garis periode ini; garis lalu cukup lewat legenda.
	const end = cur.length - 1;
	const endLabel =
		end >= 0
			? `<circle cx="${x(end)}" cy="${y(cur[end])}" r="4" fill="#1B365D" stroke="#f5f4ed" stroke-width="2"/>` +
				`<text x="${x(end) - 8}" y="${y(cur[end]) - 10}" text-anchor="end" class="value">${formatRp(cur[end])}</text>`
			: '';

	return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pengeluaran kumulatif per hari">${grid}${xLabels}${budget}${line(prev, '#b8b7b0')}${line(cur, '#1B365D')}${endLabel}</svg>`;
}

/**
 * Kunci legenda berupa garis SVG kecil. Ramp abu chart Kami hanya sah di dalam
 * SVG, bukan sebagai warna CSS biasa (cek --check-style Kami).
 * @param {string} color
 * @param {boolean} [dashed]
 */
const legendKey = (color, dashed = false) =>
	`<svg class="key" viewBox="0 0 20 4" aria-hidden="true"><line x1="0" y1="2" x2="20" y2="2" stroke="${color}" stroke-width="${dashed ? 1.5 : 2.5}"${dashed ? ' stroke-dasharray="4 3"' : ''}/></svg>`;

/**
 * Kalimat ringkasan dari angka laporan. Hanya fakta yang ada di data.
 * @param {PeriodReport} r
 */
function summaryText(r) {
	const count = r.expenses.length;
	if (count === 0) return `Tidak ada transaksi tercatat selama periode ${esc(longLabel(r.key))}.`;
	const parts = [
		`Selama periode ${esc(longLabel(r.key))} tercatat <span class="hl">${count} transaksi</span> dengan total <span class="hl">${formatRp(r.total)}</span>, atau ${r.pct}% dari anggaran ${formatRp(r.budget)}.`
	];
	const [top, second] = r.categories.filter((c) => c.amount > 0);
	if (top) {
		parts.push(
			`Kategori terbesar adalah ${esc(top.name)} sebesar ${formatRp(top.amount)} (${share(top.amount, r.total)} dari total)` +
				(second ? `, diikuti ${esc(second.name)} sebesar ${formatRp(second.amount)}.` : '.')
		);
	}
	const peak = r.daily.reduce((best, v, i) => (v > r.daily[best] ? i : best), 0);
	parts.push(`Pengeluaran harian tertinggi terjadi pada ${formatLongDate(addDays(r.range.start, peak))}, sebesar ${formatRp(r.daily[peak])}.`);
	if (r.prevTotal > 0) {
		const d = Math.round(((r.total - r.prevTotal) / r.prevTotal) * 100);
		parts.push(
			`Dibanding periode ${esc(monthName(r.prevKey))} (${formatRp(r.prevTotal)}), pengeluaran ` +
				(d === 0 ? 'relatif sama.' : `${d > 0 ? 'naik' : 'turun'} ${Math.abs(d)}%.`)
		);
	}
	if (r.invested > 0) {
		parts.push(`Selain itu ada investasi ${formatRp(r.invested)} (${r.investments.length} transaksi) yang dicatat terpisah dan tidak dihitung ke anggaran.`);
	}
	return parts.join(' ');
}

/** @param {PeriodReport} r */
function statusText(r) {
	const label = STATUS_STYLE[r.status].label;
	const left = r.budget - r.total;
	if (r.status === 'over') {
		return `<span class="hl">${label}.</span> Pengeluaran melewati anggaran sebesar ${formatRp(-left)} (${r.pct}% dari anggaran).`;
	}
	const where = r.status === 'warn' ? `melewati batas peringatan ${r.warnPct}%` : `di bawah batas peringatan ${r.warnPct}%`;
	return `<span class="hl">${label}.</span> Pengeluaran berhenti di ${r.pct}% anggaran, ${where}. Sisa anggaran ${formatRp(left)}.`;
}

/**
 * Tabel ringkas dua kolom angka (transaksi, jumlah).
 * @param {string} head
 * @param {{ name: string, count: number, amount: number }[]} rows
 */
function groupTable(head, rows) {
	const body = rows.map((g) => `<tr><td>${esc(g.name)}</td><td>${g.count}</td><td>${formatRp(g.amount)}</td></tr>`).join('');
	return `<table class="financial compact"><thead><tr><th>${head}</th><th>Transaksi</th><th>Jumlah</th></tr></thead><tbody>${body}</tbody></table>`;
}

/**
 * HTML lengkap laporan satu periode, siap dirender jadi PDF A4.
 * @param {PeriodReport} r
 * @param {{ user?: string | null, generatedAt?: Date }} [meta]
 */
export function reportHtml(r, { user = null, generatedAt = new Date() } = {}) {
	const title = `Laporan Pengeluaran ${longLabel(r.key)}`;
	const prevMonth = monthName(r.prevKey);
	const range = `${formatLongDate(r.range.start)} - ${formatLongDate(r.range.end)}`;
	const created = new Intl.DateTimeFormat('id-ID', {
		timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
	}).format(generatedAt);

	let change = `Belum ada data ${esc(prevMonth)}`;
	if (r.prevTotal > 0) {
		const d = Math.round(((r.total - r.prevTotal) / r.prevTotal) * 100);
		change = d === 0 ? `Sama dengan ${esc(prevMonth)}` : `${d > 0 ? 'Naik' : 'Turun'} ${Math.abs(d)}% dari ${esc(prevMonth)}`;
	}

	const catRows = r.categories
		.map(
			(c) =>
				`<tr><td>${esc(c.name)}</td><td>${c.count}</td><td>${formatRp(c.amount)}</td><td>${share(c.amount, r.total)}</td>` +
				`<td>${formatRp(c.prevAmount)}</td><td>${signedRp(c.amount - c.prevAmount)}</td></tr>`
		)
		.join('');

	const txRows = r.expenses
		.map(
			(e) =>
				`<tr><td>${formatDayMonth(e.date)}</td><td class="wrap">${esc(e.merchant.trim() || 'Tanpa nama')}</td><td>${esc(e.category || 'Lainnya')}</td>` +
				`<td>${esc(e.method || '-')}</td><td>${e.source === 'manual' ? 'Manual' : 'Struk'}</td><td>${formatRp(e.total)}</td></tr>`
		)
		.join('');

	const invRows = r.investments
		.map(
			(e) =>
				`<tr><td>${formatDayMonth(e.date)}</td><td class="wrap">${esc(e.merchant.trim() || 'Tanpa nama')}</td>` +
				`<td>${esc(e.method || '-')}</td><td>${formatRp(e.total)}</td></tr>`
		)
		.join('');

	const hasTx = r.expenses.length > 0;

	return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="author" content="${esc(user || 'cash-track')}">
<meta name="description" content="${esc(`Ringkasan, pergerakan, dan rincian pengeluaran periode ${longLabel(r.key)} (${range}).`)}">
<meta name="keywords" content="${esc(`laporan pengeluaran, anggaran, ${longLabel(r.key)}, cash-track`)}">
<meta name="generator" content="Kami">
<style>
  @font-face { font-family: "Charis SIL"; src: url("${charisSil}") format("woff2"); font-weight: 400 500; font-style: normal; }

  @page {
    size: A4;
    margin: 16mm 18mm 18mm 18mm;
    background: #f5f4ed;

    @bottom-center {
      content: counter(page) " / " counter(pages) "  ·  ${esc(title)}";
      font-family: "Charis SIL", Georgia, serif;
      font-size: 9pt;
      color: #6b6a64;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --parchment: #f5f4ed;
    --ivory:     #faf9f5;
    --near-black:#141413;
    --dark-warm: #3d3d3a;
    --olive:     #504e49;
    --stone:     #6b6a64;
    --brand:     #1B365D;
    --border:    #e8e6dc;

    --serif: "Charis SIL", Charter, Georgia, Palatino, "Times New Roman", serif;
    --sans: var(--serif);

    --rhythm-module:  14pt;
  }

  html, body { background: var(--parchment); }

  body {
    color: var(--near-black);
    font-family: var(--serif);
    font-size: 10pt;
    line-height: 1.5;
    widows: 3;
    orphans: 3;
  }

  .hl { color: var(--brand); font-weight: 500; }

  /* HEADER */
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16pt;
    margin-bottom: var(--rhythm-module);
    padding-bottom: 10pt;
    border-bottom: 0.5pt solid var(--border);
  }
  .ticker-eyebrow {
    font-size: 9pt;
    color: var(--brand);
    letter-spacing: 1.5pt;
    text-transform: uppercase;
    font-weight: 500;
    margin-bottom: 4pt;
  }
  .ticker-name {
    font-size: 26pt;
    font-weight: 500;
    line-height: 1.12;
    letter-spacing: -0.3pt;
    margin-bottom: 4pt;
  }
  .ticker-sub { font-size: 10pt; color: var(--olive); line-height: 1.4; }
  .price-block { text-align: right; padding-top: 4pt; }
  .price-current {
    font-size: 26pt;
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.5pt;
    white-space: nowrap;
  }
  .price-change { font-size: 10pt; font-weight: 500; margin-top: 4pt; color: var(--olive); }
  .price-date { font-size: 9pt; color: var(--stone); margin-top: 2pt; }

  /* METRICS: nilai di atas label (CHEATSHEET: vertical stack) */
  .metrics {
    display: flex;
    gap: 16pt;
    margin-bottom: 16pt;
    padding: 8pt 0;
    border-top: 0.3pt dotted var(--border);
    border-bottom: 0.3pt dotted var(--border);
  }
  .metric { flex: 1; display: flex; flex-direction: column; gap: 3pt; }
  .metric-value {
    font-size: 16pt;
    font-weight: 500;
    color: var(--brand);
    line-height: 1;
    white-space: nowrap;
    letter-spacing: -0.3pt;
  }
  .metric-label { font-size: 9pt; color: var(--olive); line-height: 1.3; white-space: nowrap; }

  /* SECTIONS */
  h2 {
    font-size: 16pt;
    font-weight: 500;
    margin: 18pt 0 6pt 0;
    break-after: avoid;
  }
  h3 {
    font-size: 13pt;
    font-weight: 500;
    color: var(--dark-warm);
    margin: 12pt 0 4pt 0;
    break-after: avoid;
  }
  p { margin: 0 0 8pt 0; line-height: 1.5; widows: 2; orphans: 2; }

  /* TABLE (kami-table) */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin: 8pt 0;
    break-inside: avoid;
  }
  table th {
    text-align: left;
    font-weight: 500;
    color: var(--dark-warm);
    padding: 6pt 8pt;
    border-bottom: 0.6pt solid var(--border);
  }
  table td {
    padding: 5pt 8pt;
    border-bottom: 0.25pt solid var(--border);
    vertical-align: top;
  }
  table.compact th { padding: 3pt 6pt; font-size: 8pt; }
  table.compact td { padding: 2.5pt 6pt; font-size: 8pt; line-height: 1.4; }
  table.financial td:not(:first-child) { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  table.financial th:not(:first-child) { text-align: right; }
  table .total td { font-weight: 500; border-top: 0.6pt solid var(--border); border-bottom: none; }

  /* Rincian transaksi boleh terpotong antar halaman; header tabel diulang otomatis. */
  table.tx { break-inside: auto; }
  table.tx tr { break-inside: avoid; }
  table.tx td.wrap { text-align: left; white-space: normal; overflow-wrap: anywhere; }
  table.tx td:nth-child(n+3):nth-child(-n+5),
  table.tx th:nth-child(-n+5) { text-align: left; }
  table.inv { break-inside: auto; }
  table.inv td.wrap { text-align: left; white-space: normal; overflow-wrap: anywhere; }
  table.inv td:nth-child(3), table.inv th:nth-child(-n+3) { text-align: left; }

  /* CALLOUT */
  .callout {
    background: var(--ivory);
    padding: 8pt 12pt;
    border-radius: 3pt;
    margin: 10pt 0;
    line-height: 1.5;
    break-inside: avoid;
  }

  /* FIGURE */
  figure { margin: 12pt 0; break-inside: avoid; }
  figure svg { display: block; width: 100%; height: auto; }
  figure svg text { font-family: var(--serif); font-size: 13px; fill: var(--stone); font-variant-numeric: tabular-nums; }
  figure svg text.value { fill: var(--near-black); }
  figcaption {
    font-size: 9pt;
    color: var(--stone);
    margin-top: 6pt;
    text-align: center;
  }
  .key { display: inline-block; width: 14pt; height: 3pt; vertical-align: middle; margin: 0 4pt 1pt 10pt; }
  .key:first-child { margin-left: 0; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; break-inside: avoid; }

  .report-footer {
    margin-top: 16pt;
    padding-top: 6pt;
    border-top: 0.3pt dotted var(--border);
    font-size: 9pt;
    color: var(--stone);
    display: flex;
    justify-content: space-between;
    gap: 16pt;
  }
</style>
</head>
<body>

<div class="report-header">
  <div>
    <div class="ticker-eyebrow">Laporan Pengeluaran</div>
    <div class="ticker-name">${esc(longLabel(r.key))}</div>
    <div class="ticker-sub">${range} · ${r.range.days} hari${user ? ` · ${esc(user)}` : ''}</div>
  </div>
  <div class="price-block">
    <div class="price-current">${formatRp(r.total)}</div>
    <div class="price-change">${change}</div>
    <div class="price-date">Dibuat ${esc(created)} WIB</div>
  </div>
</div>

<div class="metrics">
  <div class="metric"><div class="metric-value">${formatRp(r.budget)}</div><div class="metric-label">Anggaran</div></div>
  <div class="metric"><div class="metric-value">${r.pct}%</div><div class="metric-label">Anggaran terpakai</div></div>
  <div class="metric"><div class="metric-value">${formatRp(Math.round(r.total / r.range.days))}</div><div class="metric-label">Rata-rata per hari</div></div>
  <div class="metric"><div class="metric-value">${r.expenses.length}</div><div class="metric-label">Transaksi</div></div>
</div>

<h2>Ringkasan</h2>
<p>${summaryText(r)}</p>
<div class="callout">${statusText(r)}</div>

<h2>Pergerakan pengeluaran</h2>
<figure>
  ${chartSvg(r)}
  <figcaption>
    ${legendKey('#1B365D')}${esc(monthName(r.key))}
    ${r.prevTotal > 0 ? `${legendKey('#b8b7b0')}${esc(prevMonth)}` : ''}
    ${legendKey('#6b6a64', true)}Anggaran. Pengeluaran kumulatif per hari periode.
  </figcaption>
</figure>

${
	hasTx
		? `<h2>Per kategori</h2>
<table class="financial">
  <thead><tr><th>Kategori</th><th>Transaksi</th><th>Jumlah</th><th>Porsi</th><th>${esc(prevMonth)}</th><th>Selisih</th></tr></thead>
  <tbody>
    ${catRows}
    <tr class="total"><td>Total</td><td>${r.expenses.length}</td><td>${formatRp(r.total)}</td><td>100%</td><td>${formatRp(r.prevTotal)}</td><td>${signedRp(r.total - r.prevTotal)}</td></tr>
  </tbody>
</table>

<div class="two-col">
  <div><h3>Metode pembayaran</h3>${groupTable('Metode', r.methods)}</div>
  <div><h3>Merchant teratas</h3>${groupTable('Merchant', r.merchants)}</div>
</div>

<h2>Rincian transaksi</h2>
<table class="financial compact tx">
  <thead><tr><th>Tanggal</th><th>Merchant</th><th>Kategori</th><th>Metode</th><th>Sumber</th><th>Jumlah</th></tr></thead>
  <tbody>
    ${txRows}
    <tr class="total"><td>Total</td><td></td><td></td><td></td><td></td><td>${formatRp(r.total)}</td></tr>
  </tbody>
</table>`
		: ''
}

${
	r.investments.length
		? `<h2>Investasi</h2>
<p>Tidak dihitung ke pengeluaran maupun anggaran.</p>
<table class="financial compact inv">
  <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Metode</th><th>Jumlah</th></tr></thead>
  <tbody>
    ${invRows}
    <tr class="total"><td>Total</td><td></td><td></td><td>${formatRp(r.invested)}</td></tr>
  </tbody>
</table>`
		: ''
}

<div class="report-footer">
  <span>Dibuat otomatis oleh cash-track dari data Google Sheet.</span>
  <span>${esc(user || 'cash-track')} · ${esc(created)}</span>
</div>

</body>
</html>`;
}
