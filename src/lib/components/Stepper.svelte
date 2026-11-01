<script>
	// Pengganti <input type="number">: angka di tengah, tombol kurang dan tambah di sisi.
	// Tetap bisa diketik dan diubah dengan panah atas/bawah; dijepit ke min..max saat fokus lepas.
	import Icon from './Icon.svelte';

	/**
	 * @type {{
	 *   value?: number,
	 *   min?: number,
	 *   max?: number,
	 *   step?: number,
	 *   name?: string,
	 *   label: string,
	 *   suffix?: string,
	 *   class?: string
	 * }}
	 */
	let { value = $bindable(1), min = 0, max = 9999, step = 1, name, label, suffix = '', class: klass = '' } = $props();

	/** @param {number} v */
	const clamp = (v) => Math.min(max, Math.max(min, Math.round(v)));

	/** @param {number} delta */
	function bump(delta) {
		value = clamp((Number(value) || 0) + delta);
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function onInput(e) {
		const digits = e.currentTarget.value.replace(/\D/g, '');
		e.currentTarget.value = digits;
		if (digits) value = Number(digits);
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function onBlur(e) {
		value = clamp(Number(value) || min);
		e.currentTarget.value = String(value);
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();
		bump(e.key === 'ArrowUp' ? step : -step);
	}
</script>

<div
	class="field flex items-center gap-0 px-0 max-sm:text-base focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20 {klass}"
>
	<!-- Tombol di luar urutan Tab: keyboard memakai panah atas/bawah di input. -->
	<button
		type="button"
		tabindex="-1"
		aria-label="Kurangi {label.toLowerCase()}"
		onclick={() => bump(-step)}
		disabled={value <= min}
		class="grid h-full w-8 shrink-0 place-items-center rounded-l-lg text-ink-mute hover:bg-subtle hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
	>
		<Icon name="minus" size={14} />
	</button>
	<!-- Lebar input mengikuti jumlah digit supaya akhiran (mis. %) menempel ke angkanya.
		 Label tanpa teks: klik di area kosong tetap memfokuskan input. -->
	<label class="flex h-full min-w-0 flex-1 cursor-text items-center justify-center">
		<input
			{name}
			type="text"
			inputmode="numeric"
			role="spinbutton"
			aria-label={label}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			{value}
			oninput={onInput}
			onblur={onBlur}
			onkeydown={onKeydown}
			style:width="{Math.max(1, String(value).length) + 0.15}ch"
			class="num h-full min-w-0 bg-transparent text-center focus-visible:outline-none"
		/>
		{#if suffix}<span class="text-ink-mute" aria-hidden="true">{suffix}</span>{/if}
	</label>
	<button
		type="button"
		tabindex="-1"
		aria-label="Tambah {label.toLowerCase()}"
		onclick={() => bump(step)}
		disabled={value >= max}
		class="grid h-full w-8 shrink-0 place-items-center rounded-r-lg text-ink-mute hover:bg-subtle hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
	>
		<Icon name="plus" size={14} />
	</button>
</div>
