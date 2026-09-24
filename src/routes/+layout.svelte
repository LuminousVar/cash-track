<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children, data } = $props();

	const bare = $derived(page.url.pathname === '/login');

	// Drawer sidebar untuk layar kecil (di ≥ md sidebar selalu tampil).
	let menuOpen = $state(false);

	/** @type {Record<string, string>} */
	const PAGE_TITLES = {
		'/': 'Dashboard',
		'/pengeluaran': 'Pengeluaran',
		'/kategori': 'Kategori',
		'/laporan': 'Laporan',
		'/anggaran': 'Anggaran',
		'/riwayat': 'Riwayat',
		'/notifikasi': 'Notifikasi',
		'/pengaturan': 'Pengaturan',
		'/bantuan': 'Bantuan',
		'/login': 'Masuk'
	};

	const pageTitle = $derived(
		PAGE_TITLES[page.url.pathname] ?? page.url.pathname.split('/').filter(Boolean).at(-1) ?? 'cashtrack'
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{pageTitle === 'Dashboard' ? 'cashtrack' : `${pageTitle} | cashtrack`}</title>
</svelte:head>

{#if bare}
	{@render children()}
{:else}
	<div class="flex h-dvh overflow-hidden">
		<!-- Sidebar tetap: hanya md ke atas -->
		<div class="hidden md:flex">
			<Sidebar user={data.user} />
		</div>

		<!-- Drawer: md ke bawah -->
		{#if menuOpen}
			<div class="fixed inset-0 z-50 md:hidden">
				<button class="absolute inset-0 bg-forest-900/40 backdrop-blur-[2px]" aria-label="Tutup menu" onclick={() => (menuOpen = false)}></button>
				<div class="relative h-full w-[244px] shadow-2xl">
					<Sidebar user={data.user} onnavigate={() => (menuOpen = false)} />
				</div>
			</div>
		{/if}

		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			<!-- Top bar mobile -->
			<div class="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
				<button
					onclick={() => (menuOpen = true)}
					aria-label="Buka menu"
					class="grid size-9 place-items-center rounded-xl bg-canvas text-ink-soft transition hover:text-ink"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
				</button>
				<span class="text-[15px] font-extrabold tracking-tight">cash<span class="text-forest-600">track</span></span>
			</div>

			<main class="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6">
				{#if data.demo}
					<p class="mb-4 rounded-lg bg-warn-bg px-3 py-2 text-xs font-medium text-warn">
						Mode demo: Google Sheet belum tersambung, jadi data yang tampil adalah contoh dan perubahan tidak disimpan.
					</p>
				{/if}
				{@render children()}
			</main>
		</div>
	</div>
{/if}
