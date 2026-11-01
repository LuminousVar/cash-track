<script>
	// Panel mengambang untuk DatePicker, MonthPicker, dan Select. position: fixed supaya
	// tidak terpotong area scroll dialog: di bawah `anchor` kalau muat, kalau tidak di
	// atasnya, dan selalu di dalam layar. Pointer atau fokus di luar `scope` menutupnya.
	// Escape ditangani pemakainya, karena fokus bisa di tombol pemicu atau di panel.

	/**
	 * @type {{
	 *   anchor: HTMLElement | undefined,
	 *   scope: HTMLElement | undefined,
	 *   onclose: () => void,
	 *   matchWidth?: boolean,
	 *   el?: HTMLDivElement,
	 *   class?: string,
	 *   children: import('svelte').Snippet,
	 *   [attr: string]: unknown
	 * }}
	 */
	let { anchor, scope, onclose, matchWidth = false, el = $bindable(), class: klass = '', children, ...rest } = $props();

	// Ditulis langsung ke style: ukuran panel baru benar setelah lebar minimumnya terpasang.
	function place() {
		if (!anchor || !el) return;
		const r = anchor.getBoundingClientRect();
		if (matchWidth) el.style.minWidth = `${r.width}px`;
		const gap = 6;
		const edge = 8;
		const h = el.offsetHeight;
		const below = r.bottom + gap + h <= window.innerHeight - edge || r.top - gap - h < edge;
		el.style.top = `${below ? r.bottom + gap : r.top - gap - h}px`;
		el.style.left = `${Math.max(edge, Math.min(r.left, window.innerWidth - el.offsetWidth - edge))}px`;
	}

	$effect(() => {
		if (!el) return;
		place();
		window.addEventListener('resize', place);
		window.addEventListener('scroll', place, true);
		return () => {
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', place, true);
		};
	});

	/** @param {Event} e */
	function onOutside(e) {
		if (!scope?.contains(/** @type {Node} */ (e.target))) onclose();
	}
</script>

<svelte:window onpointerdown={onOutside} onfocusin={onOutside} />

<div
	bind:this={el}
	{...rest}
	class="fixed left-0 top-0 z-50 rounded-xl border border-line bg-surface shadow-lg outline-none {klass}"
>
	{@render children()}
</div>
