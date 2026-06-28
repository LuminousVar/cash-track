<script>
	import Sidebar from '$lib/components/Sidebar.svelte';
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import {
		formatRp,
		formatRpShort,
		formatDate,
		monthlyFlow,
		transactions as seed,
		summary,
		topCategories,
		CATEGORY_TONE
	} from '$lib/data/mock.js';

	let showAdd = $state(false);
	let txs = $state([...seed]);

	const maxFlow = Math.max(...monthlyFlow.map((m) => m.amount));
	const peakIndex = monthlyFlow.reduce((bi, m, i, a) => (m.amount > a[bi].amount ? i : bi), 0);
	const miniBars = monthlyFlow.slice(-7);
	const maxMini = Math.max(...miniBars.map((m) => m.amount));

	const toneClass = {
		forest: 'bg-forest-800 text-white',
		lime: 'bg-lime-500 text-forest-900',
		emerald: 'bg-emerald-500 text-white'
	};

	function handleSave(tx) {
		txs = [tx, ...txs];
		showAdd = false;
	}
</script>

<div class="flex h-screen overflow-hidden">
	<Sidebar />

	<main class="flex-1 overflow-y-auto px-7 py-6">
		<!-- ── Header ── -->
		<header class="flex items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-extrabold tracking-tight">Dashboard</h1>
				<p class="text-sm text-ink-soft">Lacak, tinjau, dan kendalikan pengeluaranmu.</p>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={() => (showAdd = true)}
					class="flex items-center gap-2 rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-bold text-forest-900 shadow-sm transition hover:bg-lime-400"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
					Tambah Pengeluaran
				</button>
				<button class="grid size-10 place-items-center rounded-xl bg-surface text-ink-soft transition hover:text-ink" aria-label="Ekspor">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
				</button>
				<div class="flex items-center gap-2.5 rounded-xl bg-surface py-1.5 pl-1.5 pr-3">
					<span class="grid size-8 place-items-center rounded-lg bg-forest-700 text-xs font-bold text-white">FR</span>
					<div class="leading-tight">
						<p class="text-sm font-semibold">Farel Reyhan</p>
						<p class="text-[11px] text-ink-mute">farelreyhan6@gmail.com</p>
					</div>
				</div>
			</div>
		</header>

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
				<p class="num mt-5 text-[34px] font-extrabold leading-none tracking-tight">{formatRp(summary.totalAllTime)}</p>
				<div class="mt-5 space-y-2">
					<div class="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm">
						<span class="grid size-7 place-items-center rounded-lg bg-active text-forest-600">↑</span>
						<span class="text-ink-soft">Bulan ini</span>
						<span class="num ml-auto font-semibold">{formatRp(summary.thisMonth)}</span>
					</div>
					<div class="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm">
						<span class="grid size-7 place-items-center rounded-lg bg-active text-forest-600">⌀</span>
						<span class="text-ink-soft">Rata-rata / hari</span>
						<span class="num ml-auto font-semibold">{formatRp(summary.dailyAvg)}</span>
					</div>
				</div>
			</article>

			<!-- Bulan ini + split kategori -->
			<article class="rounded-card bg-surface p-5">
				<div class="flex items-center justify-between">
					<span class="text-sm font-semibold text-ink-soft">Bulan Ini</span>
					<span class="text-xs font-semibold text-ink-mute">Juli 2024</span>
				</div>
				<div class="mt-4 flex items-end justify-between">
					<p class="num text-[28px] font-extrabold leading-none tracking-tight">{formatRp(summary.thisMonth)}</p>
					<!-- mini bar -->
					<div class="flex h-12 items-end gap-1">
						{#each miniBars as m, i}
							<span
								class="w-2.5 rounded-sm {i === miniBars.length - 1 ? 'bg-lime-500' : 'bg-forest-700/25'}"
								style="height: {Math.round((m.amount / maxMini) * 100)}%"
							></span>
						{/each}
					</div>
				</div>
				<div class="mt-4 flex gap-2 text-xs">
					<span class="rounded-md bg-success-bg px-2 py-1 font-semibold text-success">{summary.count} transaksi</span>
					<span class="rounded-md bg-canvas px-2 py-1 font-semibold text-ink-soft">{summary.fromTelegram} dari struk</span>
				</div>
				<div class="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
					{#each topCategories as c}
						<div>
							<p class="text-xs text-ink-mute">{c.name}</p>
							<p class="num text-sm font-bold">{formatRpShort(c.amount)}</p>
						</div>
					{/each}
				</div>
			</article>

			<!-- Sisa anggaran + gauge -->
			<article class="rounded-card bg-surface p-5">
				<div class="flex items-center justify-between">
					<span class="text-sm font-semibold text-ink-soft">Sisa Anggaran</span>
					<span class="flex items-center gap-1 rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">Juli 2024</span>
				</div>
				<p class="num mt-5 text-[34px] font-extrabold leading-none tracking-tight">{formatRp(summary.budget - summary.thisMonth)}</p>
				<div class="mt-4 flex gap-2 text-xs">
					<span class="rounded-md bg-success-bg px-2 py-1 font-semibold text-success">Terpakai {summary.budgetPct}%</span>
					<span class="rounded-md bg-canvas px-2 py-1 font-semibold text-ink-soft">Target {formatRpShort(summary.budget)}</span>
				</div>
				<!-- gauge -->
				<div class="mt-5">
					<div class="flex justify-between text-[11px] text-ink-mute"><span>0</span><span>50</span><span>100</span></div>
					<div class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-lime-100">
						<div class="h-full rounded-full" style="width: {summary.budgetPct}%; background: linear-gradient(to right, var(--color-forest-700), var(--color-forest-500), var(--color-lime-400));"></div>
					</div>
					<p class="mt-2 text-xs text-ink-soft">Anggaran bulanan <span class="num font-semibold text-ink">{formatRp(summary.budget)}</span></p>
				</div>
			</article>
		</section>

		<!-- ── Chart + anggaran ── -->
		<section class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
			<!-- Arus pengeluaran -->
			<article class="rounded-card bg-surface p-5 lg:col-span-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<span class="text-sm font-semibold">Arus Pengeluaran</span>
						<span class="flex items-center gap-1.5 text-xs text-ink-soft"><span class="size-2 rounded-full bg-forest-700"></span>Pengeluaran</span>
						<span class="flex items-center gap-1.5 text-xs text-ink-soft"><span class="size-2 rounded-full bg-lime-400"></span>Tertinggi</span>
					</div>
					<span class="flex items-center gap-1 rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">Bulanan
						<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
					</span>
				</div>
				<div class="relative mt-8 flex h-56 items-end justify-between gap-2 sm:gap-3">
					{#each monthlyFlow as m, i}
						<div class="group flex h-full flex-1 flex-col items-center justify-end gap-2">
							{#if i === peakIndex}
								<div class="relative -mb-1 rounded-lg bg-forest-900 px-2.5 py-1.5 text-center text-white shadow-lg">
									<p class="text-[10px] text-white/60">Pengeluaran</p>
									<p class="num text-xs font-bold">{formatRp(m.amount)}</p>
								</div>
							{/if}
							<div
								class="w-full max-w-[26px] rounded-t-md transition-opacity group-hover:opacity-90"
								style="height: {Math.round((m.amount / maxFlow) * 100)}%; background: linear-gradient(to top, var(--color-forest-800), {i === peakIndex ? 'var(--color-lime-400)' : 'var(--color-forest-500)'});"
							></div>
							<span class="text-[11px] {i === peakIndex ? 'font-bold text-ink' : 'text-ink-mute'}">{m.month}</span>
						</div>
					{/each}
				</div>
			</article>

			<!-- Anggaran bulanan -->
			<article class="rounded-card bg-surface p-5">
				<div class="flex items-center justify-between">
					<span class="text-sm font-semibold">Anggaran Bulanan</span>
					<span class="text-xs font-semibold text-forest-600">Atur budget →</span>
				</div>
				<p class="mt-4 text-5xl font-extrabold tracking-tight">{summary.budgetPct}<span class="text-2xl text-ink-mute">%</span></p>
				<p class="mt-2 max-w-[15rem] text-sm leading-relaxed text-ink-soft">Masih aman — pemakaian bulan ini di bawah target.</p>
				<span class="mt-3 inline-flex items-center gap-2 rounded-lg bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-soft">
					Rata-rata harian <span class="num text-ink">{formatRp(summary.dailyAvg)}</span>
				</span>
				<div class="mt-5 grid grid-cols-3 gap-2.5">
					{#each topCategories as c}
						<div class="rounded-2xl p-3 {toneClass[c.tone]}">
							<p class="text-xl font-extrabold leading-none">{Math.round((c.amount / summary.thisMonth) * 100)}%</p>
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
				<div class="flex items-center gap-2">
					<span class="flex items-center gap-1 rounded-lg bg-canvas px-2.5 py-1.5 text-xs font-semibold text-ink-soft">Semua Transaksi
						<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
					</span>
					<button class="grid size-8 place-items-center rounded-lg bg-canvas text-ink-soft hover:text-ink" aria-label="Filter">
						<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
					</button>
				</div>
			</div>

			<div class="mt-4 overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-line text-left text-xs font-semibold text-ink-mute">
							<th class="pb-3 pl-1 font-semibold">Nama</th>
							<th class="pb-3 font-semibold">Tanggal</th>
							<th class="pb-3 font-semibold">Kategori</th>
							<th class="pb-3 font-semibold">Metode</th>
							<th class="pb-3 text-right font-semibold">Jumlah</th>
							<th class="pb-3 text-center font-semibold">Sumber</th>
							<th class="pb-3 pr-1 text-right font-semibold">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each txs as t}
							{@const tone = CATEGORY_TONE[t.category] ?? CATEGORY_TONE.Lainnya}
							<tr class="border-b border-line/70 last:border-0">
								<td class="py-3 pl-1">
									<div class="flex items-center gap-3">
										<span class="grid size-8 place-items-center rounded-lg text-xs font-bold" style="background: {tone.bg}; color: {tone.fg};">{t.merchant[0]}</span>
										<span class="font-semibold">{t.merchant}</span>
									</div>
								</td>
								<td class="py-3 text-ink-soft">{formatDate(t.date)}</td>
								<td class="py-3">
									<span class="rounded-md px-2 py-1 text-xs font-semibold" style="background: {tone.bg}; color: {tone.fg};">{t.category}</span>
								</td>
								<td class="py-3 text-ink-soft">{t.method}</td>
								<td class="num py-3 text-right font-bold">{formatRp(t.total)}</td>
								<td class="py-3 text-center">
									<span class="rounded-full px-2.5 py-1 text-xs font-semibold {t.source === 'telegram' ? 'bg-success-bg text-success' : 'bg-lime-100 text-lime-600'}">
										{t.source === 'telegram' ? 'Telegram' : 'Manual'}
									</span>
								</td>
								<td class="py-3 pr-1 text-right">
									<button class="text-ink-mute hover:text-ink" aria-label="Aksi">⋯</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</main>
</div>

<AddExpenseModal open={showAdd} onclose={() => (showAdd = false)} onsave={handleSave} />
