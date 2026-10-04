<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatRp, formatRpShort, categoryColor, cycleRangeLabel, budgetStatus, STATUS_STYLE } from '$lib/format.js';

	let { data } = $props();

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

	// Skala chart mencakup garis anggaran supaya bulan di bawah anggaran terlihat proporsional.
	const scale = $derived(Math.max(1, data.budget, ...r.monthlyFlow.map((m) => m.amount)) * 1.08);
	const budgetTop = $derived(100 - (data.budget / scale) * 100);
</script>

<PageHeader title="Laporan" description="Tahun {year}, dihitung per periode gajian." />

<div class="mt-6 space-y-6">
	<section class="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-4" aria-label="Ringkasan tahunan">
		<div class="bg-surface p-4">
			<p class="eyebrow">Total {year}</p>
			<p class="num mt-1 text-xl font-semibold">{formatRp(total)}</p>
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

	<section class="card p-4 sm:p-5" aria-labelledby="chart-heading">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 id="chart-heading" class="text-sm font-semibold">Pengeluaran per periode</h2>
			<p class="flex items-center gap-2 text-xs text-ink-mute">
				<span class="inline-block w-4 border-t border-dashed border-ink-mute"></span>
				Anggaran {formatRp(data.budget)}
			</p>
		</div>

		<div class="relative mt-6 h-48">
			<div class="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-mute/70" style="top: {budgetTop}%"></div>
			<div class="flex h-full items-end gap-1.5 border-b border-line sm:gap-3">
				{#each r.monthlyFlow as m, i}
					{@const h = (m.amount / scale) * 100}
					{@const status = budgetStatus(Math.round((m.amount / Math.max(1, data.budget)) * 100), data.warnPct)}
					<div class="flex h-full flex-1 flex-col items-center justify-end" title="{m.month}: {formatRp(m.amount)}">
						{#if m.amount > 0}
							<span class="num mb-1 hidden text-[10px] text-ink-mute sm:block">{formatRpShort(m.amount)}</span>
							<div
								class="w-full max-w-10 rounded-t {status === 'over' ? 'bg-danger' : i === currentIdx ? 'bg-accent' : 'bg-ink-mute/45'}"
								style="height: {h}%"
							></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		<div class="mt-2 flex gap-1.5 sm:gap-3">
			{#each r.monthlyFlow as m, i}
				<span class="flex-1 text-center text-[11px] {i === currentIdx ? 'font-semibold text-ink' : 'text-ink-mute'}">{m.month}</span>
			{/each}
		</div>
		<p class="sr-only">
			{#each r.monthlyFlow as m}{m.month}: {formatRp(m.amount)}. {/each}
		</p>
	</section>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<section class="card" aria-labelledby="period-heading">
			<h2 id="period-heading" class="border-b border-line px-4 py-3 text-sm font-semibold">Riwayat periode</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-xs text-ink-mute">
							<th class="px-4 py-2 font-medium">Periode</th>
							<th class="px-4 py-2 text-right font-medium">Pengeluaran</th>
							<th class="px-4 py-2 text-right font-medium">Dari anggaran</th>
							<th class="px-4 py-2 font-medium">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-line">
						{#each [...periods].reverse() as m}
							{@const pct = Math.round((m.amount / Math.max(1, data.budget)) * 100)}
							{@const st = STATUS_STYLE[budgetStatus(pct, data.warnPct)]}
							{@const range = cycleRangeLabel(m.key, data.cycleStartDay)}
							<tr>
								<td class="px-4 py-2.5">
									<a href="/pengeluaran?period={m.key}" class="hover:underline">{m.month}</a>
									{#if range}<span class="block text-xs text-ink-mute">{range}</span>{/if}
								</td>
								<td class="num px-4 py-2.5 text-right">{m.amount > 0 ? formatRp(m.amount) : '-'}</td>
								<td class="num px-4 py-2.5 text-right text-ink-soft">{m.amount > 0 ? `${pct}%` : '-'}</td>
								<td class="px-4 py-2.5">
									{#if m.amount > 0}
										<span class="rounded-full px-2 py-0.5 text-xs font-medium {st.bg} {st.fg}">{st.label}</span>
									{:else}
										<span class="text-xs text-ink-mute">Tidak ada data</span>
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
								<div class="flex items-baseline justify-between gap-3 text-sm">
									<span class="flex items-center gap-2 group-hover:underline">
										<span class="size-2 rounded-full" style="background: {categoryColor(c.name)}"></span>
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
