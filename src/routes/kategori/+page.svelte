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
		<a
			href="/pengeluaran?category={encodeURIComponent(c.name)}"
			class="group block rounded-card bg-surface p-5 transition hover:-translate-y-0.5 hover:ring-1 hover:ring-line"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<span class="grid size-9 place-items-center rounded-xl text-sm font-bold" style="background: {tone.bg}; color: {tone.fg};">{c.name[0]}</span>
					<span class="font-semibold">{c.name}</span>
				</div>
				<span class="flex items-center gap-1 text-sm font-semibold text-ink-soft">
					<span class="num">{pct}%</span>
					<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-forest-600"><path d="m9 18 6-6-6-6" /></svg>
				</span>
			</div>
			<p class="num mt-4 text-2xl font-extrabold tracking-tight">{formatRp(c.amount)}</p>
			<div class="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
				<div class="h-full rounded-full" style="width: {pct}%; background: {tone.fg};"></div>
			</div>
		</a>
	{/each}
</section>
