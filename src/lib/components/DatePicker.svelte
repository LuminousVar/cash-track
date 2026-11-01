<script>
	// Pengganti <input type="date">: tombol bergaya .field dan kalender popover.
	// Nilai tetap "YYYY-MM-DD" lewat input hidden, jadi action form tidak berubah.
	// Semua hitungan tanggal di UTC supaya tidak bergeser karena zona waktu.
	import { tick } from 'svelte';
	import Icon from './Icon.svelte';
	import { MONTHS_LONG, addDays, daysBetween, formatDay, formatDayMonth, todayJakarta } from '$lib/format.js';

	/**
	 * @type {{
	 *   value?: string,
	 *   name?: string,
	 *   label: string,
	 *   max?: string
	 * }}
	 */
	let { value = $bindable(''), name, label, max } = $props();

	// Minggu di kolom pertama, mengikuti kalender Indonesia.
	const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
	const WEEKDAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

	const uid = `dp-${Math.random().toString(36).slice(2, 8)}`;
	let open = $state(false);
	let today = $state(todayJakarta());
	// Hari yang bisa difokus keyboard (roving tabindex). Bulan yang tampil ikut hari ini.
	let focused = $state(todayJakarta());
	let top = $state(0);
	let left = $state(0);
	/** @type {HTMLDivElement | undefined} */
	let root = $state();
	/** @type {HTMLButtonElement | undefined} */
	let trigger = $state();
	/** @type {HTMLDivElement | undefined} */
	let pop = $state();

	/** @param {string} iso */
	const weekday = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay();
	/** @param {string} iso */
	const clamp = (iso) => (max && iso > max ? max : iso);
	/** @param {string} iso */
	const isDisabled = (iso) => !!max && iso > max;

	/**
	 * Geser `n` bulan dengan hari dipotong ke akhir bulan (31 Jan + 1 bulan = 28/29 Feb).
	 * @param {string} iso
	 * @param {number} n
	 */
	function addMonths(iso, n) {
		const [y, m, d] = iso.split('-').map(Number);
		const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
		return new Date(Date.UTC(y, m - 1 + n, Math.min(d, last))).toISOString().slice(0, 10);
	}

	const view = $derived(focused.slice(0, 7));
	const viewLabel = $derived(`${MONTHS_LONG[Number(view.slice(5)) - 1]} ${view.slice(0, 4)}`);
	// Selalu 6 minggu supaya tinggi popover tidak melompat antar bulan.
	const weeks = $derived.by(() => {
		const first = `${view}-01`;
		const start = addDays(first, -weekday(first));
		return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
	});
	const nextDisabled = $derived(!!max && addMonths(`${view}-01`, 1).slice(0, 7) > max.slice(0, 7));

	// Hari ini dan kemarin cukup kata relatif, tahun hanya ditulis kalau bukan tahun ini.
	const display = $derived.by(() => {
		if (!value) return '';
		const ago = daysBetween(value, today);
		if (ago === 0) return `Hari ini, ${formatDayMonth(value)}`;
		if (ago === 1) return `Kemarin, ${formatDayMonth(value)}`;
		const year = value.slice(0, 4) === today.slice(0, 4) ? '' : ` ${value.slice(0, 4)}`;
		return `${WEEKDAYS[weekday(value)]}, ${formatDayMonth(value)}${year}`;
	});

	/** @param {string} day */
	function dayClass(day) {
		if (day === value) return 'bg-accent font-semibold text-accent-fg';
		if (isDisabled(day)) return 'text-ink-mute/40';
		const tone = day === today ? 'font-semibold text-accent' : day.slice(0, 7) !== view ? 'text-ink-mute' : 'text-ink';
		return `${tone} hover:bg-subtle`;
	}

	const quick = $derived([
		{ label: 'Hari ini', date: today },
		{ label: 'Kemarin', date: addDays(today, -1) }
	]);

	async function show() {
		today = todayJakarta();
		focused = clamp(value || today);
		open = true;
		await tick();
		focusDay();
	}

	/** @param {boolean} [refocus] */
	function hide(refocus = true) {
		open = false;
		if (refocus) trigger?.focus();
	}

	/** @param {string} iso */
	function select(iso) {
		if (isDisabled(iso)) return;
		value = iso;
		hide();
	}

	function focusDay() {
		pop?.querySelector(/** @type {'button'} */ (`[data-date="${focused}"]`))?.focus();
	}

	/** @param {string} iso */
	async function moveTo(iso) {
		focused = clamp(iso);
		await tick();
		focusDay();
	}

	/** @param {KeyboardEvent} e */
	function onGridKey(e) {
		const d = focused;
		/** @type {Record<string, () => string>} */
		const keys = {
			ArrowLeft: () => addDays(d, -1),
			ArrowRight: () => addDays(d, 1),
			ArrowUp: () => addDays(d, -7),
			ArrowDown: () => addDays(d, 7),
			Home: () => addDays(d, -weekday(d)),
			End: () => addDays(d, 6 - weekday(d)),
			PageUp: () => addMonths(d, e.shiftKey ? -12 : -1),
			PageDown: () => addMonths(d, e.shiftKey ? 12 : 1)
		};
		const next = keys[e.key];
		if (!next) return;
		e.preventDefault();
		moveTo(next());
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		// Tanpa stopPropagation, Escape ikut menutup dialog di belakangnya.
		if (open && e.key === 'Escape') {
			e.stopPropagation();
			hide();
		}
	}

	/** @param {Event} e */
	function onOutside(e) {
		if (open && !root?.contains(/** @type {Node} */ (e.target))) hide(false);
	}

	// Popover fixed supaya tidak terpotong area scroll dialog. Di bawah tombol kalau
	// muat, kalau tidak di atasnya, dan selalu di dalam layar.
	function place() {
		if (!trigger || !pop) return;
		const r = trigger.getBoundingClientRect();
		const gap = 6;
		const edge = 8;
		const h = pop.offsetHeight;
		const below = r.bottom + gap + h <= window.innerHeight - edge || r.top - gap - h < edge;
		top = below ? r.bottom + gap : r.top - gap - h;
		left = Math.max(edge, Math.min(r.left, window.innerWidth - pop.offsetWidth - edge));
	}

	$effect(() => {
		if (!open || !pop) return;
		place();
		window.addEventListener('resize', place);
		window.addEventListener('scroll', place, true);
		return () => {
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', place, true);
		};
	});
</script>

<svelte:window onpointerdown={onOutside} onfocusin={onOutside} />

<div bind:this={root} onkeydown={onKeydown} role="presentation">
	<label for={uid} id="{uid}-label" class="label">{label}</label>
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
		<span id="{uid}-value" class="truncate {value ? '' : 'text-ink-mute'}">{display || 'Pilih tanggal'}</span>
	</button>

	{#if open}
		<div
			bind:this={pop}
			role="dialog"
			aria-modal="false"
			aria-label="Pilih {label.toLowerCase()}"
			tabindex="-1"
			style="top: {top}px; left: {left}px"
			class="fixed z-10 w-max rounded-xl border border-line bg-surface p-3 shadow-lg outline-none"
		>
			<div class="mb-1 flex items-center justify-between pl-1">
				<p id="{uid}-month" class="text-sm font-semibold" aria-live="polite">{viewLabel}</p>
				<div class="flex">
					<button type="button" class="btn btn-ghost btn-icon h-8 w-8" aria-label="Bulan sebelumnya" onclick={() => (focused = addMonths(focused, -1))}>
						<Icon name="chevronLeft" />
					</button>
					<button
						type="button"
						class="btn btn-ghost btn-icon h-8 w-8"
						aria-label="Bulan berikutnya"
						disabled={nextDisabled}
						onclick={() => (focused = clamp(addMonths(focused, 1)))}
					>
						<Icon name="chevronRight" />
					</button>
				</div>
			</div>

			<div role="grid" tabindex="-1" aria-labelledby="{uid}-month" onkeydown={onGridKey} class="outline-none">
				<div role="row" class="grid grid-cols-7">
					{#each WEEKDAYS as d, i}
						<span role="columnheader" aria-label={WEEKDAYS_LONG[i]} class="grid h-8 place-items-center text-xs font-medium text-ink-mute">{d}</span>
					{/each}
				</div>
				{#each weeks as week}
					<div role="row" class="grid grid-cols-7 gap-y-0.5">
						{#each week as day}
							<div role="gridcell" aria-selected={day === value}>
								<button
									type="button"
									data-date={day}
									tabindex={day === focused ? 0 : -1}
									aria-label={formatDay(day)}
									aria-current={day === today ? 'date' : undefined}
									disabled={isDisabled(day)}
									onclick={() => select(day)}
									class="num relative grid h-9 w-9 place-items-center rounded-lg text-sm {dayClass(day)}"
								>
									{Number(day.slice(8))}
									{#if day === today}
										<span class="absolute bottom-1 h-1 w-1 rounded-full bg-current" aria-hidden="true"></span>
									{/if}
								</button>
							</div>
						{/each}
					</div>
				{/each}
			</div>

			<div class="mt-2 flex gap-1 border-t border-line pt-2">
				{#each quick as q}
					<button
						type="button"
						aria-pressed={value === q.date}
						onclick={() => select(q.date)}
						class="btn btn-ghost h-8 px-2.5 text-[13px] aria-pressed:bg-subtle aria-pressed:text-ink"
					>
						{q.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
