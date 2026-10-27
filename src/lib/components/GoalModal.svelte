<script>
	// Buat atau ubah goal. Mode ubah juga bisa mengarsipkan dan menghapus.
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import { GOAL_TYPES, formatNumber, parseNumber } from '$lib/format.js';
	import { GOAL_TYPE_STYLE } from '$lib/goal-style.js';

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
	let busy = $state(false);
	let error = $state('');
	let confirmDelete = $state(false);

	const isEdit = $derived(!!goal);

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
						class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors
							{type === t ? 'border-accent bg-accent-soft text-ink' : 'border-line-strong text-ink-soft hover:bg-subtle'}"
					>
						<input type="radio" name="type" value={t} bind:group={type} class="sr-only" />
						<span style="color: {st.color}"><Icon name={st.icon} size={16} /></span>
						{t}
					</label>
				{/each}
			</div>
		</fieldset>

		<div class="grid grid-cols-2 gap-3">
			<label class="col-span-2 sm:col-span-1">
				<span class="label">Target</span>
				<div class="relative">
					<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">Rp</span>
					<input name="target" inputmode="numeric" value={formatNumber(target)} oninput={onTargetInput} required class="field num pl-9" />
				</div>
			</label>
			<label class="col-span-2 sm:col-span-1">
				<span class="label">Tenggat <span class="font-normal text-ink-mute">(opsional)</span></span>
				<input type="month" name="deadline" bind:value={deadline} class="field" />
			</label>
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
