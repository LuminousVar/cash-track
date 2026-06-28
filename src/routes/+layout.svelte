<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children, data } = $props();

	const bare = $derived(page.url.pathname === '/login');

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
	<title>{pageTitle === 'Dashboard' ? 'cashtrack' : `${pageTitle} — cashtrack`}</title>
</svelte:head>

{#if bare}
	{@render children()}
{:else}
	<div class="flex h-screen overflow-hidden">
		<Sidebar user={data.user} />
		<main class="flex-1 overflow-y-auto px-7 py-6">
			{@render children()}
		</main>
	</div>
{/if}
