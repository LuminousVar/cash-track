<script>
	// Logo cashtrack: huruf c bersudut dan satu blok hijau di pojok kanan bawah (titik akhir
	// sebuah periode, sekaligus posisi hari ini). Digambar di grid 256 dengan tebal 44; viewBox
	// dipotong ke kotak 176 supaya `size` = tinggi simbol. Di 16px tebalnya pas 4px.
	// File lengkap (lockup, varian satu warna, ikon) ada di static/logo dan static/icons.

	/** @type {{ size?: number, wordmark?: boolean, class?: string }} */
	let { size = 16, wordmark = true, class: klass = '' } = $props();
</script>

<!-- items-baseline: alas simbol sejajar baseline teks, sama dengan lockup statis. -->
<span class="inline-flex items-baseline gap-2 font-semibold tracking-tight {klass}">
	<svg
		viewBox="40 40 176 176"
		width={size}
		height={size}
		class="shrink-0"
		aria-hidden={wordmark ? 'true' : undefined}
		role={wordmark ? undefined : 'img'}
		aria-label={wordmark ? undefined : 'cashtrack'}
	>
		<path
			fill="currentColor"
			d="M216 40H88A48 48 0 0 0 40 88V168A48 48 0 0 0 88 216H148V172H88A4 4 0 0 1 84 168V88A4 4 0 0 1 88 84H216Z"
		/>
		<path class="fill-accent" d="M172 172H216V216H172Z" />
	</svg>
	{#if wordmark}cashtrack{/if}
</span>
