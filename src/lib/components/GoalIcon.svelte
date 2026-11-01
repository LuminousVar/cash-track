<script>
	// Ikon goal: glyph solid berwarna jenis goal di atas latar tipis warna yang sama,
	// sama seperti CategoryIcon. `bare` hanya glyph-nya, untuk pilihan di form.
	import { GOAL_ICONS } from '$lib/goal-icons.js';

	/** @type {{ icon: string, color: string, size?: number, bare?: boolean }} */
	let { icon, color, size = 40, bare = false } = $props();

	// Kanvas 256 punya margin sekitar 15%, sama dengan CategoryIcon.
	const glyph = $derived(bare ? size : Math.round(size * 0.56));
</script>

{#snippet svg()}
	<svg viewBox="0 0 256 256" width={glyph} height={glyph} class="shrink-0" style:color={bare ? color : undefined} aria-hidden="true">
		<path fill="currentColor" fill-rule="evenodd" d={GOAL_ICONS[icon]?.d ?? ''} />
	</svg>
{/snippet}

{#if bare}
	{@render svg()}
{:else}
	<span
		class="grid shrink-0 place-items-center rounded-[28%]"
		style="width: {size}px; height: {size}px; color: {color}; background: color-mix(in srgb, {color} 13%, transparent)"
		aria-hidden="true"
	>
		{@render svg()}
	</span>
{/if}
