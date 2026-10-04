<script>
	// Panel status anggaran periode berjalan. Menjawab satu pertanyaan:
	// "berapa yang masih boleh dipakai sampai gajian berikutnya?"
	import { formatRp, budgetStatus, STATUS_STYLE } from '$lib/format.js';

	/**
	 * @type {{
	 *   spent: number,
	 *   budget: number,
	 *   warnPct: number,
	 *   cycle: { label: string, rangeLabel: string, end: string, days: number, dayIndex: number, daysLeft: number },
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { spent, budget, warnPct, cycle, children } = $props();

	const pct = $derived(budget > 0 ? Math.round((spent / budget) * 100) : 0);
	const status = $derived(budgetStatus(pct, warnPct));
	const style = $derived(STATUS_STYLE[status]);
	const remaining = $derived(budget - spent);
	// Sisa hari termasuk hari ini, supaya jatah harian tidak membagi dengan nol di hari terakhir.
	const daysIncl = $derived(Math.max(1, cycle.daysLeft + 1));
	const perDay = $derived(Math.max(0, Math.floor(remaining / daysIncl)));
	const projected = $derived(Math.round((spent / Math.max(1, cycle.dayIndex)) * cycle.days));
	const endLabel = $derived(cycle.rangeLabel ? cycle.rangeLabel.split(' - ')[1] : `akhir ${cycle.label.split(' ')[0]}`);
</script>

<section class="card p-5 sm:p-6" aria-labelledby="budget-heading">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h2 id="budget-heading" class="text-sm font-medium text-ink-soft">Sisa anggaran</h2>
			<p class="text-xs text-ink-mute">Periode {cycle.label}{cycle.rangeLabel ? `, ${cycle.rangeLabel}` : ''}</p>
		</div>
		<span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium {style.bg} {style.fg}">{style.label}</span>
	</div>

	<p class="num mt-3 text-3xl font-semibold tracking-tight sm:text-4xl {remaining < 0 ? 'text-danger' : ''}">
		{remaining < 0 ? '-' : ''}{formatRp(Math.abs(remaining))}
	</p>
	<p class="mt-1 text-sm text-ink-soft">
		{#if remaining >= 0}
			Bisa dipakai sekitar <span class="num font-medium text-ink">{formatRp(perDay)}</span> per hari sampai {endLabel}
			({daysIncl} hari lagi).
		{:else}
			Sudah melewati anggaran. Sisa periode {daysIncl} hari.
		{/if}
	</p>

	<div class="mt-5">
		<div
			class="relative h-2 overflow-hidden rounded-full bg-subtle"
			role="progressbar"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={Math.min(100, pct)}
			aria-label="Pemakaian anggaran {pct}%"
		>
			<div class="h-full rounded-full {style.bar}" style="width: {Math.min(100, pct)}%"></div>
			{#if warnPct < 100}
				<div class="absolute inset-y-0 w-px bg-ink-mute/60" style="left: {warnPct}%" title="Batas peringatan {warnPct}%"></div>
			{/if}
		</div>
		<div class="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-ink-mute">
			<span>Terpakai <span class="num text-ink-soft">{formatRp(spent)}</span> dari <span class="num text-ink-soft">{formatRp(budget)}</span> ({pct}%)</span>
			<span>Proyeksi akhir periode <span class="num {projected > budget ? 'text-danger' : 'text-ink-soft'}">{formatRp(projected)}</span></span>
		</div>
	</div>

	{#if children}{@render children()}{/if}
</section>
