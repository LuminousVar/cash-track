<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SpendChart from '$lib/components/SpendChart.svelte';
	import MonthlyChart from '$lib/components/MonthlyChart.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import { untrack } from 'svelte';
	import {
		formatRp, categoryColor, cycleRangeLabel, budgetStatus, STATUS_STYLE,
		reportReady, cycleRange, cycleLabel, formatDayMonth
	} from '$lib/format.js';

	let { data } = $props();

	/** Periode yang PDF-nya sedang disiapkan. */
	let busy = $state(/** @type {string | null} */ (null));
	let pdfError = $state('');

	/** @param {string} key */
	const ready = (key) => reportReady(key, data.cycleStartDay, data.today);

	// Pemilih di header: semua periode yang sudah selesai dan punya transaksi, lintas
	// tahun, terbaru dulu. Supaya laporan lama yang lupa diunduh tetap bisa diambil.
	const pdfPeriods = $derived(data.report.periods.filter((p) => ready(p.key)));
	let pdfKey = $state(untrack(() => pdfPeriods[0]?.key ?? ''));

	/**
	 * Unduh lewat fetch (bukan link biasa) supaya ada status "Menyiapkan" selama
	 * Chromium di server merender, dan error bisa ditampilkan.
	 * @param {string} key
	 */
	async function downloadPdf(key) {
		busy = key;
		pdfError = '';
		try {
			const res = await fetch(`/laporan/pdf/${key}`);
			if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? 'Gagal membuat PDF.');
			// Sesi habis: server mengalihkan ke halaman login, bukan mengirim PDF.
			if (!res.headers.get('content-type')?.includes('application/pdf')) throw new Error('Sesi berakhir. Muat ulang halaman lalu coba lagi.');
			const url = URL.createObjectURL(await res.blob());
			Object.assign(document.createElement('a'), { href: url, download: `cashtrack-laporan-${key}.pdf` }).click();
			setTimeout(() => URL.revokeObjectURL(url), 10_000);
		} catch (e) {
			pdfError = e instanceof Error ? e.message : String(e);
		} finally {
			busy = null;
		}
	}

	const r = $derived(data.report);
	const year = $derived(r.summary.cycle.key.slice(0, 4));
	const currentIdx = $derived(Number(r.summary.cycle.key.slice(5, 7)) - 1);

	// Satu baris per periode di tahun ini, sampai periode berjalan (periode depan belum relevan).
	const periods = $derived(
		r.monthlyFlow
			.map((m, i) => ({ ...m, key: `${year}-${String(i + 1).padStart(2, '0')}`, idx: i }))
			.filter((m) => m.idx <= currentIdx)
	);
	const total = $derived(periods.reduce((s, m) => s + m.amount, 0));
	const active = $derived(periods.filter((m) => m.amount > 0));
	const avg = $derived(active.length ? Math.round(total / active.length) : 0);
	const peak = $derived(active.reduce((b, m) => (!b || m.amount > b.amount ? m : b), /** @type {(typeof periods)[number] | null} */ (null)));

	const cats = $derived(r.categoryTotals.filter((c) => c.amount > 0));
	const catTotal = $derived(cats.reduce((s, c) => s + c.amount, 0));
</script>

<PageHeader title="Laporan" description="Tahun {year}, dihitung per periode gajian.">
	<div class="flex w-full gap-2 sm:w-auto">
		<label class="min-w-0 flex-1 sm:flex-none">
			<span class="sr-only">Periode laporan PDF</span>
			<select bind:value={pdfKey} disabled={pdfPeriods.length === 0} class="field sm:w-60">
				{#each pdfPeriods as p}
					{@const range = cycleRangeLabel(p.key, data.cycleStartDay)}
					<option value={p.key}>{cycleLabel(p.key)}{range ? `, ${range}` : ''}</option>
				{:else}
					<option value="">Belum ada laporan</option>
				{/each}
			</select>
		</label>
		<button onclick={() => downloadPdf(pdfKey)} disabled={busy !== null || !pdfKey} class="btn btn-secondary shrink-0">
			<Icon name="download" class={busy === pdfKey ? 'animate-pulse' : ''} />
			{busy === pdfKey ? 'Menyiapkan...' : 'Unduh PDF'}
		</button>
	</div>
</PageHeader>

{#if !ready(r.summary.cycle.key)}
	<p class="mt-2 text-xs text-ink-mute sm:text-right">
		Laporan PDF periode {cycleLabel(r.summary.cycle.key)} bisa diunduh mulai {formatDayMonth(r.summary.cycle.end)}.
	</p>
{/if}

{#if pdfError}
	<p class="mt-4 rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">{pdfError}</p>
{/if}

<div class="mt-6 space-y-6">
	<section class="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-4" aria-label="Ringkasan tahunan">
		<div class="bg-surface p-4">
			<p class="eyebrow">Total {year}</p>
			<p class="num mt-1 text-xl font-semibold">{formatRp(total)}</p>
			{#if r.summary.investYear > 0}
				<p class="num mt-1 text-xs text-ink-mute">Di luar investasi {formatRp(r.summary.investYear)}</p>
			{/if}
		</div>
		<div class="bg-surface p-4">
			<p class="eyebrow">Rata-rata per periode</p>
			<p class="num mt-1 text-xl font-semibold">{formatRp(avg)}</p>
			<p class="mt-1 text-xs text-ink-mute">{active.length} periode ada transaksi</p>
		</div>
		<div class="bg-surface p-4">
			<p class="eyebrow">Periode tertinggi</p>
			<p class="mt-1 text-xl font-semibold">{peak ? peak.month : '-'}</p>
			{#if peak}<p class="num mt-1 text-xs text-ink-mute">{formatRp(peak.amount)}</p>{/if}
		</div>
		<div class="bg-surface p-4">
			<p class="eyebrow">Kategori terbesar</p>
			<p class="mt-1 text-xl font-semibold">{cats[0]?.name ?? '-'}</p>
			{#if cats[0]}<p class="num mt-1 text-xs text-ink-mute">{formatRp(cats[0].amount)}</p>{/if}
		</div>
	</section>

	<MonthlyChart
		categoryFlow={r.categoryFlow}
		prevYearFlow={r.trend.prevYearFlow}
		budget={data.budget}
		warnPct={data.warnPct}
		cycle={r.summary.cycle}
	/>

	<SpendChart trend={r.trend} budget={data.budget} cycle={r.summary.cycle} />

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<section class="card" aria-labelledby="period-heading">
			<h2 id="period-heading" class="border-b border-line px-4 py-3 text-sm font-semibold">Riwayat periode</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-xs text-ink-mute">
							<th class="px-3 py-2 font-medium sm:px-4">Periode</th>
							<th class="px-3 py-2 text-right font-medium sm:px-4">Pengeluaran</th>
							<th class="hidden px-4 py-2 text-right font-medium sm:table-cell">Dari anggaran</th>
							<th class="px-3 py-2 font-medium sm:px-4">Status</th>
							<th class="px-3 py-2 text-right font-medium sm:px-4"><span class="sr-only sm:not-sr-only">Laporan</span></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-line">
						{#each [...periods].reverse() as m}
							{@const pct = Math.round((m.amount / Math.max(1, data.budget)) * 100)}
							{@const st = STATUS_STYLE[budgetStatus(pct, data.warnPct)]}
							{@const range = cycleRangeLabel(m.key, data.cycleStartDay)}
							<tr>
								<td class="px-3 py-2.5 sm:px-4">
									<a href="/pengeluaran?period={m.key}" class="hover:underline">{m.month}</a>
									{#if range}<span class="block text-xs text-ink-mute">{range}</span>{/if}
								</td>
								<td class="num px-3 py-2.5 text-right whitespace-nowrap sm:px-4">{m.amount > 0 ? formatRp(m.amount) : '-'}</td>
								<td class="num hidden px-4 py-2.5 text-right text-ink-soft sm:table-cell">{m.amount > 0 ? `${pct}%` : '-'}</td>
								<td class="px-3 py-2.5 sm:px-4">
									{#if m.amount > 0}
										<span class="rounded-full px-2 py-0.5 text-xs font-medium {st.bg} {st.fg}">{st.label}</span>
									{:else}
										<span class="text-xs text-ink-mute">Tidak ada data</span>
									{/if}
								</td>
								<td class="px-3 py-1.5 text-right sm:px-4">
									{#if m.amount <= 0}
										<span class="text-xs text-ink-mute">-</span>
									{:else if ready(m.key)}
										<button
											onclick={() => downloadPdf(m.key)}
											disabled={busy !== null}
											class="btn btn-ghost h-8 px-2 text-xs"
											aria-label="Unduh laporan PDF {cycleLabel(m.key)}"
										>
											<Icon name="download" size={14} class={busy === m.key ? 'animate-pulse' : ''} />
											<span class="hidden sm:inline">{busy === m.key ? 'Menyiapkan...' : 'PDF'}</span>
										</button>
									{:else}
										<span class="text-xs whitespace-nowrap text-ink-mute"><span class="hidden sm:inline">Mulai </span>{formatDayMonth(cycleRange(m.key, data.cycleStartDay).end)}</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<section class="card" aria-labelledby="cat-heading">
			<h2 id="cat-heading" class="border-b border-line px-4 py-3 text-sm font-semibold">Per kategori, {year}</h2>
			{#if cats.length === 0}
				<p class="px-4 py-10 text-center text-sm text-ink-mute">Belum ada pengeluaran tahun ini.</p>
			{:else}
				<ul class="space-y-3 p-4">
					{#each cats as c}
						<li>
							<a href="/pengeluaran?category={encodeURIComponent(c.name)}" class="group block">
								<div class="flex items-center justify-between gap-3 text-sm">
									<span class="flex items-center gap-2.5 group-hover:underline">
										<CategoryIcon category={c.name} size={26} />
										{c.name}
									</span>
									<span class="num text-ink-soft">
										{formatRp(c.amount)}
										<span class="ml-1 inline-block w-9 text-right text-xs text-ink-mute">{Math.round((c.amount / Math.max(1, catTotal)) * 100)}%</span>
									</span>
								</div>
								<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle">
									<div class="h-full rounded-full" style="width: {(c.amount / Math.max(1, cats[0].amount)) * 100}%; background: {categoryColor(c.name)}"></div>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>
