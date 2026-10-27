<script>
	// Kerangka dialog: lembar bawah di HP, kotak di tengah di layar lebar.
	// Gaya sama dengan AddExpenseModal.
	import Icon from './Icon.svelte';

	/**
	 * @type {{
	 *   open: boolean,
	 *   title: string,
	 *   busy?: boolean,
	 *   onclose?: () => void,
	 *   children: import('svelte').Snippet,
	 *   footer?: import('svelte').Snippet
	 * }}
	 */
	let { open, title, busy = false, onclose, children, footer } = $props();

	/** @type {HTMLDivElement | undefined} */
	let panel = $state();
	const id = `dlg-${Math.random().toString(36).slice(2, 8)}`;

	// Fokus ke field pertama saat dibuka supaya keyboard langsung bekerja.
	$effect(() => {
		if (open) queueMicrotask(() => panel?.querySelector(/** @type {'input'} */ ('input:not([type=hidden]), select, textarea'))?.focus());
	});

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (open && e.key === 'Escape' && !busy) onclose?.();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
		<button class="absolute inset-0 bg-black/40" aria-label="Tutup" tabindex="-1" onclick={onclose}></button>
		<div
			bind:this={panel}
			role="dialog"
			aria-modal="true"
			aria-labelledby={id}
			class="relative flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl border border-line bg-surface shadow-xl sm:rounded-xl"
		>
			<div class="flex items-center justify-between border-b border-line px-5 py-4">
				<h2 {id} class="text-base font-semibold">{title}</h2>
				<button type="button" onclick={onclose} class="btn btn-ghost btn-icon h-8 w-8" aria-label="Tutup"><Icon name="x" /></button>
			</div>
			<div class="flex-1 overflow-y-auto px-5 py-4">{@render children()}</div>
			{#if footer}
				<div class="flex items-center gap-3 border-t border-line px-5 py-3.5">{@render footer()}</div>
			{/if}
		</div>
	</div>
{/if}
