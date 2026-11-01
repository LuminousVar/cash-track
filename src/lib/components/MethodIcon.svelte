<script>
	// Ikon metode bayar: glyph solid abu di atas latar netral. Sengaja tidak berwarna
	// supaya tidak bersaing dengan warna kategori. Metode tak dikenal tampil sebagai kotak kosong.
	import { METHOD_GLYPHS } from '$lib/method-icons.js';

	/** @type {{ method: string, size?: number }} */
	let { method, size = 20 } = $props();

	// Kanvas 256 punya margin sekitar 15%, sama dengan CategoryIcon.
	const glyph = $derived(Math.round(size * 0.56));
</script>

<span
	class="grid shrink-0 place-items-center rounded-[28%] bg-subtle text-ink-soft"
	style="width: {size}px; height: {size}px"
	aria-hidden="true"
>
	{#if METHOD_GLYPHS[method]}
		<svg viewBox="0 0 256 256" width={glyph} height={glyph}>
			<path fill="currentColor" fill-rule="evenodd" d={METHOD_GLYPHS[method]} />
		</svg>
	{/if}
</span>
