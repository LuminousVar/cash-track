<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatRp, formatRpShort, CATEGORY_TONE } from '$lib/format.js';

	let { data } = $props();

	const flow = $derived(data.report.monthlyFlow);
	const maxFlow = $derived(Math.max(1, ...flow.map((m) => m.amount)));
	const peakIndex = $derived(flow.reduce((bi, m, i, a) => (m.amount > a[bi].amount ? i : bi), 0));
	const totalYear = $derived(flow.reduce((s, m) => s + m.amount, 0));
	const activeMonths = $derived(flow.filter((m) => m.amount > 0).length || 1);
	const maxCat = $derived(Math.max(1, ...data.report.categoryTotals.map((c) => c.amount)));
</script>

<PageHeader title="Laporan" subtitle="Ringkasan pengeluaran sepanjang tahun." />

<!-- Statistik -->
<section class="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Total setahun</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(totalYear)}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Rata-rata / bulan</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(Math.round(totalYear / activeMonths))}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Bulan tertinggi</p>
		<p class="mt-2 text-2xl font-extrabold">{flow[peakIndex]?.month ?? '-'}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Kategori teratas</p>
		<p class="mt-2 text-2xl font-extrabold">{data.report.categoryTotals[0]?.name ?? '-'}</p>
	</div>
</section>

<!-- Chart bulanan -->
<section class="mt-5 rounded-card bg-surface p-5">
	<div class="flex items-center justify-between">
		<span class="text-sm font-semibold">Arus Pengeluaran Bulanan</span>
		<span class="flex items-center gap-1.5 text-xs text-ink-soft"><span class="size-2 rounded-full bg-forest-700"></span>Pengeluaran</span>
	</div>
	<div class="relative mt-8 flex h-64 items-end justify-between gap-2 sm:gap-3">
		{#each flow as m, i}
			<div class="group flex h-full flex-1 flex-col items-center justify-end gap-2">
				{#if i === peakIndex && m.amount > 0}
					<div class="-mb-1 rounded-lg bg-forest-900 px-2.5 py-1.5 text-center text-white shadow-lg">
						<p class="text-[10px] text-white/60">{m.month}</p>
						<p class="num text-xs font-bold">{formatRp(m.amount)}</p>
					</div>
				{/if}
				<div class="w-full max-w-[28px] rounded-t-md" style="height: {Math.round((m.amount / maxFlow) * 100)}%; background: linear-gradient(to top, var(--color-forest-800), {i === peakIndex ? 'var(--color-lime-400)' : 'var(--color-forest-500)'});"></div>
				<span class="text-[11px] {i === peakIndex ? 'font-bold text-ink' : 'text-ink-mute'}">{m.month}</span>
			</div>
		{/each}
	</div>
</section>

<!-- Breakdown kategori -->
<section class="mt-5 rounded-card bg-surface p-5">
	<span class="text-sm font-semibold">Pengeluaran per Kategori</span>
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
