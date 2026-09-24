<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { buildNotifications } from '$lib/notifications.js';

	let { data } = $props();

	const items = $derived(buildNotifications(data, data.warnPct));

	// Status "sudah dibaca" cukup per-browser, pola sama dengan toggle tema.
	const KEY = 'ct-read-notifications';

	/** @type {string[]} */
	let read = $state([]);
	$effect(() => {
		try {
			read = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		} catch {
			read = [];
		}
	});

	const unreadCount = $derived(items.filter((n) => !read.includes(n.id)).length);

	function markAllRead() {
		read = items.map((n) => n.id);
		try {
			localStorage.setItem(KEY, JSON.stringify(read));
		} catch {
			/* private mode, abaikan */
		}
	}

	/** @type {Record<string, string>} */
	const toneBg = { success: 'bg-success-bg text-success', warn: 'bg-warn-bg text-warn', lime: 'bg-lime-100 text-lime-600' };
	/** @type {Record<string, string>} */
	const paths = {
		receipt: 'M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1-2-1Z',
		alert: 'M12 9v4M12 17h.01M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z',
		plus: 'M12 5v14M5 12h14'
	};
</script>

<PageHeader title="Notifikasi" subtitle="Pemberitahuan aktivitas & anggaran.">
	<button
		onclick={markAllRead}
		disabled={unreadCount === 0}
		class="rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:text-ink disabled:opacity-50"
	>
		Tandai sudah dibaca{unreadCount > 0 ? ` (${unreadCount})` : ''}
	</button>
</PageHeader>

<section class="mt-6 rounded-card bg-surface p-2">
	{#if items.length === 0}
		<p class="py-12 text-center text-sm text-ink-mute">Belum ada aktivitas untuk dilaporkan.</p>
	{:else}
		{#each items as n (n.id)}
			<div class="flex items-start gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-canvas">
				<span class="grid size-9 shrink-0 place-items-center rounded-xl {toneBg[n.tone]}">
					<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d={paths[n.icon]} /></svg>
				</span>
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<p class="font-semibold">{n.title}</p>
						{#if !read.includes(n.id)}<span class="size-2 shrink-0 rounded-full bg-lime-500"></span>{/if}
					</div>
					<p class="mt-0.5 text-sm text-ink-soft">{n.desc}</p>
				</div>
				<span class="shrink-0 text-xs text-ink-mute">{n.time}</span>
			</div>
		{/each}
	{/if}
</section>
