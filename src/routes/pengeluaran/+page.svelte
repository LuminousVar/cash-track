<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { formatRp, formatDate, CATEGORY_TONE, CATEGORIES } from '$lib/format.js';

	let { data } = $props();

	// Pre-filter kategori dari query (?category=…), mis. saat klik kartu di /kategori.
	const initCat = page.url.searchParams.get('category');

	let showAdd = $state(false);
	/** @type {import('$lib/server/expenses.js').Expense | null} */
	let editing = $state(null);
	/** Baris yang sedang menunggu konfirmasi hapus. */
	let confirmId = $state('');
	let busyId = $state('');
	let error = $state('');
	/** Baris yang rincian barangnya sedang dibuka. */
	let expandedId = $state('');

	let q = $state('');
	let cat = $state(initCat && CATEGORIES.includes(initCat) ? initCat : 'Semua');
	let src = $state('Semua');

	/**
	 * Cocokkan kata kunci ke nama tempat maupun nama barang.
	 * @param {import('$lib/server/expenses.js').Expense} e
	 * @param {string} needle
	 */
	function matches(e, needle) {
		if (!needle) return true;
		const n = needle.toLowerCase();
		if ((e.merchant || '').toLowerCase().includes(n)) return true;
		return (e.items ?? []).some((i) => (i.name || '').toLowerCase().includes(n));
	}

	const filtered = $derived(
		data.expenses.filter(
			(e) =>
				(cat === 'Semua' || e.category === cat) &&
				(src === 'Semua' || e.source === src) &&
				matches(e, q)
		)
	);
	const total = $derived(filtered.reduce((s, e) => s + e.total, 0));

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function onDelete({ formData }) {
		busyId = String(formData.get('id') || '');
		error = '';
		return async ({ result }) => {
			busyId = '';
			confirmId = '';
			if (result.type === 'failure') error = String(result.data?.error ?? 'Gagal menghapus.');
			await invalidateAll();
		};
	}
</script>

<PageHeader title="Pengeluaran" subtitle="Semua transaksi yang tercatat.">
	<button onclick={() => (showAdd = true)} class="flex items-center gap-2 rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-bold text-forest-900 shadow-sm transition hover:bg-lime-400">
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
		Tambah Pengeluaran
	</button>
</PageHeader>

{#if error}
	<p class="mt-4 rounded-xl bg-warn-bg px-4 py-3 text-sm font-semibold text-warn">{error}</p>
{/if}

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
				<input bind:value={q} placeholder="Cari tempat / barang…" class="w-40 bg-transparent text-ink outline-none placeholder:text-ink-mute" />
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
						<th class="pb-3 text-center font-semibold">Sumber</th>
						<th class="pb-3 pr-1 text-right font-semibold">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as t (t.id || `${t.date}-${t.merchant}-${t.total}`)}
						{@const tone = CATEGORY_TONE[t.category] ?? CATEGORY_TONE.Lainnya}
						{@const items = t.items ?? []}
						{@const open = expandedId === t.id && !!t.id}
						<tr class="border-b border-line/70 {open ? 'border-b-0' : ''} last:border-0">
							<td class="py-3 pl-1">
								<div class="flex items-center gap-3">
									<span class="grid size-8 place-items-center rounded-lg text-xs font-bold" style="background: {tone.bg}; color: {tone.fg};">{(t.merchant || '?')[0]}</span>
									<div class="min-w-0">
										<span class="font-semibold">{t.merchant || 'Tanpa nama'}</span>
										{#if items.length > 0}
											<button
												onclick={() => (expandedId = open ? '' : (t.id ?? ''))}
												class="ml-2 text-xs font-semibold text-forest-600 hover:text-forest-700"
											>
												{items.length} barang {open ? '▴' : '▾'}
											</button>
										{/if}
									</div>
								</div>
							</td>
							<td class="py-3 text-ink-soft">{formatDate(t.date)}</td>
							<td class="py-3"><span class="rounded-md px-2 py-1 text-xs font-semibold" style="background: {tone.bg}; color: {tone.fg};">{t.category}</span></td>
							<td class="py-3 text-ink-soft">{t.method}</td>
							<td class="num py-3 text-right font-bold">{formatRp(t.total)}</td>
							<td class="py-3 text-center">
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold {t.source === 'telegram' ? 'bg-success-bg text-success' : 'bg-lime-100 text-lime-600'}">{t.source === 'telegram' ? 'Telegram' : 'Manual'}</span>
							</td>
							<td class="py-3 pr-1 text-right">
								{#if data.demo}
									<span class="text-xs text-ink-mute">—</span>
								{:else if !t.id}
									<span class="text-xs text-ink-mute" title="Baris ini belum punya ID. Jalankan: bun scripts/backfill-ids.js">tanpa ID</span>
								{:else if confirmId === t.id}
									<div class="flex items-center justify-end gap-1.5">
										<form method="POST" action="?/delete" use:enhance={onDelete}>
											<input type="hidden" name="id" value={t.id} />
											<button type="submit" disabled={busyId === t.id} class="rounded-lg bg-[#fef2f2] px-2.5 py-1.5 text-xs font-bold text-[#dc2626] transition hover:bg-[#fee2e2] disabled:opacity-50">
												{busyId === t.id ? 'Menghapus…' : 'Hapus'}
											</button>
										</form>
										<button onclick={() => (confirmId = '')} class="rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-soft hover:bg-canvas">Batal</button>
									</div>
								{:else}
									<div class="flex items-center justify-end gap-1">
										<button onclick={() => (editing = t)} class="grid size-8 place-items-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-forest-600" aria-label="Ubah" title="Ubah">
											<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
										</button>
										<button onclick={() => (confirmId = t.id ?? '')} class="grid size-8 place-items-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-[#dc2626]" aria-label="Hapus" title="Hapus">
											<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
										</button>
									</div>
								{/if}
							</td>
						</tr>
						{#if open}
							<tr class="border-b border-line/70 last:border-0">
								<td colspan="7" class="px-1 pb-3">
									<div class="rounded-xl bg-canvas p-3">
										<p class="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Rincian barang</p>
										<ul class="mt-2 space-y-1">
											{#each items as it}
												<li class="flex items-center justify-between gap-3 text-xs">
													<span class="min-w-0 flex-1 truncate text-ink-soft">{it.name || 'Tanpa nama'}</span>
													<span class="num shrink-0 text-ink-mute">{it.qty} × {formatRp(it.price)}</span>
													<span class="num w-28 shrink-0 text-right font-semibold">{formatRp(it.qty * it.price)}</span>
												</li>
											{/each}
										</ul>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>

<AddExpenseModal open={showAdd} demo={data.demo} onclose={() => (showAdd = false)} />
<AddExpenseModal open={!!editing} demo={data.demo} mode="edit" expense={editing} onclose={() => (editing = null)} />
