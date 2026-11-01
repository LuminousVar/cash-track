<script>
	// Buat atau ubah goal. Mode ubah juga bisa mengarsipkan dan menghapus.
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Modal from './Modal.svelte';
	import GoalIcon from './GoalIcon.svelte';
	import MonthPicker from './MonthPicker.svelte';
	import { GOAL_TYPES, formatNumber, parseNumber, todayJakarta } from '$lib/format.js';
	import { GOAL_TYPE_STYLE } from '$lib/goal-style.js';
	import { GOAL_ICONS, goalIcon } from '$lib/goal-icons.js';

	/**
	 * @type {{
	 *   open: boolean,
	 *   demo?: boolean,
	 *   goal?: import('$lib/server/goals.js').Goal | null,
	 *   onclose: () => void
	 * }}
	 */
	let { open, demo = false, goal = null, onclose } = $props();

	let name = $state('');
	let type = $state(GOAL_TYPES[0]);
	let target = $state(0);
	let deadline = $state('');
	let notes = $state('');
	// Kosong = ditebak dari nama goal (goalIcon), sama seperti logo merek pada transaksi.
	let icon = $state('');
	let pickIcon = $state(false);
	let busy = $state(false);
	let error = $state('');
	let confirmDelete = $state(false);

	const isEdit = $derived(!!goal);
	const color = $derived((GOAL_TYPE_STYLE[type] ?? GOAL_TYPE_STYLE.Lainnya).color);
	const shownIcon = $derived(goalIcon({ icon, name, type }));

	$effect(() => {
		if (!open) return;
		const g = goal;
		untrack(() => {
			error = '';
			confirmDelete = false;
			name = g?.name ?? '';
			type = g?.type ?? GOAL_TYPES[0];
			target = g?.target ?? 0;
			deadline = g?.deadline?.slice(0, 7) ?? '';
			notes = g?.notes ?? '';
			icon = g?.icon ?? '';
			pickIcon = false;
		});
	});

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function onTargetInput(e) {
		const el = e.currentTarget;
		target = parseNumber(el.value);
		el.value = formatNumber(target);
	}

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function submit() {
		busy = true;
		error = '';
		return async ({ result }) => {
			busy = false;
			if (result.type === 'failure') {
				error = String(result.data?.error ?? 'Gagal menyimpan.');
				return;
			}
			onclose();
			await invalidateAll();
		};
	}
</script>

<Modal {open} {busy} {onclose} title={isEdit ? 'Ubah goal' : 'Goal baru'}>
	<form id="goal-form" method="POST" action={isEdit ? '?/update' : '?/create'} use:enhance={submit} class="space-y-4">
		{#if isEdit}<input type="hidden" name="id" value={goal?.id} />{/if}
		{#if demo}
			<p class="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">Mode demo: perubahan tidak disimpan ke Google Sheet.</p>
		{/if}
		{#if error}<p role="alert" class="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>{/if}

		<label class="block">
			<span class="label">Nama goal</span>
			<input name="name" bind:value={name} required maxlength="80" placeholder="mis. Dana darurat, Laptop baru" class="field" />
		</label>

		<fieldset>
			<legend class="label">Jenis</legend>
			<div class="grid grid-cols-2 gap-2">
				{#each GOAL_TYPES as t}
					{@const st = GOAL_TYPE_STYLE[t]}
					<label
						class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent
							{type === t ? 'border-accent bg-accent-soft text-ink' : 'border-line-strong text-ink-soft hover:bg-subtle'}"
					>
						<input type="radio" name="type" value={t} bind:group={type} class="sr-only" />
						<GoalIcon icon={st.icon} color={st.color} size={16} bare />
						{t}
					</label>
				{/each}
			</div>
		</fieldset>

		<div>
			<span class="label" id="goal-icon-label">Ikon</span>
			<input type="hidden" name="icon" value={icon} />
			<div class="flex items-center gap-3 rounded-lg border border-line-strong py-2 pl-2 pr-1.5">
				<GoalIcon icon={shownIcon} {color} size={36} />
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{GOAL_ICONS[shownIcon]?.label}</p>
					<p class="text-xs text-ink-mute">{icon ? 'Dipilih sendiri' : 'Otomatis dari nama dan jenis'}</p>
				</div>
				<button type="button" class="btn btn-ghost h-8 px-2.5 text-[13px]" aria-expanded={pickIcon} aria-controls="goal-icon-grid" onclick={() => (pickIcon = !pickIcon)}>
					{pickIcon ? 'Selesai' : 'Ganti'}
				</button>
			</div>
			{#if pickIcon}
				<div id="goal-icon-grid" role="radiogroup" aria-labelledby="goal-icon-label" class="mt-2 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
					<label
						class="col-span-2 flex h-11 cursor-pointer items-center justify-center rounded-lg border text-[13px] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent
							{icon === '' ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-soft hover:bg-subtle'}"
					>
						<input type="radio" name="icon-pick" value="" bind:group={icon} class="sr-only" />
						Otomatis
					</label>
					{#each Object.entries(GOAL_ICONS) as [key, ic]}
						<label
							title={ic.label}
							class="grid h-11 cursor-pointer place-items-center rounded-lg border transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent
								{icon === key ? 'border-accent bg-accent-soft' : 'border-line hover:bg-subtle'}"
						>
							<input type="radio" name="icon-pick" value={key} bind:group={icon} aria-label={ic.label} class="sr-only" />
							<GoalIcon icon={key} color={icon === key ? color : 'var(--color-ink-soft)'} size={20} bare />
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-3">
			<label class="col-span-2 sm:col-span-1">
				<span class="label">Target</span>
				<div class="relative">
					<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">Rp</span>
					<input name="target" inputmode="numeric" value={formatNumber(target)} oninput={onTargetInput} required class="field num pl-9" />
				</div>
			</label>
			<div class="col-span-2 sm:col-span-1">
				<MonthPicker
					name="deadline"
					label="Tenggat"
					hint="(opsional)"
					bind:value={deadline}
					min={todayJakarta().slice(0, 7)}
					optional
					placeholder="Tanpa tenggat"
					clearLabel="Tanpa tenggat"
				/>
			</div>
		</div>

		<label class="block">
			<span class="label">Catatan <span class="font-normal text-ink-mute">(opsional)</span></span>
			<textarea name="notes" bind:value={notes} rows="2" maxlength="300" class="field resize-none"></textarea>
		</label>
	</form>

	{#snippet footer()}
		{#if isEdit && !demo}
			{#if confirmDelete}
				<form method="POST" action="?/delete" use:enhance={submit} class="mr-auto flex items-center gap-2">
					<input type="hidden" name="id" value={goal?.id} />
					<button class="btn btn-danger" disabled={busy}>Hapus beserta riwayat</button>
					<button type="button" class="btn btn-ghost" onclick={() => (confirmDelete = false)}>Batal</button>
				</form>
			{:else}
				<form method="POST" action="?/archive" use:enhance={submit} class="mr-auto">
					<input type="hidden" name="id" value={goal?.id} />
					<input type="hidden" name="archived" value={goal?.archived ? '0' : '1'} />
					<button class="btn btn-ghost" disabled={busy}>{goal?.archived ? 'Aktifkan lagi' : 'Arsipkan'}</button>
				</form>
				<button type="button" class="btn btn-ghost text-danger" onclick={() => (confirmDelete = true)}>Hapus</button>
			{/if}
		{:else}
			<span class="mr-auto"></span>
		{/if}
		{#if !confirmDelete}
			<button type="submit" form="goal-form" class="btn btn-primary" disabled={busy || !name.trim() || target <= 0}>
				{busy ? 'Menyimpan...' : 'Simpan'}
			</button>
		{/if}
	{/snippet}
</Modal>
