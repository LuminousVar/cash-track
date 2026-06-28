<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatRp, CATEGORIES, PAYMENT_METHODS, CATEGORY_TONE } from '$lib/format.js';

	let { data } = $props();
	const initials = $derived((data.user ?? 'CT').slice(0, 2).toUpperCase());
</script>

<PageHeader title="Pengaturan" subtitle="Akun, anggaran, dan konfigurasi." />

<section class="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
	<!-- Akun -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Akun</span>
		<div class="mt-4 flex items-center gap-3">
			<span class="grid size-11 place-items-center rounded-xl bg-forest-700 text-sm font-bold text-white">{initials}</span>
			<div class="min-w-0 flex-1">
				<p class="font-semibold">{data.user ?? 'Mode demo'}</p>
				<p class="text-xs text-ink-mute">{data.user ? 'Sedang masuk' : 'Auth belum dikonfigurasi'}</p>
			</div>
			{#if data.user}
				<form method="POST" action="/logout">
					<button class="rounded-lg bg-canvas px-4 py-2 text-sm font-semibold text-ink-soft transition hover:text-ink">Keluar</button>
				</form>
			{/if}
		</div>
	</article>

	<!-- Anggaran -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Anggaran Bulanan</span>
		<p class="num mt-4 text-3xl font-extrabold tracking-tight">{formatRp(data.budget)}</p>
		<p class="mt-2 text-sm text-ink-soft">Dipakai untuk gauge di dashboard. Atur lewat variabel env <span class="font-mono text-ink">MONTHLY_BUDGET</span>.</p>
	</article>

	<!-- Bot Telegram -->
	<article class="rounded-card bg-surface p-5 lg:col-span-2">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold">Bot Telegram</span>
			<span class="rounded-full px-2.5 py-1 text-xs font-semibold {data.configured ? 'bg-success-bg text-success' : 'bg-warn-bg text-warn'}">{data.configured ? 'Terhubung' : 'Belum dikonfigurasi'}</span>
		</div>
		<p class="mt-3 text-sm text-ink-soft">Kirim foto struk ke bot → otomatis di-OCR, distrukturkan, lalu dicatat. Batasi akses dengan <span class="font-mono text-ink">TELEGRAM_ALLOWED_IDS</span> agar saldo aman.</p>
	</article>

	<!-- Kategori -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Kategori</span>
		<p class="mt-1 text-xs text-ink-mute">Daftar tetap, dipakai bot & input manual.</p>
		<div class="mt-4 flex flex-wrap gap-2">
			{#each CATEGORIES as c}
				{@const tone = CATEGORY_TONE[c] ?? CATEGORY_TONE.Lainnya}
				<span class="rounded-md px-2.5 py-1 text-xs font-semibold" style="background: {tone.bg}; color: {tone.fg};">{c}</span>
			{/each}
		</div>
	</article>

	<!-- Metode bayar -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Metode Pembayaran</span>
		<p class="mt-1 text-xs text-ink-mute">Pilihan saat input manual.</p>
		<div class="mt-4 flex flex-wrap gap-2">
			{#each PAYMENT_METHODS as m}
				<span class="rounded-md bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">{m}</span>
			{/each}
		</div>
	</article>
</section>
