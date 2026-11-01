<script>
	// Pengganti <input type="month">, satu gaya dengan DatePicker. Nilai "YYYY-MM" lewat
	// input hidden, kosong kalau `optional` dan belum dipilih. Dipakai tenggat goal.
	import { tick } from 'svelte';
	import Icon from './Icon.svelte';
	import Popover from './Popover.svelte';
	import { MONTHS, MONTHS_LONG, todayJakarta } from '$lib/format.js';

	/**
	 * @type {{
	 *   value?: string,
	 *   name?: string,
	 *   label: string,
	 *   min?: string,
	 *   optional?: boolean,
	 *   placeholder?: string,
	 *   clearLabel?: string,
	 *   hint?: string
	 * }}
	 */
	let {
		value = $bindable(''),
		name,
		label,
		min,
		optional = false,
		placeholder = 'Pilih bulan',
		clearLabel = 'Kosongkan',
		hint = ''
	} = $props();

	const uid = `mp-${Math.random().toString(36).slice(2, 8)}`;
	let open = $state(false);
	let current = $state(todayJakarta().slice(0, 7));
	// Bulan yang bisa difokus keyboard (roving tabindex). Tahun yang tampil ikut bulan ini.
	let focused = $state(todayJakarta().slice(0, 7));
	/** @type {HTMLDivElement | undefined} */
	let root = $state();
	/** @type {HTMLButtonElement | undefined} */
	let trigger = $state();
	/** @type {HTMLDivElement | undefined} */
	let pop = $state();

	/**
	 * Geser kunci "YYYY-MM" sebanyak `n` bulan.
	 * @param {string} key
	 * @param {number} n
	 */
	function shift(key, n) {
		const [y, m] = key.split('-').map(Number);
		const t = y * 12 + m - 1 + n;
		return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
	}
	/** @param {string} key */
	const clamp = (key) => (min && key < min ? min : key);
	/** @param {string} key */
	const isDisabled = (key) => !!min && key < min;

	const year = $derived(focused.slice(0, 4));
	const months = $derived(MONTHS.map((short, i) => ({ short, key: `${year}-${String(i + 1).padStart(2, '0')}` })));
	const prevDisabled = $derived(!!min && `${Number(year) - 1}-12` < min);
	const display = $derived(value ? `${MONTHS_LONG[Number(value.slice(5)) - 1]} ${value.slice(0, 4)}` : '');

	/** @param {string} key */
	function monthClass(key) {
		if (key === value) return 'bg-accent font-semibold text-accent-fg';
		if (isDisabled(key)) return 'text-ink-mute/40';
		return `${key === current ? 'font-semibold text-accent' : 'text-ink'} hover:bg-subtle`;
	}

	async function show() {
		current = todayJakarta().slice(0, 7);
		focused = clamp(value || current);
		open = true;
		await tick();
		focusMonth();
	}

	/** @param {boolean} [refocus] */
	function hide(refocus = true) {
		open = false;
		if (refocus) trigger?.focus();
	}

	/** @param {string} key */
	function select(key) {
		if (isDisabled(key)) return;
		value = key;
		hide();
	}

	function focusMonth() {
		pop?.querySelector(/** @type {'button'} */ (`[data-month="${focused}"]`))?.focus();
	}

	/** @param {KeyboardEvent} e */
	async function onGridKey(e) {
		/** @type {Record<string, number>} */
		const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4, PageUp: -12, PageDown: 12 };
		if (!(e.key in step)) return;
		e.preventDefault();
		focused = clamp(shift(focused, step[e.key]));
		await tick();
		focusMonth();
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		// Tanpa stopPropagation, Escape ikut menutup dialog di belakangnya.
		if (open && e.key === 'Escape') {
			e.stopPropagation();
			hide();
		}
	}
</script>

<div bind:this={root} onkeydown={onKeydown} role="presentation">
	<label for={uid} id="{uid}-label" class="label">{label}{#if hint}<span class="font-normal text-ink-mute"> {hint}</span>{/if}</label>
	{#if name}<input type="hidden" {name} {value} />{/if}
	<button
		bind:this={trigger}
		id={uid}
		type="button"
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-labelledby="{uid}-label {uid}-value"
		onclick={() => (open ? hide() : show())}
		class="field flex items-center gap-2 text-left max-sm:text-base aria-expanded:border-accent aria-expanded:ring-3 aria-expanded:ring-accent/20"
	>
		<Icon name="calendar" class="text-ink-mute" />
		<span id="{uid}-value" class="truncate {value ? '' : 'text-ink-mute'}">{display || placeholder}</span>
	</button>

	{#if open}
		<Popover
			anchor={trigger}
			scope={root}
			onclose={() => hide(false)}
			bind:el={pop}
			role="dialog"
			aria-modal="false"
			aria-label="Pilih {label.toLowerCase()}"
			tabindex="-1"
			class="w-[17rem] p-3"
		>
			<div class="mb-2 flex items-center justify-between pl-1">
				<p id="{uid}-year" class="num text-sm font-semibold" aria-live="polite">{year}</p>
				<div class="flex">
					<button
						type="button"
						class="btn btn-ghost btn-icon h-8 w-8"
						aria-label="Tahun sebelumnya"
						disabled={prevDisabled}
						onclick={() => (focused = clamp(shift(focused, -12)))}
					>
						<Icon name="chevronLeft" />
					</button>
					<button type="button" class="btn btn-ghost btn-icon h-8 w-8" aria-label="Tahun berikutnya" onclick={() => (focused = shift(focused, 12))}>
						<Icon name="chevronRight" />
					</button>
				</div>
			</div>

			<div role="grid" tabindex="-1" aria-labelledby="{uid}-year" onkeydown={onGridKey} class="space-y-1 outline-none">
				{#each [0, 1, 2] as row}
					<div role="row" class="grid grid-cols-4 gap-1">
						{#each months.slice(row * 4, row * 4 + 4) as m}
							<div role="gridcell" aria-selected={m.key === value}>
								<button
									type="button"
									data-month={m.key}
									tabindex={m.key === focused ? 0 : -1}
									aria-label="{MONTHS_LONG[Number(m.key.slice(5)) - 1]} {year}"
									aria-current={m.key === current ? 'date' : undefined}
									disabled={isDisabled(m.key)}
									onclick={() => select(m.key)}
									class="relative grid h-10 w-full place-items-center rounded-lg text-sm {monthClass(m.key)}"
								>
									{m.short}
									{#if m.key === current}
										<span class="absolute bottom-1 h-1 w-1 rounded-full bg-current" aria-hidden="true"></span>
									{/if}
								</button>
							</div>
						{/each}
					</div>
				{/each}
			</div>

			{#if optional}
				<div class="mt-2 flex border-t border-line pt-2">
					<button
						type="button"
						aria-pressed={!value}
						onclick={() => ((value = ''), hide())}
						class="btn btn-ghost h-8 px-2.5 text-[13px] aria-pressed:bg-subtle aria-pressed:text-ink"
					>
						{clearLabel}
					</button>
				</div>
			{/if}
		</Popover>
	{/if}
</div>
