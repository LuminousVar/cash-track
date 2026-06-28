<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children, data } = $props();

	// Halaman login berdiri sendiri tanpa shell sidebar.
	const bare = $derived(page.url.pathname === '/login');
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

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
