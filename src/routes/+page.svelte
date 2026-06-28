<script>
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatRp, formatRpShort, formatDate, CATEGORY_TONE } from '$lib/format.js';

	let { data } = $props();

	let showAdd = $state(false);

	const maxFlow = $derived(Math.max(1, ...data.monthlyFlow.map((m) => m.amount)));
	const peakIndex = $derived(data.monthlyFlow.reduce((bi, m, i, a) => (m.amount > a[bi].amount ? i : bi), 0));
	const miniBars = $derived(data.monthlyFlow.slice(-7));
	const maxMini = $derived(Math.max(1, ...miniBars.map((m) => m.amount)));
	const maxScale = $derived(maxFlow * 1.12);
	const avgFlow = $derived(Math.round(data.monthlyFlow.reduce((s, m) => s + m.amount, 0) / 12));
	const avgLineTop = $derived(100 - Math.round((avgFlow / maxScale) * 100));
	// Posisi horizontal dot penanda di garis rata-rata (kolom puncak).
	const dotLeft = $derived(((peakIndex + 0.5) / data.monthlyFlow.length) * 100);

	// Ghost bar: hijau transparan dengan garis diagonal (hatching) seperti di referensi.
	const ghostFill =
		'repeating-linear-gradient(45deg, rgba(60,117,83,0.13) 0 1.5px, transparent 1.5px 6px), rgba(60,117,83,0.06)';

	/** @type {Record<string, string>} */
	const toneClass = {
		forest: 'bg-forest-800 text-white',
		lime: 'bg-lime-500 text-forest-900',
		emerald: 'bg-emerald-500 text-white'
	};
</script>

<PageHeader title="Dashboard" subtitle="Lacak, tinjau, dan kendalikan pengeluaranmu.">
	<button
		onclick={() => (showAdd = true)}
		class="flex items-center gap-2 rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-bold text-forest-900 shadow-sm transition hover:bg-lime-400"
	>
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
		Tambah Pengeluaran
	</button>
</PageHeader>

<!-- ── Kartu ringkasan ── -->
<section class="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
	<!-- Total pengeluaran (semua waktu) -->
	<article class="rounded-card bg-surface p-5">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold text-ink-soft">Total Pengeluaran</span>
			<span class="flex items-center gap-1 rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">Semua waktu
				<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
			</span>
		</div>
		<p class="num mt-5 text-[34px] font-extrabold leading-none tracking-tight">{formatRp(data.summary.totalAllTime)}</p>
		<div class="mt-5 space-y-2">
			<div class="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm">
				<span class="grid size-7 place-items-center rounded-lg bg-active text-forest-600">↑</span>
				<span class="text-ink-soft">Bulan ini</span>
				<span class="num ml-auto font-semibold">{formatRp(data.summary.thisMonth)}</span>
			</div>
			<div class="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm">
				<span class="grid size-7 place-items-center rounded-lg bg-active text-forest-600">⌀</span>
				<span class="text-ink-soft">Rata-rata / hari</span>
				<span class="num ml-auto font-semibold">{formatRp(data.summary.dailyAvg)}</span>
			</div>
		</div>
	</article>

	<!-- Bulan ini + split kategori -->
	<article class="rounded-card bg-surface p-5">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold text-ink-soft">Bulan Ini</span>
			<span class="text-xs font-semibold text-ink-mute">{data.summary.count} transaksi</span>
		</div>
		<div class="mt-4 flex items-end justify-between">
			<p class="num text-[28px] font-extrabold leading-none tracking-tight">{formatRp(data.summary.thisMonth)}</p>
			<div class="flex h-12 items-end gap-1">
				{#each miniBars as m, i}
					<span class="w-2.5 rounded-sm {i === miniBars.length - 1 ? 'bg-lime-500' : 'bg-forest-700/25'}" style="height: {Math.max(6, Math.round((m.amount / maxMini) * 100))}%"></span>
				{/each}
			</div>
		</div>
		<div class="mt-4 flex gap-2 text-xs">
			<span class="rounded-md bg-success-bg px-2 py-1 font-semibold text-success">{data.summary.fromTelegram} dari struk</span>
			<span class="rounded-md bg-lime-100 px-2 py-1 font-semibold text-lime-600">{data.summary.fromManual} manual</span>
		</div>
		<div class="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
			{#each data.topCategories as c}
				<div>
					<p class="truncate text-xs text-ink-mute">{c.name}</p>
					<p class="num text-sm font-bold">{formatRpShort(c.amount)}</p>
				</div>
			{/each}
		</div>
	</article>

	<!-- Sisa anggaran + gauge -->
	<article class="rounded-card bg-surface p-5">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold text-ink-soft">Sisa Anggaran</span>
			<span class="flex items-center gap-1 rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">Bulan ini</span>
		</div>
		<p class="num mt-5 text-[34px] font-extrabold leading-none tracking-tight">{formatRp(Math.max(0, data.summary.budget - data.summary.thisMonth))}</p>
		<div class="mt-4 flex gap-2 text-xs">
			<span class="rounded-md bg-success-bg px-2 py-1 font-semibold text-success">Terpakai {data.summary.budgetPct}%</span>
			<span class="rounded-md bg-canvas px-2 py-1 font-semibold text-ink-soft">Target {formatRpShort(data.summary.budget)}</span>
		</div>
		<div class="mt-5">
			<div class="flex justify-between text-[11px] text-ink-mute"><span>0</span><span>50</span><span>100</span></div>
			<div class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-lime-100">
				<div class="h-full rounded-full" style="width: {Math.min(100, data.summary.budgetPct)}%; background: linear-gradient(to right, var(--color-forest-700), var(--color-forest-500), var(--color-lime-400));"></div>
			</div>
			<p class="mt-2 text-xs text-ink-soft">Anggaran bulanan <span class="num font-semibold text-ink">{formatRp(data.summary.budget)}</span></p>
		</div>
	</article>
</section>

<!-- ── Chart + anggaran ── -->
<section class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
	<!-- Arus pengeluaran — stacked bar chart (Fundcy style) -->
	<article class="rounded-card bg-surface p-5 shadow-[0_18px_50px_-20px_rgba(28,59,48,0.35)] lg:col-span-2">
		<div class="flex items-center justify-between gap-3">
			<div class="flex flex-wrap items-center gap-3">
				<span class="text-sm font-semibold">Arus Pengeluaran</span>
				<span class="flex items-center gap-1.5 text-xs text-ink-soft">
					<span class="inline-block size-2 rounded-full bg-forest-800"></span>Manual
				</span>
				<span class="flex items-center gap-1.5 text-xs text-ink-soft">
					<span class="inline-block size-2 rounded-full bg-lime-500"></span>via Telegram
				</span>
			</div>
			<span class="flex shrink-0 items-center gap-1 rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">
				Bulanan
				<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
			</span>
		</div>

		<!-- Panel chart (chart berada di dalam container ini) -->
		<div class="mt-5 rounded-2xl bg-canvas/50 p-4 pt-6 ring-1 ring-line/70">
			<!-- Zona bar -->
			<div class="relative flex h-48 items-end">
				<!-- Garis rata-rata (putus-putus) + dot penanda -->
				<div class="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-forest-700/35" style="top:{avgLineTop}%">
					<span class="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest-700 ring-4 ring-surface" style="left:{dotLeft}%"></span>
				</div>

				{#each data.monthlyFlow as m, i}
					{@const isPeak = i === peakIndex}
					{@const hTotal = Math.max(7, Math.round((m.amount / maxScale) * 100))}
					{@const tg = m.telegram ?? 0}
						{@const manual = Math.max(0, m.amount - tg)}
					{@const limePct = m.amount > 0 ? Math.round((tg / m.amount) * 100) : 0}
					<div class="group relative flex h-full flex-1 items-end justify-center">
						<!-- Ghost bar (latar bertekstur diagonal) -->
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

						<!-- Batang asli (stacked: lime bawah + forest atas) -->
						<div
							class="relative z-20 flex w-[88%] flex-col overflow-hidden rounded-lg shadow-sm transition-[filter] duration-200 group-hover:brightness-110"
							style="height:{hTotal}%"
						>
							<!-- Segmen forest (manual) — atas -->
							<div class="w-full flex-1" style="background:linear-gradient(to top,var(--color-forest-700),var(--color-forest-500))"></div>
							<!-- Segmen lime (telegram) — bawah -->
							{#if limePct > 0}
								<div class="w-full shrink-0" style="height:{limePct}%; background:linear-gradient(to top,var(--color-lime-600),var(--color-lime-400))"></div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<!-- Zona label bulan -->
			<div class="mt-3 flex">
				{#each data.monthlyFlow as m, i}
					<span class="flex-1 text-center text-[10px] leading-none {i === peakIndex ? 'font-bold text-ink' : 'text-ink-mute'}">{m.month}</span>
				{/each}
			</div>
		</div>
	</article>

	<!-- Anggaran bulanan -->
	<article class="rounded-card bg-surface p-5">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold">Anggaran Bulanan</span>
			<a href="/pengaturan" class="text-xs font-semibold text-forest-600">Atur budget →</a>
		</div>
		<p class="mt-4 text-5xl font-extrabold tracking-tight">{data.summary.budgetPct}<span class="text-2xl text-ink-mute">%</span></p>
		<p class="mt-2 max-w-[15rem] text-sm leading-relaxed text-ink-soft">
			{data.summary.budgetPct <= 100 ? 'Masih aman — pemakaian bulan ini di bawah target.' : 'Melebihi target — perlu rem pengeluaran.'}
		</p>
		<span class="mt-3 inline-flex items-center gap-2 rounded-lg bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-soft">
			Rata-rata harian <span class="num text-ink">{formatRp(data.summary.dailyAvg)}</span>
		</span>
		<div class="mt-5 grid grid-cols-3 gap-2.5">
			{#each data.topCategories as c}
				<div class="rounded-2xl p-3 {toneClass[c.tone]}">
					<p class="text-xl font-extrabold leading-none">{Math.round((c.amount / Math.max(1, data.summary.thisMonth)) * 100)}%</p>
					<p class="mt-2 text-[11px] font-semibold opacity-80">{c.name}</p>
					<p class="num mt-0.5 text-[11px] opacity-70">{formatRpShort(c.amount)}</p>
				</div>
			{/each}
		</div>
	</article>
</section>

<!-- ── Riwayat transaksi ── -->
<section class="mt-5 rounded-card bg-surface p-5">
	<div class="flex items-center justify-between">
		<span class="text-sm font-semibold">Riwayat Transaksi</span>
		<a href="/pengeluaran" class="text-xs font-semibold text-forest-600">Lihat semua →</a>
	</div>

	<div class="mt-4 overflow-x-auto">
		{#if data.transactions.length === 0}
			<p class="py-12 text-center text-sm text-ink-mute">Belum ada pengeluaran — kirim foto struk ke bot atau tambah manual.</p>
		{:else}
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-line text-left text-xs font-semibold text-ink-mute">
						<th class="pb-3 pl-1 font-semibold">Nama</th>
						<th class="pb-3 font-semibold">Tanggal</th>
						<th class="pb-3 font-semibold">Kategori</th>
						<th class="pb-3 font-semibold">Metode</th>
						<th class="pb-3 text-right font-semibold">Jumlah</th>
						<th class="pb-3 pr-1 text-center font-semibold">Sumber</th>
					</tr>
				</thead>
				<tbody>
					{#each data.transactions as t}
						{@const tone = CATEGORY_TONE[t.category] ?? CATEGORY_TONE.Lainnya}
						<tr class="border-b border-line/70 last:border-0">
							<td class="py-3 pl-1">
								<div class="flex items-center gap-3">
									<span class="grid size-8 place-items-center rounded-lg text-xs font-bold" style="background: {tone.bg}; color: {tone.fg};">{(t.merchant || '?')[0]}</span>
									<span class="font-semibold">{t.merchant || 'Tanpa nama'}</span>
								</div>
							</td>
							<td class="py-3 text-ink-soft">{formatDate(t.date)}</td>
							<td class="py-3">
								<span class="rounded-md px-2 py-1 text-xs font-semibold" style="background: {tone.bg}; color: {tone.fg};">{t.category}</span>
							</td>
							<td class="py-3 text-ink-soft">{t.method}</td>
							<td class="num py-3 text-right font-bold">{formatRp(t.total)}</td>
							<td class="py-3 pr-1 text-center">
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold {t.source === 'telegram' ? 'bg-success-bg text-success' : 'bg-lime-100 text-lime-600'}">
									{t.source === 'telegram' ? 'Telegram' : 'Manual'}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>

<AddExpenseModal open={showAdd} demo={data.demo} onclose={() => (showAdd = false)} />
