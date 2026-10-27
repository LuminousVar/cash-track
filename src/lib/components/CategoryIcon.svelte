<script>
	// Ikon kategori: glyph berwarna kategori di atas latar tipis warna yang sama.
	// Dipakai daftar per kategori dan sebagai cadangan ikon merchant.
	import Icon from './Icon.svelte';
	import { categoryColor, normCategory } from '$lib/format.js';

	/** @type {Record<string, string>} */
	const CATEGORY_ICONS = {
		'Makanan & Minuman': 'utensils',
		Belanja: 'bag',
		Transport: 'car',
		Tagihan: 'zap',
		Kesehatan: 'heartPulse',
		Hiburan: 'film',
		Investasi: 'trendingUp',
		Lainnya: 'shapes'
	};

	/** @type {{ category: string, size?: number }} */
	let { category, size = 36 } = $props();

	const cat = $derived(normCategory(category));
	const color = $derived(categoryColor(cat));
</script>

<span
	class="grid shrink-0 place-items-center rounded-[28%]"
	style="width: {size}px; height: {size}px; color: {color}; background: color-mix(in srgb, {color} 13%, transparent)"
	title={cat}
	aria-hidden="true"
>
	<Icon name={CATEGORY_ICONS[cat]} size={Math.round(size * 0.5)} strokeWidth={2} />
</span>
