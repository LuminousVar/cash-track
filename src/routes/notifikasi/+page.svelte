<script>
	import PageHeader from '$lib/components/PageHeader.svelte';

	// Contoh notifikasi (ilustrasi). Nanti bisa dari aktivitas bot/anggaran.
	const items = [
		{ icon: 'receipt', tone: 'success', title: 'Struk tercatat', desc: 'Indomaret · Rp 87.500 masuk dari bot Telegram.', time: '5 menit lalu', unread: true },
		{ icon: 'alert', tone: 'warn', title: 'Anggaran 75% terpakai', desc: 'Pemakaian bulan ini sudah Rp 7.125.000 dari Rp 9.500.000.', time: '2 jam lalu', unread: true },
		{ icon: 'plus', tone: 'lime', title: 'Pengeluaran manual ditambahkan', desc: 'Token Listrik PLN · Rp 200.000.', time: 'Kemarin', unread: false },
		{ icon: 'receipt', tone: 'success', title: 'Struk tercatat', desc: 'Kopi Kenangan · Rp 25.000 masuk dari bot Telegram.', time: 'Kemarin', unread: false }
	];

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
	<button class="rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:text-ink">Tandai sudah dibaca</button>
</PageHeader>

<section class="mt-6 rounded-card bg-surface p-2">
	{#each items as n}
		<div class="flex items-start gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-canvas">
			<span class="grid size-9 shrink-0 place-items-center rounded-xl {toneBg[n.tone]}">
				<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d={paths[n.icon]} /></svg>
			</span>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2">
					<p class="font-semibold">{n.title}</p>
					{#if n.unread}<span class="size-2 rounded-full bg-lime-500"></span>{/if}
				</div>
				<p class="mt-0.5 text-sm text-ink-soft">{n.desc}</p>
			</div>
			<span class="shrink-0 text-xs text-ink-mute">{n.time}</span>
		</div>
	{/each}
</section>
