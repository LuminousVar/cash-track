<script>
	import { untrack } from 'svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { page } from '$app/state';
	import { formatRp, formatDay, categoryColor, CATEGORIES, cycleKey, cycleLabel, cycleRangeLabel } from '$lib/format.js';

	let { data } = $props();

	/** @param {string} date */
	const periodOf = (date) => cycleKey(date, data.cycleStartDay);

	// Filter awal dari URL: ?category=…&period=YYYY-MM (mis. dari Ringkasan atau Laporan).
	const initCat = page.url.searchParams.get('category');
	const initPeriod = page.url.searchParams.get('period');

	let showAdd = $state(false);
	/** @type {import('$lib/server/expenses.js').Expense | null} */
	let editing = $state(null);
	let expandedId = $state('');

	let q = $state('');
	let cat = $state(initCat && CATEGORIES.includes(initCat) ? initCat : 'Semua');
	let src = $state('Semua');
	// Nilai awal saja; setelah itu pilihan user tidak ditimpa saat data dimuat ulang.
	let period = $state(
		untrack(() => {
			if (initPeriod && /^\d{4}-\d{2}$/.test(initPeriod)) return initPeriod;
			if (initCat) return 'Semua';
			const keys = data.expenses.map((e) => periodOf(e.date)).filter(Boolean);
			return keys.includes(data.currentCycleKey) ? data.currentCycleKey : (keys.sort().at(-1) ?? 'Semua');
		})
	);

	const periodOptions = $derived(
		[...new Set([data.currentCycleKey, ...data.expenses.map((e) => periodOf(e.date)).filter(Boolean)])]
			.sort()
			.reverse()
			.map((key) => {
				const range = cycleRangeLabel(key, data.cycleStartDay);
				const name = key === data.currentCycleKey ? `${cycleLabel(key)} (berjalan)` : cycleLabel(key);
				return { key, label: range ? `${name}, ${range}` : name };
			})
	);

	const PAGE = 50;
	let limit = $state(PAGE);
	$effect(() => {
		void [q, cat, src, period];
		limit = PAGE;
	});

	/**
	 * Cocokkan kata kunci ke keterangan, nama barang, dan catatan.
	 * @param {import('$lib/server/expenses.js').Expense} e
	 * @param {string} needle
	 */
	function matches(e, needle) {
		if (!needle) return true;
		const n = needle.toLowerCase();
		return (
			(e.merchant || '').toLowerCase().includes(n) ||
			(e.notes || '').toLowerCase().includes(n) ||
			(e.items ?? []).some((i) => (i.name || '').toLowerCase().includes(n))
		);
	}

	const filtered = $derived(
		data.expenses.filter(
			(e) =>
				(period === 'Semua' || periodOf(e.date) === period) &&
				(cat === 'Semua' || e.category === cat) &&
				(src === 'Semua' || e.source === src) &&
				matches(e, q)
		)
	);
	const total = $derived(filtered.reduce((s, e) => s + e.total, 0));
	const visible = $derived(filtered.slice(0, limit));
	const hasFilter = $derived(q !== '' || cat !== 'Semua' || src !== 'Semua');

	// Subtotal per tanggal dari semua hasil filter, bukan hanya yang tampil.
	const dayTotals = $derived(
		filtered.reduce((/** @type {Record<string, number>} */ acc, e) => ((acc[e.date] = (acc[e.date] || 0) + e.total), acc), {})
	);
	const groups = $derived(
		Object.entries(
			visible.reduce((/** @type {Record<string, typeof visible>} */ acc, e) => ((acc[e.date] ||= []).push(e), acc), {})
		)
	);

	function resetFilters() {
		q = '';
		cat = 'Semua';
		src = 'Semua';
	}
</script>

<PageHeader title="Transaksi" description="Semua pengeluaran dari struk Telegram dan input manual.">
	<button onclick={() => (showAdd = true)} class="btn btn-primary w-full sm:w-auto">
		<Icon name="plus" />
		Tambah pengeluaran
	</button>
</PageHeader>

<section class="card mt-6" aria-label="Daftar transaksi">
	<div class="grid grid-cols-2 gap-2 border-b border-line p-3 lg:grid-cols-[1fr_auto_auto_auto]">
		<label class="relative col-span-2 lg:col-span-1">
			<span class="sr-only">Cari</span>
			<Icon name="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
			<input bind:value={q} type="search" placeholder="Cari keterangan, barang, catatan" class="field pl-9" />
		</label>
		<label class="col-span-2 sm:col-span-1">
			<span class="sr-only">Periode</span>
			<select bind:value={period} class="field lg:w-64">
				{#each periodOptions as o}<option value={o.key}>{o.label}</option>{/each}
				<option value="Semua">Semua periode</option>
			</select>
		</label>
		<label>
			<span class="sr-only">Kategori</span>
			<select bind:value={cat} class="field lg:w-40">
				<option value="Semua">Semua kategori</option>
				{#each CATEGORIES as c}<option>{c}</option>{/each}
			</select>
		</label>
		<label>
			<span class="sr-only">Sumber</span>
			<select bind:value={src} class="field lg:w-36">
				<option value="Semua">Semua sumber</option>
				<option value="telegram">Struk Telegram</option>
				<option value="manual">Manual</option>
			</select>
		</label>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5 text-sm">
		<p class="text-ink-soft">
			<span class="num font-medium text-ink">{filtered.length}</span> transaksi
			<span class="text-ink-mute">·</span>
			total <span class="num font-medium text-ink">{formatRp(total)}</span>
		</p>
		{#if hasFilter}
			<button onclick={resetFilters} class="text-sm text-ink-soft hover:text-ink">Hapus filter</button>
		{/if}
	</div>

	{#if filtered.length === 0}
		<div class="px-4 py-14 text-center">
			<p class="text-sm text-ink-soft">Tidak ada transaksi yang cocok.</p>
			{#if period !== 'Semua'}
				<button onclick={() => (period = 'Semua')} class="mt-2 text-sm font-medium text-accent hover:underline">Lihat semua periode</button>
			{/if}
		</div>
	{:else}
		{#each groups as [date, rows]}
			<div class="flex items-center justify-between bg-subtle/60 px-4 py-1.5 text-xs font-medium text-ink-mute">
				<span>{formatDay(date)}</span>
				<span class="num">{formatRp(dayTotals[date] ?? 0)}</span>
			</div>
			<ul class="divide-y divide-line">
				{#each rows as t (t.id || `${t.date}-${t.merchant}-${t.total}`)}
					{@const items = t.items ?? []}
					{@const open = !!t.id && expandedId === t.id}
					<li>
						<div class="flex items-center gap-3 px-4 py-3">
							<span class="size-2 shrink-0 rounded-full" style="background: {categoryColor(t.category)}" aria-hidden="true"></span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{t.merchant || 'Tanpa keterangan'}</p>
								<p class="truncate text-xs text-ink-mute">
									{[t.category, t.method, t.source === 'telegram' ? 'Struk' : 'Manual'].filter(Boolean).join(' · ')}
									{#if items.length > 0 && t.id}
										<span>·</span>
										<button
											onclick={() => (expandedId = open ? '' : (t.id ?? ''))}
											aria-expanded={open}
											class="font-medium text-ink-soft hover:text-ink hover:underline"
										>
											{items.length} barang
										</button>
									{/if}
								</p>
							</div>
							<p class="num shrink-0 text-sm font-medium">{formatRp(t.total)}</p>
							{#if data.demo}
								<span class="w-8"></span>
							{:else if t.id}
								<button onclick={() => (editing = t)} class="btn btn-ghost btn-icon -mr-2 h-8 w-8" aria-label="Ubah {t.merchant || 'transaksi'}" title="Ubah atau hapus">
									<Icon name="pencil" size={15} />
								</button>
							{:else}
								<span class="-mr-2 w-8 text-center text-xs text-ink-mute" title="Baris ini belum punya ID. Jalankan: bun scripts/backfill-ids.js">-</span>
							{/if}
						</div>
						{#if open}
							<div class="px-4 pb-3 pl-9">
								<table class="w-full text-xs">
									<tbody>
										{#each items as it}
											<tr>
												<td class="py-0.5 pr-3 text-ink-soft">{it.name || 'Tanpa nama'}</td>
												<td class="num whitespace-nowrap py-0.5 pr-3 text-right text-ink-mute">{it.qty} × {formatRp(it.price)}</td>
												<td class="num whitespace-nowrap py-0.5 text-right">{formatRp(it.qty * it.price)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
								{#if t.notes}<p class="mt-2 text-xs text-ink-mute">Catatan: {t.notes}</p>{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/each}

		{#if filtered.length > visible.length}
			<div class="flex flex-col items-center gap-2 border-t border-line p-4">
				<p class="text-xs text-ink-mute">Menampilkan {visible.length} dari {filtered.length}</p>
				<button onclick={() => (limit += PAGE)} class="btn btn-secondary">Tampilkan {Math.min(PAGE, filtered.length - visible.length)} lagi</button>
			</div>
		{/if}
	{/if}
</section>

<AddExpenseModal open={showAdd} demo={data.demo} onclose={() => (showAdd = false)} />
<AddExpenseModal open={!!editing} demo={data.demo} mode="edit" expense={editing} onclose={() => (editing = null)} />
