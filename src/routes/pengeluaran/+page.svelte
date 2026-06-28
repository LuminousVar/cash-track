<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import { formatRp, formatDate, CATEGORY_TONE, CATEGORIES } from '$lib/format.js';

	let { data } = $props();

	let showAdd = $state(false);
	let q = $state('');
	let cat = $state('Semua');
	let src = $state('Semua');

	const filtered = $derived(
		data.expenses.filter(
			(e) =>
				(cat === 'Semua' || e.category === cat) &&
				(src === 'Semua' || e.source === src) &&
				(q === '' || (e.merchant || '').toLowerCase().includes(q.toLowerCase()))
		)
	);
	const total = $derived(filtered.reduce((s, e) => s + e.total, 0));
</script>

<PageHeader title="Pengeluaran" subtitle="Semua transaksi yang tercatat.">
	{#if data.demo}<span class="rounded-full bg-warn-bg px-2.5 py-1 text-[11px] font-semibold text-warn">Mode demo</span>{/if}
	<button onclick={() => (showAdd = true)} class="flex items-center gap-2 rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-bold text-forest-900 shadow-sm transition hover:bg-lime-400">
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
		Tambah Pengeluaran
	</button>
</PageHeader>

<!-- Ringkasan kecil -->
<section class="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Transaksi tampil</p>
		<p class="num mt-2 text-2xl font-extrabold">{filtered.length}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Total tampil</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(total)}</p>
	</div>
	<div class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Total keseluruhan</p>
		<p class="num mt-2 text-2xl font-extrabold">{data.expenses.length}</p>
	</div>
</section>

<!-- Tabel + filter -->
<section class="mt-5 rounded-card bg-surface p-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<span class="text-sm font-semibold">Daftar Pengeluaran</span>
		<div class="flex flex-wrap items-center gap-2">
			<label class="flex items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-sm text-ink-mute focus-within:ring-2 focus-within:ring-lime-300">
				<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
				<input bind:value={q} placeholder="Cari nama…" class="w-32 bg-transparent text-ink outline-none placeholder:text-ink-mute" />
			</label>
			<select bind:value={cat} class="rounded-lg bg-canvas px-3 py-2 text-sm font-medium text-ink-soft outline-none focus:ring-2 focus:ring-lime-300">
				<option>Semua</option>
				{#each CATEGORIES as c}<option>{c}</option>{/each}
			</select>
			<select bind:value={src} class="rounded-lg bg-canvas px-3 py-2 text-sm font-medium text-ink-soft outline-none focus:ring-2 focus:ring-lime-300">
				<option value="Semua">Semua sumber</option>
				<option value="telegram">Telegram</option>
				<option value="manual">Manual</option>
			</select>
		</div>
	</div>

	<div class="mt-4 overflow-x-auto">
		{#if filtered.length === 0}
			<p class="py-12 text-center text-sm text-ink-mute">Tidak ada transaksi yang cocok.</p>
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
					{#each filtered as t}
						{@const tone = CATEGORY_TONE[t.category] ?? CATEGORY_TONE.Lainnya}
						<tr class="border-b border-line/70 last:border-0">
							<td class="py-3 pl-1">
								<div class="flex items-center gap-3">
									<span class="grid size-8 place-items-center rounded-lg text-xs font-bold" style="background: {tone.bg}; color: {tone.fg};">{(t.merchant || '?')[0]}</span>
									<span class="font-semibold">{t.merchant || 'Tanpa nama'}</span>
								</div>
							</td>
							<td class="py-3 text-ink-soft">{formatDate(t.date)}</td>
							<td class="py-3"><span class="rounded-md px-2 py-1 text-xs font-semibold" style="background: {tone.bg}; color: {tone.fg};">{t.category}</span></td>
							<td class="py-3 text-ink-soft">{t.method}</td>
							<td class="num py-3 text-right font-bold">{formatRp(t.total)}</td>
							<td class="py-3 pr-1 text-center">
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold {t.source === 'telegram' ? 'bg-success-bg text-success' : 'bg-lime-100 text-lime-600'}">{t.source === 'telegram' ? 'Telegram' : 'Manual'}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>

<AddExpenseModal open={showAdd} demo={data.demo} onclose={() => (showAdd = false)} />
