<script>
	// Pengganti <select>: tombol bergaya .field dan daftar mengambang (pola select-only
	// combobox WAI-ARIA). Fokus tetap di tombol, opsi aktif lewat aria-activedescendant,
	// jadi panah, Home/End, Enter, Escape, dan ketik huruf awal bekerja seperti <select>.
	// Nilai dikirim lewat input hidden kalau `name` diisi.
	import Icon from './Icon.svelte';
	import Popover from './Popover.svelte';

	/**
	 * @type {{
	 *   value?: string,
	 *   options: { value: string, label: string, hint?: string }[],
	 *   label: string,
	 *   hideLabel?: boolean,
	 *   name?: string,
	 *   placeholder?: string,
	 *   disabled?: boolean,
	 *   class?: string,
	 *   icon?: import('svelte').Snippet<[string]>
	 * }}
	 */
	let {
		value = $bindable(''),
		options,
		label,
		hideLabel = false,
		name,
		placeholder = 'Pilih',
		disabled = false,
		class: klass = '',
		icon
	} = $props();

	const uid = `sel-${Math.random().toString(36).slice(2, 8)}`;
	let open = $state(false);
	let active = $state(0);
	/** @type {HTMLDivElement | undefined} */
	let root = $state();
	/** @type {HTMLButtonElement | undefined} */
	let trigger = $state();
	/** @type {HTMLDivElement | undefined} */
	let list = $state();
	// Ketik huruf awal untuk lompat ke opsi; huruf yang diketik cepat digabung.
	let typed = '';
	let typedAt = 0;

	const selected = $derived(options.find((o) => o.value === value));

	function show() {
		if (disabled || !options.length) return;
		active = Math.max(0, options.findIndex((o) => o.value === value));
		open = true;
	}

	/** @param {number} i */
	function choose(i) {
		value = options[i].value;
		open = false;
		trigger?.focus();
	}

	/** @param {string} ch */
	function typeahead(ch) {
		const now = Date.now();
		typed = (now - typedAt > 700 ? '' : typed) + ch.toLowerCase();
		typedAt = now;
		const i = options.findIndex((o) => o.label.toLowerCase().startsWith(typed));
		if (i >= 0) active = i;
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		const last = options.length - 1;
		const typing = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
		if (!open) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
				e.preventDefault();
				show();
			} else if (typing) {
				show();
				typeahead(e.key);
			}
			return;
		}
		/** @type {Record<string, number>} */
		const moves = {
			ArrowDown: Math.min(last, active + 1),
			ArrowUp: Math.max(0, active - 1),
			Home: 0,
			End: last,
			PageDown: Math.min(last, active + 8),
			PageUp: Math.max(0, active - 8)
		};
		if (e.key in moves) {
			e.preventDefault();
			active = moves[e.key];
		} else if (e.key === 'Enter' || (e.key === ' ' && Date.now() - typedAt > 700)) {
			e.preventDefault();
			choose(active);
		} else if (e.key === 'Escape') {
			// Tanpa stopPropagation, Escape ikut menutup dialog di belakangnya.
			e.stopPropagation();
			open = false;
		} else if (e.key === 'Tab') {
			open = false;
		} else if (typing) {
			e.preventDefault();
			typeahead(e.key);
		}
	}

	// Opsi aktif selalu terlihat saat digulir dengan keyboard.
	$effect(() => {
		if (open && list) list.querySelector(`#${uid}-${active}`)?.scrollIntoView({ block: 'nearest' });
	});
</script>

<div bind:this={root} class={klass}>
	<label for={uid} id="{uid}-label" class={hideLabel ? 'sr-only' : 'label'}>{label}</label>
	{#if name}<input type="hidden" {name} {value} />{/if}
	<button
		bind:this={trigger}
		id={uid}
		type="button"
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls="{uid}-list"
		aria-labelledby="{uid}-label {uid}-value"
		aria-activedescendant={open ? `${uid}-${active}` : undefined}
		{disabled}
		onclick={() => (open ? (open = false) : show())}
		onkeydown={onKeydown}
		class="field flex items-center gap-2 text-left max-sm:text-base disabled:opacity-60 aria-expanded:border-accent aria-expanded:ring-3 aria-expanded:ring-accent/20"
	>
		{#if selected && icon}{@render icon(selected.value)}{/if}
		<span id="{uid}-value" class="min-w-0 flex-1 truncate {selected ? '' : 'text-ink-mute'}">
			{selected?.label ?? placeholder}{#if selected?.hint}<span class="text-ink-mute">, {selected.hint}</span>{/if}
		</span>
		<Icon name="chevronDown" class="text-ink-mute transition-transform {open ? 'rotate-180' : ''}" />
	</button>

	{#if open}
		<Popover
			anchor={trigger}
			scope={root}
			onclose={() => (open = false)}
			matchWidth
			bind:el={list}
			id="{uid}-list"
			role="listbox"
			aria-labelledby="{uid}-label"
			class="max-h-[min(22rem,60vh)] w-max max-w-[calc(100vw-16px)] overflow-y-auto p-1 [scrollbar-gutter:stable]"
		>
			{#each options as o, i}
				<!-- Opsi tidak difokus (aria-activedescendant), keyboard ditangani tombol. pointerdown
					 dicegah supaya fokus tidak pindah dari tombol, termasuk di Safari. -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					id="{uid}-{i}"
					role="option"
					tabindex="-1"
					aria-selected={o.value === value}
					onpointerdown={(e) => e.preventDefault()}
					onpointermove={() => (active = i)}
					onclick={() => choose(i)}
					class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm {i === active ? 'bg-subtle' : ''}"
				>
					{#if icon}{@render icon(o.value)}{/if}
					<span class="min-w-0 flex-1 truncate {o.value === value ? 'font-medium' : ''}">
						{o.label}{#if o.hint}<span class="ml-2 text-xs font-normal text-ink-mute">{o.hint}</span>{/if}
					</span>
					<Icon name="check" size={15} strokeWidth={2.25} class="text-accent {o.value === value ? '' : 'invisible'}" />
				</div>
			{/each}
		</Popover>
	{/if}
</div>
