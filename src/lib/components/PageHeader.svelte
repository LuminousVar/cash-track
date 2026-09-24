<script>
	/** @type {{ title: string, subtitle?: string, children?: import('svelte').Snippet }} */
	let { title, subtitle = '', children } = $props();

	const sun = '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
	const moon = '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"/>';

	let dark = $state(false);
	$effect(() => {
		dark = document.documentElement.classList.contains('dark');
	});
	function toggleTheme() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('ct-theme', dark ? 'dark' : 'light');
	}
</script>

<header class="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
	<div class="min-w-0 flex-1">
		<h1 class="text-2xl font-extrabold tracking-tight">{title}</h1>
		{#if subtitle}<p class="text-sm text-ink-soft">{subtitle}</p>{/if}
	</div>
	<button
		onclick={toggleTheme}
		aria-label={dark ? 'Tema terang' : 'Tema gelap'}
		title={dark ? 'Tema Terang' : 'Tema Gelap'}
		class="grid size-9 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line transition hover:ring-lime-400"
	>
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-ink-soft">
			{@html dark ? sun : moon}
		</svg>
	</button>
	{#if children}
		<!-- Di HP aksi mengisi satu baris penuh supaya tombol tidak terlipat dua baris. -->
		<div class="flex w-full gap-3 *:flex-1 *:justify-center sm:w-auto sm:*:flex-none">{@render children()}</div>
	{/if}
</header>
