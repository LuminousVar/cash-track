<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatRp, formatDate, CATEGORY_TONE } from '$lib/format.js';

	let { data } = $props();

	// Tampilkan bertahap supaya riwayat ratusan transaksi tetap ringan.
	const PAGE = 30;
	let limit = $state(PAGE);
	const visible = $derived(data.expenses.slice(0, limit));

	// Total per tanggal dihitung dari semua data, supaya tetap benar walau
	// transaksi di tanggal itu baru sebagian yang tampil.
	const dayTotals = $derived(
		data.expenses.reduce((/** @type {Record<string, number>} */ acc, e) => {
			acc[e.date] = (acc[e.date] || 0) + e.total;
			return acc;
		}, {})
	);

	// Kelompokkan per tanggal (terbaru dulu).
	const groups = $derived(
		Object.entries(
			visible.reduce((/** @type {Record<string, typeof data.expenses>} */ acc, e) => {
				(acc[e.date] ||= []).push(e);
				return acc;
			}, {})
		).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
	);
</script>

<PageHeader title="Riwayat" subtitle="Aktivitas pencatatan terbaru." />

<section class="mt-6 space-y-6">
	{#if groups.length === 0}
		<div class="rounded-card bg-surface p-12 text-center text-sm text-ink-mute">Belum ada aktivitas.</div>
	{:else}
		{#each groups as [date, items]}
			<div>
				<div class="mb-3 flex items-center gap-3">
					<span class="text-sm font-semibold text-ink-soft">{formatDate(date)}</span>
					<span class="h-px flex-1 bg-line"></span>
					<span class="num text-xs font-semibold text-ink-mute">{formatRp(dayTotals[date] ?? 0)}</span>
				</div>
				<div class="rounded-card bg-surface p-2">
					{#each items as t}
						{@const tone = CATEGORY_TONE[t.category] ?? CATEGORY_TONE.Lainnya}
						<div class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-canvas">
							<span class="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold" style="background: {tone.bg}; color: {tone.fg};">{(t.merchant || '?')[0]}</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{t.merchant || 'Tanpa nama'}</p>
								<p class="truncate text-xs text-ink-mute">{t.category} · {t.method}<span class="sm:hidden">{' · '}{t.source === 'telegram' ? 'Telegram' : 'Manual'}</span></p>
							</div>
							<span class="hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline {t.source === 'telegram' ? 'bg-success-bg text-success' : 'bg-lime-100 text-lime-600'}">{t.source === 'telegram' ? 'Telegram' : 'Manual'}</span>
							<span class="num shrink-0 text-right font-bold sm:w-28">{formatRp(t.total)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
		{#if data.expenses.length > visible.length}
			<div class="flex flex-col items-center gap-2">
				<p class="text-xs text-ink-mute">Menampilkan {visible.length} dari {data.expenses.length} transaksi</p>
				<button onclick={() => (limit += PAGE)} class="w-full rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold text-forest-600 transition hover:bg-active sm:w-auto">
					Tampilkan {Math.min(PAGE, data.expenses.length - visible.length)} lagi
				</button>
			</div>
		{/if}
	{/if}
</section>
