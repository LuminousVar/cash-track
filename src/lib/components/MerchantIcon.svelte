<script>
	// Ikon transaksi. Urutannya: logo merek kalau nama merchant dikenali (kategori
	// diabaikan), inisial kalau mereknya dikenali tapi belum ada file logo, selain itu
	// ikon kategori. Logo dari static/brands/, tidak ada request ke pihak ketiga.
	import CategoryIcon from './CategoryIcon.svelte';
	import { detectBrand } from '$lib/brands.js';
	import { BRAND_LOGOS } from '$lib/brand-logos.js';

	/** @type {{ merchant?: string, category: string, size?: number }} */
	let { merchant = '', category, size = 36 } = $props();

	const brand = $derived(detectBrand(merchant));
	const logo = $derived(brand ? BRAND_LOGOS[brand.slug] : undefined);
	// File logo gagal dimuat: turun ke inisial, bukan gambar rusak.
	let broken = $state(false);

	/** @param {string} name */
	function initials(name) {
		const w = name.split(/\s+/).filter(Boolean);
		return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase();
	}
</script>

{#if brand && logo && !broken}
	<img
		src="/brands/{logo}"
		alt=""
		title={brand.name}
		width={size}
		height={size}
		loading="lazy"
		decoding="async"
		onerror={() => (broken = true)}
		class="shrink-0 rounded-[28%] bg-white object-cover ring-1 ring-line"
	/>
{:else if brand}
	<span
		class="grid shrink-0 place-items-center rounded-[28%] bg-subtle font-semibold text-ink-soft ring-1 ring-line"
		style="width: {size}px; height: {size}px; font-size: {Math.round(size * 0.34)}px"
		title={brand.name}
		aria-hidden="true">{initials(brand.name)}</span
	>
{:else}
	<CategoryIcon {category} {size} />
{/if}
