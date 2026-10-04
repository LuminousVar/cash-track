<script>
	// Pilihan tema: terang, gelap, atau ikut sistem. Disimpan per browser di
	// localStorage['ct-theme']; app.html menerapkannya sebelum render pertama.
	import Icon from './Icon.svelte';

	/** @type {{ compact?: boolean }} */
	let { compact = false } = $props();

	const OPTIONS = /** @type {const} */ ([
		{ value: 'light', label: 'Terang', icon: 'sun' },
		{ value: 'dark', label: 'Gelap', icon: 'moon' },
		{ value: 'system', label: 'Sistem', icon: 'monitor' }
	]);

	/** @type {'light' | 'dark' | 'system'} */
	let theme = $state('system');

	$effect(() => {
		try {
			const t = localStorage.getItem('ct-theme');
			theme = t === 'light' || t === 'dark' ? t : 'system';
		} catch {
			theme = 'system';
		}
	});

	/** @param {'light' | 'dark' | 'system'} value */
	function apply(value) {
		theme = value;
		try {
			if (value === 'system') localStorage.removeItem('ct-theme');
			else localStorage.setItem('ct-theme', value);
		} catch {
			/* mode privat: tetap berlaku untuk halaman ini */
		}
		const dark = value === 'dark' || (value === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
		document.documentElement.classList.toggle('dark', dark);
	}
</script>

<div role="radiogroup" aria-label="Tema" class="inline-flex rounded-lg border border-line bg-subtle p-0.5">
	{#each OPTIONS as o}
		<button
			type="button"
			role="radio"
			aria-checked={theme === o.value}
			aria-label={o.label}
			title={o.label}
			onclick={() => apply(o.value)}
			class="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors
				{theme === o.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink'}"
		>
			<Icon name={o.icon} size={14} />
			{#if !compact}<span>{o.label}</span>{/if}
		</button>
	{/each}
</div>
