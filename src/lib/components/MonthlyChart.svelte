<script>
	// Perbandingan bulanan: satu batang per periode tahun ini, ditumpuk per kategori.
	// Garis putus-putus = anggaran, tanda pendek = periode yang sama tahun lalu.
	// Hover/fokus batang: detail periode. Hover legenda: sorot satu kategori. Klik: transaksi.
	import { goto } from '$app/navigation';
	import {
		MONTHS, CATEGORIES, INVESTMENT, formatRp, formatRpShort, categoryColor,
		cycleLabel, cycleRangeLabel, prevCycleKey, budgetStatus, STATUS_STYLE
	} from '$lib/format.js';
	import { niceTicks, labelIndexes } from '$lib/chart.js';

	/**
	 * @type {{
	 *   categoryFlow: Record<string, number>[],
	 *   prevYearFlow: number[],
	 *   budget: number,
	 *   warnPct: number,
	 *   cycle: { key: string, startDay: number }
	 * }}
	 */
	let { categoryFlow, prevYearFlow, budget, warnPct, cycle } = $props();

	const CATS = CATEGORIES.filter((c) => c !== INVESTMENT);
	const H = 260;
	const PAD = { l: 48, r: 12, t: 22, b: 28 };

	let width = $state(640);
	/** @type {number | null} */
	let active = $state(null);
	/** Kategori yang disorot lewat legenda. */
	let focusCat = $state(/** @type {string | null} */ (null));

	const year = $derived(Number(cycle.key.slice(0, 4)));
	const currentIdx = $derived(Number(cycle.key.slice(5, 7)) - 1);
	/** @param {number} i */
	const keyAt = (i) => `${year}-${String(i + 1).padStart(2, '0')}`;

	// Hanya periode sampai yang berjalan; periode depan dibiarkan kosong.
	const totals = $derived(categoryFlow.map((m, i) => (i <= currentIdx ? CATS.reduce((s, c) => s + (m[c] || 0), 0) : 0)));
	const hasPrevYear = $derived(prevYearFlow.some((v) => v > 0));
	const usedCats = $derived(CATS.filter((c) => categoryFlow.some((m, i) => i <= currentIdx && (m[c] || 0) > 0)));
	const shown = $derived(totals.slice(0, currentIdx + 1).filter((v) => v > 0));
	const avg = $derived(shown.length ? Math.round(shown.reduce((s, v) => s + v, 0) / shown.length) : 0);

	const plotW = $derived(Math.max(1, width - PAD.l - PAD.r));
	const plotH = H - PAD.t - PAD.b;
	const ticks = $derived(niceTicks(Math.max(budget, ...totals, ...(hasPrevYear ? prevYearFlow : [])) * 1.04));
	const yMax = $derived(ticks.at(-1) ?? 1);
	const band = $derived(plotW / 12);
	const barW = $derived(Math.min(24, band * 0.62));
	/** Tengah batang ke-i. @param {number} i */
	const cx = (i) => PAD.l + band * (i + 0.5);
	/** @param {number} v */
	const y = (v) => PAD.t + plotH - (v / yMax) * plotH;
	const xLabels = $derived(labelIndexes(12, plotW, 30));

	/**
	 * Segmen tumpukan satu batang, dari bawah ke atas dalam urutan kategori tetap.
	 * Celah 2px warna permukaan memisahkan segmen yang bersentuhan.
	 * @param {number} i
	 */
	function segments(i) {
		let acc = 0;
		/** @type {{ cat: string, y: number, h: number }[]} */
		const out = [];
		for (const c of CATS) {
			const v = categoryFlow[i][c] || 0;
			if (v <= 0) continue;
			const top = y(acc + v);
			const bottom = y(acc);
			acc += v;
			out.push({ cat: c, y: top + 1, h: Math.max(0, bottom - top - 2) });
		}
		return out;
	}

	/** Batang dengan ujung atas membulat 4px, alas tetap rata. @param {number} i */
	function barClip(i) {
		const x0 = cx(i) - barW / 2;
		const top = y(totals[i]);
		const base = y(0);
		const r = Math.min(4, barW / 2, (base - top) / 2);
		return `M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${base}Z`;
	}

	/** Detail untuk tooltip dan pembaca layar. @param {number} i */
	function detail(i) {
		const key = keyAt(i);
		const total = totals[i];
		const prevTotal = i > 0 ? totals[i - 1] : 0;
		const pct = Math.round((total / Math.max(1, budget)) * 100);
		return {
			title: [cycleLabel(key), cycleRangeLabel(key, cycle.startDay)].filter(Boolean).join(', '),
			total,
			delta: prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null,
			prevName: cycleLabel(prevCycleKey(key)).split(' ')[0],
			lastYear: prevYearFlow[i] || 0,
			pct,
			status: STATUS_STYLE[budgetStatus(pct, warnPct)],
			parts: CATS.map((c) => ({ cat: c, v: categoryFlow[i][c] || 0 }))
				.filter((p) => p.v > 0)
				.sort((a, b) => b.v - a.v)
		};
	}

	// Layar sempit: rincian tampil sebagai panel di bawah chart (default periode berjalan),
	// karena tooltip melayang tidak muat dan ketukan pertama harus memilih, bukan pindah halaman.
	const TIP_W = 240;
	const narrow = $derived(width < 520);
	const shownIdx = $derived(narrow ? (active ?? currentIdx) : active);
	const tip = $derived(shownIdx !== null && shownIdx <= currentIdx && totals[shownIdx] > 0 ? detail(shownIdx) : null);
	/** Posisi kiri tooltip melayang, dijaga tetap di dalam kartu. */
	const tipLeft = $derived.by(() => {
		if (active === null) return 0;
		const gap = barW / 2 + 10;
		const want = cx(active) > width / 2 ? cx(active) - gap - TIP_W : cx(active) + gap;
		return Math.max(0, Math.min(width - TIP_W, want));
	});

	/** @param {PointerEvent} e */
	function onPointer(e) {
		const rect = /** @type {SVGElement} */ (e.currentTarget).getBoundingClientRect();
		const px = ((e.clientX - rect.left) / rect.width) * width;
		active = Math.max(0, Math.min(11, Math.floor((px - PAD.l) / band)));
	}

	/** @param {number} i */
	function open(i) {
		if (i <= currentIdx && totals[i] > 0) goto(`/pengeluaran?period=${keyAt(i)}`);
	}

	/** @param {KeyboardEvent} e */
	function onKey(e) {
		if (e.key === 'Enter' && active !== null) return open(active);
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		const from = active ?? currentIdx;
		active = Math.max(0, Math.min(currentIdx, from + (e.key === 'ArrowRight' ? 1 : -1)));
	}

	/** @param {number} i */
	function valueText(i) {
		const d = detail(i);
		return `${d.title}: ${formatRp(d.total)}, ${d.pct}% dari anggaran`;
	}
</script>

<section class="card p-4 sm:p-5" aria-labelledby="monthly-heading">
	<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
		<div>
			<h2 id="monthly-heading" class="text-sm font-semibold">Perbandingan bulanan</h2>
			<p class="mt-0.5 text-xs text-ink-mute">Pengeluaran per periode {year}, dipecah per kategori. Investasi tidak termasuk.</p>
		</div>
		<p class="text-xs text-ink-mute">
			Rata-rata <span class="num font-medium text-ink">{formatRp(avg)}</span> per periode
		</p>
	</div>

	<div
		class="relative mt-4 rounded-md"
		bind:clientWidth={width}
		tabindex="0"
		role="slider"
		aria-label="Periode pada chart perbandingan bulanan. Panah kiri dan kanan untuk berpindah, Enter untuk membuka transaksinya."
		aria-valuemin={0}
		aria-valuemax={currentIdx}
		aria-valuenow={active ?? currentIdx}
		aria-valuetext={valueText(active ?? currentIdx)}
		onkeydown={onKey}
		onblur={() => (active = null)}
	>
		<svg
			viewBox="0 0 {width} {H}"
			width="100%"
			height={H}
			class="block touch-pan-y select-none {tip ? 'cursor-pointer' : ''}"
			aria-hidden="true"
			onpointermove={onPointer}
			onpointerdown={onPointer}
			onclick={() => !narrow && active !== null && open(active)}
			onpointerleave={(e) => e.pointerType === 'mouse' && (active = null)}
		>
			<defs>
				{#each totals as t, i}
					{#if t > 0}<clipPath id="mc-bar-{i}"><path d={barClip(i)} /></clipPath>{/if}
				{/each}
			</defs>

			{#each ticks as t}
				<line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--color-line-strong)' : 'var(--color-line)'} />
				<text x={PAD.l - 8} y={y(t)} dy="0.32em" text-anchor="end" class="num fill-ink-mute text-[11px]">{t === 0 ? '0' : formatRpShort(t)}</text>
			{/each}

			{#if active !== null}
				<rect x={PAD.l + band * active + 2} y={PAD.t} width={band - 4} height={plotH} rx="6" fill="var(--color-subtle)" />
			{/if}

			{#each totals as t, i}
				{#if t > 0}
					<g
						class="mc-bar transition-opacity duration-150"
						style="animation-delay: {i * 35}ms; opacity: {active !== null && active !== i ? 0.4 : 1}"
						clip-path="url(#mc-bar-{i})"
					>
						{#each segments(i) as s}
							<rect
								x={cx(i) - barW / 2}
								y={s.y}
								width={barW}
								height={s.h}
								fill={categoryColor(s.cat)}
								class="transition-opacity duration-150"
								opacity={focusCat && focusCat !== s.cat ? 0.18 : 1}
							/>
						{/each}
					</g>
				{/if}
				{#if hasPrevYear && prevYearFlow[i] > 0}
					<line
						x1={cx(i) - barW / 2 - 4}
						x2={cx(i) + barW / 2 + 4}
						y1={y(prevYearFlow[i])}
						y2={y(prevYearFlow[i])}
						stroke="var(--color-ink)"
						stroke-width="2"
						stroke-linecap="round"
						opacity={active !== null && active !== i ? 0.3 : 0.75}
					/>
				{/if}
			{/each}

			<line x1={PAD.l} x2={width - PAD.r} y1={y(budget)} y2={y(budget)} stroke="var(--color-ink-soft)" stroke-dasharray="4 4" />
			<text x={width - PAD.r} y={y(budget) < PAD.t + 14 ? y(budget) + 14 : y(budget) - 6} text-anchor="end" class="fill-ink-soft text-[11px]">Anggaran</text>

			<!-- Nilai hanya di periode berjalan dan yang sedang disorot, bukan di semua batang. -->
			{#if totals[active ?? currentIdx] > 0}
				{@const i = active ?? currentIdx}
				<text x={cx(i)} y={y(totals[i]) - 7} text-anchor="middle" class="num fill-ink text-[11px] font-semibold">{formatRpShort(totals[i])}</text>
			{/if}

			{#each xLabels as i}
				<text
					x={cx(i)}
					y={H - 8}
					text-anchor="middle"
					class="text-[11px] {i === active || (active === null && i === currentIdx) ? 'fill-ink font-semibold' : i > currentIdx ? 'fill-line-strong' : 'fill-ink-mute'}"
				>{MONTHS[i]}</text>
			{/each}
		</svg>

		{#if tip && !narrow}
			<div
				class="pointer-events-none absolute top-2 z-10 rounded-xl border border-line bg-surface p-3 shadow-xl"
				style="left: {tipLeft}px; width: {TIP_W}px"
				aria-hidden="true"
			>
				{@render details(tip)}
				<p class="mt-2 text-[11px] text-ink-mute">Klik untuk melihat transaksinya</p>
			</div>
		{/if}
	</div>

	{#if tip && narrow && shownIdx !== null}
		<div class="mt-3 rounded-xl border border-line p-3" aria-live="polite">
			{@render details(tip)}
			<a href="/pengeluaran?period={keyAt(shownIdx)}" class="mt-2.5 inline-block text-xs font-medium text-accent hover:underline">Lihat transaksi periode ini</a>
		</div>
	{/if}

	<ul class="mt-3 flex flex-wrap justify-center gap-x-1 gap-y-1 text-xs">
		{#each usedCats as c}
			<li>
				<button
					type="button"
					class="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-subtle {focusCat === c ? 'bg-subtle text-ink' : 'text-ink-soft'}"
					aria-pressed={focusCat === c}
					onmouseenter={() => (focusCat = c)}
					onmouseleave={() => (focusCat = null)}
					onfocus={() => (focusCat = c)}
					onblur={() => (focusCat = null)}
					onclick={() => (focusCat = focusCat === c ? null : c)}
				>
					<span class="size-2.5 rounded-sm" style="background: {categoryColor(c)}"></span>
					{c}
				</button>
			</li>
		{/each}
		{#if hasPrevYear}
			<li class="flex items-center gap-1.5 px-2 py-1 text-ink-soft">
				<span class="h-0.5 w-3 rounded-full bg-ink/75"></span>
				{year - 1}
			</li>
		{/if}
		<li class="flex items-center gap-1.5 px-2 py-1 text-ink-soft">
			<span class="w-3 border-t border-dashed border-ink-soft"></span>
			Anggaran
		</li>
	</ul>

	<table class="sr-only">
		<caption>Pengeluaran per periode {year} per kategori</caption>
		<thead>
			<tr><th>Periode</th>{#each CATS as c}<th>{c}</th>{/each}<th>Total</th></tr>
		</thead>
		<tbody>
			{#each totals as t, i}
				{#if i <= currentIdx}
					<tr>
						<td>{cycleLabel(keyAt(i))}</td>
						{#each CATS as c}<td>{formatRp(categoryFlow[i][c] || 0)}</td>{/each}
						<td>{formatRp(t)}</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</section>

{#snippet details(/** @type {NonNullable<typeof tip>} */ d)}
	<p class="text-xs text-ink-mute">{d.title}</p>
	<p class="num mt-0.5 text-lg font-semibold">{formatRp(d.total)}</p>
	<p class="mt-0.5 text-xs text-ink-soft">
		{#if d.delta !== null}
			<span class="font-medium {d.delta > 0 ? 'text-danger' : d.delta < 0 ? 'text-success' : ''}">{d.delta > 0 ? 'Naik' : d.delta < 0 ? 'Turun' : 'Sama,'} {d.delta !== 0 ? `${Math.abs(d.delta)}%` : ''}</span>
			dari {d.prevName}
		{:else}
			Belum ada data {d.prevName}
		{/if}
	</p>
	{#if d.lastYear > 0}
		<p class="text-xs text-ink-soft">Tahun lalu <span class="num text-ink">{formatRp(d.lastYear)}</span></p>
	{/if}
	<div class="mt-2 flex items-center gap-2">
		<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
			<div class="h-full rounded-full {d.status.bar}" style="width: {Math.min(100, d.pct)}%"></div>
		</div>
		<span class="num text-xs {d.status.fg}">{d.pct}% anggaran</span>
	</div>
	<ul class="mt-2.5 space-y-1 border-t border-line pt-2.5">
		{#each d.parts as p}
			<li class="flex items-center gap-2 text-xs {focusCat && focusCat !== p.cat ? 'opacity-40' : ''}">
				<span class="size-2.5 shrink-0 rounded-sm" style="background: {categoryColor(p.cat)}"></span>
				<span class="min-w-0 flex-1 truncate text-ink-soft">{p.cat}</span>
				<span class="num font-medium">{formatRp(p.v)}</span>
				<span class="num w-8 text-right text-ink-mute">{Math.round((p.v / d.total) * 100)}%</span>
			</li>
		{/each}
	</ul>
{/snippet}

<style>
	/* Batang tumbuh dari alas saat pertama tampil, berurutan. */
	.mc-bar {
		transform-box: fill-box;
		transform-origin: bottom;
		animation: mc-grow 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	@keyframes mc-grow {
		from {
			transform: scaleY(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mc-bar {
			animation: none;
		}
	}
</style>
