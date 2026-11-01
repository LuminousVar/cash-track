<script>
	// Navigasi HP: tab bar lima kolom (menu `tab` di nav.js plus "Lainnya"). "Lainnya"
	// membuka lembar bawah berisi menu sisanya, tema, dan akun, yang di desktop ada di sidebar.
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import Icon from './Icon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { NAV, isActive } from '$lib/nav.js';

	/** @type {{ user?: string | null }} */
	let { user = null } = $props();

	const tabs = NAV.filter((n) => n.tab);
	const more = NAV.filter((n) => !n.tab);

	let sheetOpen = $state(false);
	/** @type {HTMLButtonElement | undefined} */
	let moreButton = $state();
	/** @type {HTMLDivElement | undefined} */
	let sheet = $state();

	const moreActive = $derived(more.some((n) => isActive(page.url.pathname, n.href)));

	afterNavigate(() => (sheetOpen = false));

	async function openSheet() {
		sheetOpen = true;
		await tick();
		sheet?.querySelector('a')?.focus();
	}

	function closeSheet() {
		sheetOpen = false;
		moreButton?.focus();
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (sheetOpen && e.key === 'Escape') closeSheet();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet tab(/** @type {string} */ label, /** @type {string} */ icon, /** @type {boolean} */ active)}
	<span class="grid h-7 w-12 place-items-center rounded-full transition-colors {active ? 'bg-accent-soft text-accent' : ''}">
		<Icon name={icon} size={20} strokeWidth={active ? 2 : 1.75} />
	</span>
	<span class="leading-none">{label}</span>
{/snippet}

<nav
	aria-label="Navigasi utama"
	class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
>
	<ul class="mx-auto grid max-w-md grid-cols-5">
		{#each tabs as item}
			{@const active = isActive(page.url.pathname, item.href)}
			<li>
				<a
					href={item.href}
					aria-current={active ? 'page' : undefined}
					class="flex h-16 flex-col items-center justify-center gap-1 text-[11px] {active ? 'font-semibold text-ink' : 'font-medium text-ink-mute'}"
				>
					{@render tab(item.label, item.icon, active)}
				</a>
			</li>
		{/each}
		<li>
			<button
				bind:this={moreButton}
				type="button"
				aria-haspopup="dialog"
				aria-expanded={sheetOpen}
				onclick={openSheet}
				class="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] {moreActive ? 'font-semibold text-ink' : 'font-medium text-ink-mute'}"
			>
				{@render tab('Lainnya', 'grid', moreActive)}
			</button>
		</li>
	</ul>
</nav>

{#if sheetOpen}
	<div class="fixed inset-0 z-50 md:hidden">
		<button class="absolute inset-0 bg-black/40" aria-label="Tutup" tabindex="-1" onclick={closeSheet}></button>
		<div
			bind:this={sheet}
			role="dialog"
			aria-modal="true"
			aria-labelledby="more-sheet-title"
			class="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-xl"
		>
			<div class="flex items-center justify-between px-5 pb-1 pt-4">
				<h2 id="more-sheet-title" class="text-base font-semibold">Lainnya</h2>
				<button type="button" onclick={closeSheet} class="btn btn-ghost btn-icon h-8 w-8" aria-label="Tutup"><Icon name="x" /></button>
			</div>

			<ul class="px-3 py-1">
				{#each more as item}
					{@const active = isActive(page.url.pathname, item.href)}
					<li>
						<a
							href={item.href}
							aria-current={active ? 'page' : undefined}
							class="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] {active ? 'bg-subtle font-medium text-ink' : 'text-ink-soft'}"
						>
							<Icon name={item.icon} size={20} class={active ? 'text-accent' : 'text-ink-mute'} />
							<span class="flex-1">{item.label}</span>
							<Icon name="chevronRight" class="text-ink-mute" />
						</a>
					</li>
				{/each}
			</ul>

			<div class="mx-5 flex items-center justify-between gap-3 border-t border-line py-4">
				<span class="text-sm text-ink-soft">Tema</span>
				<ThemeToggle />
			</div>

			{#if user}
				<div class="mx-5 flex items-center gap-3 border-t border-line py-4">
					<span class="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-sm font-semibold text-ink-soft" aria-hidden="true">
						{user.slice(0, 1).toUpperCase()}
					</span>
					<span class="min-w-0 flex-1 truncate text-sm font-medium">{user}</span>
					<form method="POST" action="/logout">
						<button class="btn btn-secondary h-8 px-3 text-[13px]"><Icon name="logout" size={14} /> Keluar</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
{/if}
