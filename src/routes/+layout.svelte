<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { NAV, isActive } from '$lib/nav.js';

	let { children, data } = $props();

	const bare = $derived(page.url.pathname === '/login');
	const current = $derived(NAV.find((n) => isActive(page.url.pathname, n.href)));
	const pageTitle = $derived(bare ? 'Masuk' : (current?.label ?? 'cashtrack'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<title>{pageTitle === 'Ringkasan' ? 'cashtrack' : `${pageTitle} · cashtrack`}</title>
</svelte:head>

{#if bare}
	{@render children()}
{:else}
	<div class="flex h-dvh overflow-hidden">
		<div class="hidden md:flex">
			<Sidebar user={data.user} />
		</div>

		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			<main class="flex-1 overflow-y-auto">
				<div class="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 sm:px-6 md:pb-10 md:pt-8">
					{#if data.demo}
						<p class="mb-5 rounded-lg border border-warn/30 bg-warn-bg px-3 py-2 text-sm text-warn">
							Mode demo: Google Sheet belum tersambung. Data di bawah adalah contoh dan perubahan tidak disimpan.
						</p>
					{/if}
					{@render children()}
				</div>
			</main>

			<!-- Tab bar HP: lima menu selalu terlihat, tanpa drawer. -->
			<nav
				aria-label="Navigasi utama"
				class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
			>
				<ul class="grid grid-cols-5">
					{#each NAV as item}
						{@const active = isActive(page.url.pathname, item.href)}
						<li>
							<a
								href={item.href}
								aria-current={active ? 'page' : undefined}
								class="flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium
									{active ? 'text-accent' : 'text-ink-mute'}"
							>
								<Icon name={item.icon} size={20} />
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</div>
{/if}
