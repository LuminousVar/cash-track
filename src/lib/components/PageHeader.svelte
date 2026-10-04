<script>
	/** @type {{ title: string, description?: string, children?: import('svelte').Snippet }} */
	let { title, description = '', children } = $props();
</script>

<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
	<div class="min-w-0">
		<h1 class="text-xl font-semibold tracking-tight">{title}</h1>
		{#if description}<p class="mt-0.5 text-sm text-ink-soft">{description}</p>{/if}
	</div>
	{#if children}
		<div class="flex flex-wrap gap-2">{@render children()}</div>
	{/if}
</header>
