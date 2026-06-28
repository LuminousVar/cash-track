<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatRp, CATEGORY_TONE } from '$lib/format.js';

	let { data } = $props();

	const totalAll = $derived(data.report.categoryTotals.reduce((s, c) => s + c.amount, 0) || 1);
	const top = $derived(data.report.categoryTotals[0]);
</script>

<PageHeader title="Kategori" subtitle="Pengeluaran berdasarkan kategori.">
	{#if data.report.demo}<span class="rounded-full bg-warn-bg px-2.5 py-1 text-[11px] font-semibold text-warn">Mode demo</span>{/if}
</PageHeader>

<!-- Sorotan -->
<section class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Total semua kategori</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(totalAll)}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Kategori terbesar</p>
		<p class="mt-2 text-2xl font-extrabold">{top?.name ?? '-'}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Nilai terbesar</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(top?.amount ?? 0)}</p>
	</div>
</section>

<!-- Kartu kategori -->
<section class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
	{#each data.report.categoryTotals as c}
		{@const tone = CATEGORY_TONE[c.name] ?? CATEGORY_TONE.Lainnya}
		{@const pct = Math.round((c.amount / totalAll) * 100)}
		<article class="rounded-card bg-surface p-5">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<span class="grid size-9 place-items-center rounded-xl text-sm font-bold" style="background: {tone.bg}; color: {tone.fg};">{c.name[0]}</span>
					<span class="font-semibold">{c.name}</span>
				</div>
				<span class="num text-sm font-semibold text-ink-soft">{pct}%</span>
			</div>
			<p class="num mt-4 text-2xl font-extrabold tracking-tight">{formatRp(c.amount)}</p>
			<div class="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
				<div class="h-full rounded-full" style="width: {pct}%; background: {tone.fg};"></div>
			</div>
		</article>
	{/each}
</section>
