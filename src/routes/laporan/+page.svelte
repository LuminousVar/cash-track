<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SpendChart from '$lib/components/SpendChart.svelte';
	import MonthlyChart from '$lib/components/MonthlyChart.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import Select from '$lib/components/Select.svelte';
	import { untrack } from 'svelte';
	import {
		formatRp, categoryColor, cycleRangeLabel, budgetStatus, STATUS_STYLE,
		reportReady, cycleRange, cycleLabel, formatDayMonth, MONTHS_LONG
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
	const pdfOptions = $derived(
		pdfPeriods.map((p) => ({ value: p.key, label: cycleLabel(p.key), hint: cycleRangeLabel(p.key, data.cycleStartDay) }))
	);

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
		<Select
			label="Periode laporan PDF"
			hideLabel
			bind:value={pdfKey}
			options={pdfOptions}
			disabled={pdfOptions.length === 0}
			placeholder="Belum ada laporan"
			class="min-w-0 flex-1 sm:w-64 sm:flex-none"
		/>
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
			<div class="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
				<h2 id="period-heading" class="text-sm font-semibold">Riwayat periode</h2>
				<p class="num text-xs text-ink-mute">Anggaran {formatRp(data.budget)}</p>
			</div>
			<!-- Daftar, bukan tabel: di HP lima kolom tidak muat. Tiap periode dua baris:
				 nama dan total, lalu pemakaian anggaran dan keterangannya. -->
			<ul class="divide-y divide-line">
				{#each [...periods].reverse() as m (m.key)}
					{@const pct = Math.round((m.amount / Math.max(1, data.budget)) * 100)}
					{@const st = STATUS_STYLE[budgetStatus(pct, data.warnPct)]}
					{@const range = cycleRangeLabel(m.key, data.cycleStartDay)}
					{@const running = m.key === r.summary.cycle.key}
					<li class="flex items-center gap-2 py-3 pl-4 pr-2">
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-3">
								<a href="/pengeluaran?period={m.key}" class="flex min-w-0 items-center gap-2 text-sm font-medium hover:underline">
									<span class="truncate">{MONTHS_LONG[m.idx]}</span>
									{#if running}
										<span class="shrink-0 rounded-full bg-accent-soft px-1.5 py-px text-[11px] font-medium text-accent">Berjalan</span>
									{/if}
								</a>
								<span class="num shrink-0 text-sm font-semibold {m.amount > 0 ? '' : 'text-ink-mute'}">{m.amount > 0 ? formatRp(m.amount) : '-'}</span>
							</div>
							{#if m.amount > 0}
								<div class="mt-2 flex items-center gap-2.5">
									<div
										class="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle"
										role="progressbar"
										aria-valuemin="0"
										aria-valuemax="100"
										aria-valuenow={Math.min(100, pct)}
										aria-label="Pemakaian anggaran {cycleLabel(m.key)}"
									>
										<div class="h-full rounded-full {st.bar}" style="width: {Math.min(100, pct)}%"></div>
									</div>
									<span class="num w-10 shrink-0 text-right text-xs font-medium {st.fg}">{pct}%</span>
								</div>
							{/if}
							<p class="mt-1.5 flex flex-wrap gap-x-1.5 text-xs text-ink-mute">
								<span class={m.amount > 0 ? `font-medium ${st.fg}` : ''}>{m.amount > 0 ? st.label : 'Tidak ada transaksi'}</span>
								{#if range}<span aria-hidden="true">·</span><span>{range}</span>{/if}
								{#if m.amount > 0 && !ready(m.key)}
									<span aria-hidden="true">·</span><span>PDF mulai {formatDayMonth(cycleRange(m.key, data.cycleStartDay).end)}</span>
								{/if}
							</p>
						</div>
						<div class="w-9 shrink-0">
							{#if m.amount > 0 && ready(m.key)}
								<button
									onclick={() => downloadPdf(m.key)}
									disabled={busy !== null}
									class="btn btn-ghost btn-icon h-9 w-9"
									aria-label="Unduh laporan PDF {cycleLabel(m.key)}"
									title="Unduh PDF"
								>
									<Icon name="download" class={busy === m.key ? 'animate-pulse' : ''} />
								</button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
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
									<span class="flex min-w-0 items-center gap-2.5 group-hover:underline">
										<CategoryIcon category={c.name} size={26} />
										<span class="truncate">{c.name}</span>
									</span>
									<span class="num shrink-0 text-ink-soft">
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
