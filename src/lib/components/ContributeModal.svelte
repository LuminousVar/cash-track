<script>
	// Setor ke atau tarik dari sebuah goal, dengan pratinjau progres sesudahnya.
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Modal from './Modal.svelte';
	import { formatRp, formatNumber, parseNumber, todayJakarta } from '$lib/format.js';

	/**
	 * @type {{
	 *   goal: import('$lib/server/goals.js').Goal | null,
	 *   kind: 'deposit' | 'withdraw',
	 *   demo?: boolean,
	 *   onclose: () => void
	 * }}
	 */
	let { goal, kind = 'deposit', demo = false, onclose } = $props();

	let mode = $state(/** @type {'deposit' | 'withdraw'} */ ('deposit'));
	let amount = $state(0);
	let date = $state(todayJakarta());
	let note = $state('');
	let busy = $state(false);
	let error = $state('');

	$effect(() => {
		if (!goal) return;
		const k = kind;
		untrack(() => {
			mode = k;
			// Setor: tawarkan jatah per bulan kalau ada, supaya cukup satu klik.
			amount = k === 'deposit' ? (goal?.perMonth ?? 0) : 0;
			date = todayJakarta();
			note = '';
			error = '';
		});
	});

	const after = $derived(goal ? goal.saved + (mode === 'withdraw' ? -amount : amount) : 0);
	const afterPct = $derived(goal && goal.target > 0 ? Math.max(0, Math.min(100, Math.round((after / goal.target) * 100))) : 0);
	const tooMuch = $derived(!!goal && mode === 'withdraw' && amount > goal.saved);

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function onAmountInput(e) {
		const el = e.currentTarget;
		amount = parseNumber(el.value);
		el.value = formatNumber(amount);
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

<Modal open={!!goal} {busy} {onclose} title={goal ? goal.name : ''}>
	{#if goal}
		<form id="contribute-form" method="POST" action="?/contribute" use:enhance={submit} class="space-y-4">
			<input type="hidden" name="id" value={goal.id} />
			<input type="hidden" name="kind" value={mode} />
			{#if demo}
				<p class="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">Mode demo: perubahan tidak disimpan ke Google Sheet.</p>
			{/if}
			{#if error}<p role="alert" class="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>{/if}

			<div class="grid grid-cols-2 rounded-lg bg-subtle p-1 text-sm font-medium" role="group" aria-label="Jenis catatan">
				{#each [['deposit', 'Setor'], ['withdraw', 'Tarik']] as [m, label]}
					<button
						type="button"
						aria-pressed={mode === m}
						onclick={() => (mode = /** @type {'deposit' | 'withdraw'} */ (m))}
						class="rounded-md py-1.5 transition-colors {mode === m ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink'}"
					>
						{label}
					</button>
				{/each}
			</div>

			<label class="block">
				<span class="label">Nominal</span>
				<div class="relative">
					<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">Rp</span>
					<input name="amount" inputmode="numeric" value={formatNumber(amount)} oninput={onAmountInput} required class="field num pl-9 text-lg font-semibold" />
				</div>
				{#if mode === 'deposit' && goal.perMonth}
					<span class="mt-1.5 block text-xs text-ink-mute">Jatah per bulan supaya tepat tenggat: {formatRp(goal.perMonth)}</span>
				{/if}
				{#if tooMuch}
					<span class="mt-1.5 block text-xs text-warn">Melebihi yang terkumpul ({formatRp(goal.saved)}).</span>
				{/if}
			</label>

			<div class="grid grid-cols-2 gap-3">
				<label>
					<span class="label">Tanggal</span>
					<input type="date" name="date" bind:value={date} class="field" />
				</label>
				<label>
					<span class="label">Catatan <span class="font-normal text-ink-mute">(opsional)</span></span>
					<input name="note" bind:value={note} maxlength="200" class="field" />
				</label>
			</div>

			<div class="rounded-lg border border-line p-3">
				<div class="flex items-baseline justify-between text-xs text-ink-mute">
					<span>Sesudahnya</span>
					<span class="num"><span class="font-semibold text-ink">{formatRp(Math.max(0, after))}</span> dari {formatRp(goal.target)}</span>
				</div>
				<div class="relative mt-2 h-2 overflow-hidden rounded-full bg-subtle">
					<!-- Pudar = selisih antara sekarang dan sesudahnya, pekat = yang tetap terkumpul. -->
					<div class="absolute inset-y-0 left-0 rounded-full bg-accent/35 transition-all duration-300" style="width: {Math.max(goal.pct, afterPct)}%"></div>
					<div class="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-300" style="width: {Math.min(goal.pct, afterPct)}%"></div>
				</div>
				<p class="num mt-1.5 text-right text-xs text-ink-soft">{goal.pct}% jadi {afterPct}%</p>
			</div>
		</form>
	{/if}

	{#snippet footer()}
		<button type="button" class="btn btn-ghost mr-auto" onclick={onclose}>Batal</button>
		<button type="submit" form="contribute-form" class="btn btn-primary" disabled={busy || amount <= 0 || tooMuch}>
			{busy ? 'Menyimpan...' : mode === 'deposit' ? 'Simpan setoran' : 'Simpan penarikan'}
		</button>
	{/snippet}
</Modal>
