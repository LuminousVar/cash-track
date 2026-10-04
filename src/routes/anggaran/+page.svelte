<script>
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import BudgetStatus from '$lib/components/BudgetStatus.svelte';
	import { formatNumber, parseNumber } from '$lib/format.js';

	let { data, form } = $props();

	let saving = $state(false);
	let budgetRaw = $state(untrack(() => data.budget));

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function onBudgetInput(e) {
		const el = e.currentTarget;
		const raw = parseNumber(el.value);
		budgetRaw = raw;
		const pos = el.selectionStart ?? 0;
		const oldLen = el.value.length;
		el.value = formatNumber(raw);
		const next = Math.max(0, pos + el.value.length - oldLen);
		el.setSelectionRange(next, next);
	}
</script>

<PageHeader title="Anggaran" description="Batas pengeluaran per periode gajian dan peringatan lewat Telegram." />

<div class="mt-6 space-y-6">
	<BudgetStatus spent={data.summary.thisMonth} budget={data.budget} warnPct={data.warnPct} cycle={data.summary.cycle} />

	<section class="card" aria-labelledby="settings-heading">
		<div class="border-b border-line px-5 py-4">
			<h2 id="settings-heading" class="text-sm font-semibold">Pengaturan anggaran</h2>
			<p class="mt-0.5 text-sm text-ink-mute">
				Berlaku untuk setiap periode.
				{#if data.isVercel}Di Vercel nilai ini bisa kembali ke Environment Variables saat server restart. Untuk nilai permanen, ubah <code class="text-ink-soft">MONTHLY_BUDGET</code> dan <code class="text-ink-soft">BUDGET_WARN_PCT</code> di Vercel.{/if}
			</p>
		</div>

		<form
			method="POST"
			action="?/save"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update({ reset: false });
					saving = false;
				};
			}}
			class="grid gap-5 p-5 sm:grid-cols-3"
		>
			<label>
				<span class="label">Target per periode</span>
				<div class="relative">
					<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">Rp</span>
					<input type="text" inputmode="numeric" value={formatNumber(data.budget)} oninput={onBudgetInput} required class="field num pl-9" />
				</div>
				<input type="hidden" name="MONTHLY_BUDGET" value={budgetRaw} />
			</label>

			<label>
				<span class="label">Peringatan saat mencapai</span>
				<div class="relative">
					<input name="BUDGET_WARN_PCT" type="number" min="1" max="99" value={data.warnPct} required class="field num pr-8" />
					<span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">%</span>
				</div>
				<span class="mt-1.5 block text-xs text-ink-mute">Peringatan kedua dikirim saat melewati 100%.</span>
			</label>

			<label>
				<span class="label">Kirim ke ID Telegram</span>
				<input name="BUDGET_NOTIFY_CHAT_ID" inputmode="numeric" value={data.notifyChatId} placeholder={data.firstAllowedId || 'mis. 12345678'} class="field num" />
				<span class="mt-1.5 block text-xs {!data.notifyChatId && !data.firstAllowedId ? 'text-warn' : 'text-ink-mute'}">
					{#if data.notifyChatId}
						Peringatan dikirim ke ID ini.
					{:else if data.firstAllowedId}
						Kosong: dikirim ke {data.firstAllowedId}, ID pertama di whitelist.
					{:else}
						Isi agar peringatan bisa dikirim.
					{/if}
				</span>
			</label>

			<div class="flex flex-wrap items-center gap-3 sm:col-span-3">
				<button type="submit" disabled={saving} class="btn btn-primary">{saving ? 'Menyimpan…' : 'Simpan'}</button>
				{#if form?.success}<p role="status" class="text-sm text-success">Tersimpan.</p>{/if}
				{#if form?.error}<p role="alert" class="text-sm text-danger">{form.error}</p>{/if}
			</div>
		</form>
	</section>
</div>
