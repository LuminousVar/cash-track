<script>
	// Tempat notifikasi dari toast(): di HP tepat di atas tab bar, di desktop pojok kanan bawah.
	import Icon from './Icon.svelte';
	import { toasts, dismiss } from '$lib/toast.svelte.js';

	const TONE = {
		success: { icon: 'check', cls: 'bg-success-bg text-success' },
		info: { icon: 'alert', cls: 'bg-warn-bg text-warn' },
		error: { icon: 'alert', cls: 'bg-danger-bg text-danger' }
	};
</script>

<div
	role="status"
	aria-live="polite"
	class="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end md:px-0"
>
	{#each toasts as t (t.id)}
		<div class="toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-line bg-surface py-2 pl-3 pr-1.5 text-sm shadow-lg">
			<span class="grid size-5 shrink-0 place-items-center rounded-full {TONE[t.tone].cls}">
				<Icon name={TONE[t.tone].icon} size={12} strokeWidth={2.25} />
			</span>
			<p class="min-w-0 flex-1 py-1">{t.message}</p>
			<button type="button" onclick={() => dismiss(t.id)} class="btn btn-ghost btn-icon h-7 w-7" aria-label="Tutup notifikasi">
				<Icon name="x" size={14} />
			</button>
		</div>
	{/each}
</div>

<style>
	.toast {
		animation: toast-in 160ms ease-out;
	}
	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.toast {
			animation: none;
		}
	}
</style>
