<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatRp, formatRpShort, CATEGORY_TONE } from '$lib/format.js';

	let { data } = $props();

	const flow = $derived(data.report.monthlyFlow);
	const maxFlow = $derived(Math.max(1, ...flow.map((m) => m.amount)));
	const peakIndex = $derived(flow.reduce((bi, m, i, a) => (m.amount > a[bi].amount ? i : bi), 0));
	const totalYear = $derived(flow.reduce((s, m) => s + m.amount, 0));
	const activeMonths = $derived(flow.filter((m) => m.amount > 0).length || 1);
	const hasData = $derived(totalYear > 0);
	const topCat = $derived(data.report.categoryTotals[0]);
	const maxCat = $derived(Math.max(1, ...data.report.categoryTotals.map((c) => c.amount)));

	const maxScale = $derived(maxFlow * 1.12);
	// Sama dengan kartu "Rata-rata / bulan": dibagi bulan yang ada transaksinya.
	const avgFlow = $derived(Math.round(totalYear / activeMonths));
	const avgLineTop = $derived(100 - Math.round((avgFlow / maxScale) * 100));
	const dotLeft = $derived(((peakIndex + 0.5) / flow.length) * 100);

	const ghostFill =
		'repeating-linear-gradient(45deg, rgba(60,117,83,0.13) 0 1.5px, transparent 1.5px 6px), rgba(60,117,83,0.06)';
</script>

<PageHeader title="Laporan" subtitle="Ringkasan pengeluaran sepanjang tahun." />

<!-- Statistik -->
<section class="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
	<div class="col-span-2 rounded-card bg-surface p-5 sm:col-span-1">
		<p class="text-sm font-semibold text-ink-soft">Total setahun</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(totalYear)}</p>
	</div>
	<div class="col-span-2 rounded-card bg-surface p-5 sm:col-span-1">
		<p class="text-sm font-semibold text-ink-soft">Rata-rata / bulan</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(Math.round(totalYear / activeMonths))}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Bulan tertinggi</p>
		<p class="mt-2 text-2xl font-extrabold">{hasData ? flow[peakIndex].month : '-'}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Kategori teratas</p>
		<p class="mt-2 text-2xl font-extrabold">{topCat?.amount > 0 ? topCat.name : '-'}</p>
	</div>
</section>

<!-- Chart bulanan (stacked bar, identik dengan dashboard) -->
<section class="mt-5 rounded-card bg-surface p-5 shadow-[0_18px_50px_-20px_rgba(28,59,48,0.35)]">
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-3">
			<span class="text-sm font-semibold">Arus Pengeluaran Bulanan</span>
			<span class="flex items-center gap-1.5 text-xs text-ink-soft">
				<span class="inline-block size-2 rounded-full bg-forest-800"></span>Manual
			</span>
			<span class="flex items-center gap-1.5 text-xs text-ink-soft">
				<span class="inline-block size-2 rounded-full bg-lime-500"></span>via Telegram
			</span>
		</div>
		<span class="shrink-0 rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">Bulanan</span>
	</div>

	<!-- Panel chart -->
	<div class="mt-5 rounded-2xl bg-canvas/50 p-4 pt-6 ring-1 ring-line/70">
		<!-- Zona bar -->
		<div class="relative flex h-48 items-end">
			<!-- Garis rata-rata putus-putus + dot penanda -->
			<div class="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-forest-700/35" style="top:{avgLineTop}%">
				<span class="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest-700 ring-4 ring-surface" style="left:{dotLeft}%"></span>
			</div>

			{#each flow as m, i}
				{@const isPeak = i === peakIndex}
				{@const hTotal = Math.max(7, Math.round((m.amount / maxScale) * 100))}
				{@const tg = m.telegram ?? 0}
				{@const manual = Math.max(0, m.amount - tg)}
				{@const limePct = m.amount > 0 ? Math.round((tg / m.amount) * 100) : 0}
				<div class="group relative flex h-full flex-1 items-end justify-center">
					<!-- Ghost bar bertekstur diagonal -->
					<div class="absolute inset-y-0 left-1/2 w-[88%] -translate-x-1/2 rounded-lg" style="background:{ghostFill}"></div>

					<!-- Tooltip -->
					<div class="pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-30 hidden -translate-x-1/2 group-hover:block">
						<div class="relative min-w-[152px] rounded-xl bg-forest-900 px-3.5 py-2.5 shadow-2xl ring-1 ring-white/10">
							<p class="text-[11px] font-medium text-white/50">{m.month} · Pengeluaran</p>
							<p class="num mt-0.5 text-[15px] font-bold text-white">{formatRp(m.amount)}</p>
							<div class="mt-2 space-y-1 border-t border-white/10 pt-2">
								<p class="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-white/70">
									<span class="inline-block size-2 rounded-full bg-forest-500"></span>Manual
									<span class="num ml-auto font-semibold text-white">{formatRp(manual)}</span>
								</p>
								<p class="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-white/70">
									<span class="inline-block size-2 rounded-full bg-lime-400"></span>Telegram
									<span class="num ml-auto font-semibold text-white">{formatRp(tg)}</span>
								</p>
							</div>
							<div class="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-forest-900"></div>
						</div>
					</div>

					<!-- Batang stacked: forest (manual) atas + lime (telegram) bawah -->
					<div
						class="relative z-20 flex w-[88%] flex-col overflow-hidden rounded-lg shadow-sm transition-[filter] duration-200 group-hover:brightness-110"
						style="height:{hTotal}%"
					>
						<div class="w-full flex-1" style="background:linear-gradient(to top,var(--color-forest-700),var(--color-forest-500))"></div>
						{#if limePct > 0}
							<div class="w-full shrink-0" style="height:{limePct}%; background:linear-gradient(to top,var(--color-lime-600),var(--color-lime-400))"></div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		<!-- Zona label bulan -->
		<div class="mt-3 flex">
			{#each flow as m, i}
				<span class="flex-1 text-center text-[10px] leading-none {i === peakIndex ? 'font-bold text-ink' : 'text-ink-mute'}">{m.month}</span>
			{/each}
		</div>
	</div>
</section>

<!-- Breakdown kategori -->
<section class="mt-5 rounded-card bg-surface p-5">
	<span class="text-sm font-semibold">Pengeluaran per Kategori</span>
	<span class="ml-2 text-xs text-ink-mute">tahun ini</span>
	<div class="mt-5 space-y-4">
		{#each data.report.categoryTotals as c}
			{@const tone = CATEGORY_TONE[c.name] ?? CATEGORY_TONE.Lainnya}
			<div>
				<div class="flex items-center justify-between text-sm">
					<span class="font-semibold">{c.name}</span>
					<span class="num text-ink-soft">{formatRp(c.amount)}</span>
				</div>
				<div class="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas">
					<div class="h-full rounded-full" style="width: {Math.round((c.amount / maxCat) * 100)}%; background: {tone.fg};"></div>
				</div>
			</div>
		{/each}
	</div>
</section>
