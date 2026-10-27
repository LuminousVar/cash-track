<script>
	// Chart garis pengeluaran: periode berjalan vs periode lalu (kumulatif per hari),
	// atau per periode sepanjang tahun vs tahun lalu. Garis putus-putus = anggaran.
	import { MONTHS, formatRp, formatRpShort, cycleLabel, cycleRange, cycleRangeLabel, addDays, formatDayMonth } from '$lib/format.js';
	import { cumulative, niceTicks, linePath, labelIndexes } from '$lib/chart.js';

	/**
	 * @type {{
	 *   trend: { prevKey: string, daily: number[], prevDaily: number[], prevYearFlow: number[] },
	 *   monthlyFlow: { month: string, amount: number }[],
	 *   budget: number,
	 *   cycle: { key: string, startDay: number, start: string, dayIndex: number, label: string }
	 * }}
	 */
	let { trend, monthlyFlow, budget, cycle } = $props();

	/** @type {'period' | 'year'} */
	let mode = $state('period');
	let width = $state(640);
	/** @type {number | null} */
	let active = $state(null);

	const H = 240;
	const PAD = { l: 48, r: 12, t: 12, b: 28 };

	const view = $derived.by(() => {
		const curMonth = cycle.label.split(' ')[0];
		if (mode === 'period') {
			const prevStart = cycleRange(trend.prevKey, cycle.startDay).start;
			const prevMonth = cycleLabel(trend.prevKey).split(' ')[0];
			const cur = cumulative(trend.daily.slice(0, cycle.dayIndex));
			const prev = cumulative(trend.prevDaily);
			const compare = prev[Math.min(cycle.dayIndex, prev.length) - 1] ?? 0;
			return {
				n: Math.max(trend.daily.length, prev.length),
				cur,
				prev,
				curName: `Periode ${curMonth}`,
				prevName: `Periode ${prevMonth}`,
				/** @param {number} i */
				xLabel: (i) => formatDayMonth(addDays(cycle.start, i)),
				/** @param {number} i */
				tipTitle: (i) => `Hari ke-${i + 1}`,
				/** @param {number} i */
				curSub: (i) => `s.d. ${formatDayMonth(addDays(cycle.start, i))}`,
				/** @param {number} i */
				prevSub: (i) => `s.d. ${formatDayMonth(addDays(prevStart, i))}`,
				eyebrow: `Terpakai periode ${curMonth} sampai hari ini`,
				value: cur.at(-1) ?? 0,
				prevTotal: prev.at(-1) ?? 0,
				compare,
				compareText: `di hari ke-${cycle.dayIndex} periode ${prevMonth}`,
				budgetName: 'Anggaran'
			};
		}
		const year = Number(cycle.key.slice(0, 4));
		const idx = Number(cycle.key.slice(5, 7)) - 1;
		const cur = monthlyFlow.slice(0, idx + 1).map((m) => m.amount);
		const prev = trend.prevYearFlow;
		/** @param {number} i */
		const keyAt = (i) => `${year}-${String(i + 1).padStart(2, '0')}`;
		return {
			n: 12,
			cur,
			prev,
			curName: String(year),
			prevName: String(year - 1),
			/** @param {number} i */
			xLabel: (i) => MONTHS[i],
			/** @param {number} i */
			tipTitle: (i) => [cycleLabel(keyAt(i)).split(' ')[0], cycleRangeLabel(keyAt(i), cycle.startDay)].filter(Boolean).join(', '),
			curSub: () => '',
			prevSub: () => '',
			eyebrow: `Total ${year} sampai periode ${curMonth}`,
			value: cur.reduce((s, v) => s + v, 0),
			prevTotal: prev.reduce((s, v) => s + v, 0),
			compare: prev.slice(0, idx + 1).reduce((s, v) => s + v, 0),
			compareText: `di periode yang sama ${year - 1}`,
			budgetName: 'Anggaran per periode'
		};
	});

	const hasPrev = $derived(view.prev.some((v) => v > 0));
	const delta = $derived(view.compare > 0 ? Math.round(((view.value - view.compare) / view.compare) * 100) : null);

	// Geometri. Skala Y selalu mencakup anggaran supaya posisi garis terhadap batas terlihat.
	const plotW = $derived(Math.max(1, width - PAD.l - PAD.r));
	const plotH = H - PAD.t - PAD.b;
	const ticks = $derived(niceTicks(Math.max(budget, ...view.cur, ...(hasPrev ? view.prev : [])) * 1.04));
	const yMax = $derived(ticks.at(-1) ?? 1);
	/** @param {number} i */
	const x = (i) => PAD.l + (view.n <= 1 ? plotW / 2 : (i / (view.n - 1)) * plotW);
	/** @param {number} v */
	const y = (v) => PAD.t + plotH - (v / yMax) * plotH;

	const curPath = $derived(linePath(view.cur.map((v, i) => [x(i), y(v)])));
	const prevPath = $derived(hasPrev ? linePath(view.prev.map((v, i) => [x(i), y(v)])) : '');
	const xLabels = $derived(labelIndexes(view.n, plotW));
	const budgetY = $derived(y(budget));

	/** @param {'period' | 'year'} m */
	function setMode(m) {
		mode = m;
		active = null;
	}

	/** @param {PointerEvent} e */
	function onPointer(e) {
		const rect = /** @type {SVGElement} */ (e.currentTarget).getBoundingClientRect();
		const px = ((e.clientX - rect.left) / rect.width) * width;
		const i = Math.round(((px - PAD.l) / plotW) * (view.n - 1));
		active = Math.max(0, Math.min(view.n - 1, i));
	}

	/** @param {number} i */
	function valueText(i) {
		const parts = [view.xLabel(i)];
		if (i < view.cur.length) parts.push(`${view.curName} ${formatRp(view.cur[i])}`);
		if (hasPrev && i < view.prev.length) parts.push(`${view.prevName} ${formatRp(view.prev[i])}`);
		return parts.join(', ');
	}

	/** @param {KeyboardEvent} e */
	function onKey(e) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		const from = active ?? Math.max(0, view.cur.length - 1);
		active = Math.max(0, Math.min(view.n - 1, from + (e.key === 'ArrowRight' ? 1 : -1)));
	}
</script>

<section class="card p-4 sm:p-5" aria-labelledby="trend-heading">
	<div class="flex items-center justify-between gap-3">
		<h2 id="trend-heading" class="text-sm font-semibold">Pergerakan pengeluaran</h2>
		<div class="inline-flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label="Rentang chart">
			{#each [['period', 'Periode'], ['year', 'Tahunan']] as [m, label]}
				<button
					type="button"
					aria-pressed={mode === m}
					onclick={() => setMode(/** @type {'period' | 'year'} */ (m))}
					class="rounded-md px-2.5 py-1 font-medium transition-colors {mode === m ? 'bg-subtle text-ink' : 'text-ink-mute hover:text-ink'}"
				>
					{label}
				</button>
			{/each}
		</div>
	</div>

	<p class="mt-3 text-xs text-ink-mute">{view.eyebrow}</p>
	<p class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{formatRp(view.value)}</p>
	<p class="mt-1 text-sm text-ink-soft">
		{#if delta === null}
			Belum ada data pembanding {view.compareText}.
		{:else}
			{#if delta !== 0}
				<span class="font-medium {delta > 0 ? 'text-danger' : 'text-success'}">{delta > 0 ? 'Naik' : 'Turun'} {Math.abs(delta)}%</span>
			{/if}
			vs <span class="num">{formatRp(view.compare)}</span> {view.compareText}
		{/if}
	</p>

	<div
		class="relative mt-4 rounded-md"
		bind:clientWidth={width}
		tabindex="0"
		role="slider"
		aria-label="Titik pada chart pengeluaran. Panah kiri dan kanan untuk berpindah."
		aria-valuemin={0}
		aria-valuemax={view.n - 1}
		aria-valuenow={active ?? Math.max(0, view.cur.length - 1)}
		aria-valuetext={valueText(active ?? Math.max(0, view.cur.length - 1))}
		onkeydown={onKey}
		onblur={() => (active = null)}
	>
		<svg
			viewBox="0 0 {width} {H}"
			width="100%"
			height={H}
			class="block touch-pan-y select-none"
			aria-hidden="true"
			onpointermove={onPointer}
			onpointerdown={onPointer}
			onpointerleave={(e) => e.pointerType === 'mouse' && (active = null)}
		>
			<!-- Garis bantu: horizontal per nilai, vertikal tipis per titik data. -->
			{#each Array.from({ length: view.n }, (_, i) => i) as i}
				<rect x={x(i) - 1} y={PAD.t} width="2" height={plotH} fill="var(--color-subtle)" />
			{/each}
			{#each ticks as t}
				<line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--color-line-strong)' : 'var(--color-line)'} />
				<text x={PAD.l - 8} y={y(t)} dy="0.32em" text-anchor="end" class="num fill-ink-mute text-[11px]">{t === 0 ? '0' : formatRpShort(t)}</text>
			{/each}
			{#each xLabels as i}
				<text x={x(i)} y={H - 8} text-anchor={i === 0 ? 'start' : x(i) > width - PAD.r - 24 ? 'end' : 'middle'} class="fill-ink-mute text-[11px]">{view.xLabel(i)}</text>
			{/each}

			<line x1={PAD.l} x2={width - PAD.r} y1={budgetY} y2={budgetY} stroke="var(--color-ink-soft)" stroke-dasharray="4 4" />
			<text x={width - PAD.r} y={budgetY < PAD.t + 14 ? budgetY + 14 : budgetY - 6} text-anchor="end" class="fill-ink-soft text-[11px]">Anggaran</text>

			{#if prevPath}
				<path d={prevPath} fill="none" stroke="var(--color-ink-mute)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
			{/if}
			<path d={curPath} fill="none" stroke="var(--color-chart-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

			{#if active !== null}
				<line x1={x(active)} x2={x(active)} y1={PAD.t} y2={PAD.t + plotH} stroke="var(--color-ink-soft)" />
				{#if hasPrev && active < view.prev.length}
					<circle cx={x(active)} cy={y(view.prev[active])} r="4" fill="var(--color-ink-mute)" stroke="var(--color-surface)" stroke-width="2" />
				{/if}
			{/if}
			{#if view.cur.length}
				{@const i = active !== null && active < view.cur.length ? active : view.cur.length - 1}
				<circle cx={x(i)} cy={y(view.cur[i])} r="4" fill="var(--color-chart-1)" stroke="var(--color-surface)" stroke-width="2" />
			{/if}
		</svg>

		{#if active !== null}
			{@const right = x(active) > width / 2}
			<div
				class="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg bg-ink px-3 py-2 text-canvas shadow-lg"
				style="left: {x(active)}px; transform: translateX({right ? 'calc(-100% - 12px)' : '12px'})"
				aria-hidden="true"
			>
				<p class="text-[11px] opacity-70">{view.tipTitle(active)}</p>
				{#if active < view.cur.length}
					<div class="mt-1.5 flex items-center gap-2">
						<span class="h-0.5 w-3 rounded-full bg-chart-1"></span>
						<span class="num text-sm font-semibold">{formatRp(view.cur[active])}</span>
					</div>
					<p class="ml-5 text-[11px] opacity-70">{[view.curName, view.curSub(active)].filter(Boolean).join(', ')}</p>
				{/if}
				{#if hasPrev && active < view.prev.length}
					<div class="mt-1.5 flex items-center gap-2">
						<span class="h-0.5 w-3 rounded-full bg-ink-mute"></span>
						<span class="num text-sm font-semibold">{formatRp(view.prev[active])}</span>
					</div>
					<p class="ml-5 text-[11px] opacity-70">{[view.prevName, view.prevSub(active)].filter(Boolean).join(', ')}</p>
				{/if}
			</div>
		{/if}
	</div>

	<ul class="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-ink-soft">
		<li class="flex items-center gap-2">
			<span class="h-0.5 w-3.5 rounded-full bg-chart-1"></span>
			{view.curName}
			<span class="num text-ink">{formatRp(view.value)}</span>
		</li>
		{#if hasPrev}
			<li class="flex items-center gap-2">
				<span class="h-0.5 w-3.5 rounded-full bg-ink-mute"></span>
				{view.prevName}
				<span class="num text-ink">{formatRp(view.prevTotal)}</span>
			</li>
		{/if}
		<li class="flex items-center gap-2">
			<span class="w-3.5 border-t border-dashed border-ink-soft"></span>
			{view.budgetName}
			<span class="num text-ink">{formatRp(budget)}</span>
		</li>
	</ul>

	<table class="sr-only">
		<caption>Data chart pergerakan pengeluaran</caption>
		<thead>
			<tr><th>Titik</th><th>{view.curName}</th>{#if hasPrev}<th>{view.prevName}</th>{/if}</tr>
		</thead>
		<tbody>
			{#each Array.from({ length: view.n }, (_, i) => i) as i}
				<tr>
					<td>{view.xLabel(i)}</td>
					<td>{i < view.cur.length ? formatRp(view.cur[i]) : '-'}</td>
					{#if hasPrev}<td>{i < view.prev.length ? formatRp(view.prev[i]) : '-'}</td>{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</section>
