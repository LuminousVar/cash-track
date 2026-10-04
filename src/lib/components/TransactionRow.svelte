<script>
	// Satu baris transaksi untuk daftar ringkas (ringkasan) dan daftar per tanggal (transaksi).
	import Icon from './Icon.svelte';
	import { formatRp, formatDate, categoryColor } from '$lib/format.js';

	/**
	 * @type {{
	 *   t: import('$lib/server/expenses.js').Expense,
	 *   showDate?: boolean,
	 *   editable?: boolean,
	 *   onedit?: (t: import('$lib/server/expenses.js').Expense) => void,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { t, showDate = true, editable = false, onedit, children } = $props();

	const meta = $derived(
		[showDate ? formatDate(t.date) : '', t.category, t.method, t.source === 'telegram' ? 'Struk' : 'Manual'].filter(Boolean).join(' · ')
	);
</script>

<div class="flex items-center gap-3 px-4 py-3">
	<span class="size-2 shrink-0 rounded-full" style="background: {categoryColor(t.category)}" aria-hidden="true"></span>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">{t.merchant || 'Tanpa keterangan'}</p>
		<p class="truncate text-xs text-ink-mute">{meta}</p>
	</div>
	<p class="num shrink-0 text-sm font-medium">{formatRp(t.total)}</p>
	{#if editable}
		{#if t.id}
			<button onclick={() => onedit?.(t)} class="btn btn-ghost btn-icon -mr-2 h-8 w-8" aria-label="Ubah {t.merchant || 'transaksi'}" title="Ubah">
				<Icon name="pencil" size={15} />
			</button>
		{:else}
			<span class="-mr-2 w-8 text-center text-xs text-ink-mute" title="Baris ini belum punya ID. Jalankan: bun scripts/backfill-ids.js">-</span>
		{/if}
	{/if}
</div>
{#if children}{@render children()}{/if}
