<script>
	/** @type {{ title: string, subtitle?: string, children?: import('svelte').Snippet }} */
	let { title, subtitle = '', children } = $props();
</script>

<header class="flex items-center justify-between gap-4">
	<div>
		<h1 class="text-2xl font-extrabold tracking-tight">{title}</h1>
		{#if subtitle}<p class="text-sm text-ink-soft">{subtitle}</p>{/if}
	</div>
	{#if children}
		<div class="flex items-center gap-3">{@render children()}</div>
	{/if}
</header>
