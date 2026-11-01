<script>
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import BudgetStatus from '$lib/components/BudgetStatus.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import { formatNumber, parseNumber } from '$lib/format.js';
	import { toast } from '$lib/toast.svelte.js';

	let { data, form } = $props();

	let saving = $state(false);
	let budgetRaw = $state(untrack(() => data.budget));
	let warnPct = $state(untrack(() => data.warnPct));

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
			<p class="mt-0.5 text-sm text-ink-mute">Berlaku untuk setiap periode.</p>
		</div>

		<form
			method="POST"
			action="?/save"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					saving = false;
					if (result.type === 'success') toast('Pengaturan anggaran disimpan.');
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

			<div>
				<span class="label" aria-hidden="true">Peringatan saat mencapai</span>
				<Stepper name="BUDGET_WARN_PCT" label="Peringatan saat mencapai" bind:value={warnPct} min={1} max={99} step={5} suffix="%" />
				<span class="mt-1.5 block text-xs text-ink-mute">Peringatan kedua dikirim saat melewati 100%.</span>
			</div>

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

			<label class="flex cursor-pointer items-start gap-3 sm:col-span-3">
				<!-- Checkbox asli (tetap terkirim bersama form), tampil sebagai switch. -->
				<input type="checkbox" role="switch" name="DAILY_SUMMARY" checked={data.dailySummary} class="peer sr-only" />
				<span
					aria-hidden="true"
					class="relative mt-px h-5 w-9 shrink-0 rounded-full bg-line-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
				></span>
				<span>
					<span class="block text-sm font-medium">Kirim ringkasan harian ke Telegram</span>
					<span class="mt-0.5 block text-xs {data.cronReady ? 'text-ink-mute' : 'text-warn'}">
						{#if data.cronReady}
							Setiap malam sekitar pukul 20.00 WIB: total hari ini, sisa anggaran, dan jatah per hari sampai gajian.
						{:else}
							Belum aktif: isi <code>CRON_SECRET</code> di Environment Variables.
						{/if}
					</span>
				</span>
			</label>

			<div class="flex flex-wrap items-center gap-3 sm:col-span-3">
				<button type="submit" disabled={saving} class="btn btn-primary">{saving ? 'Menyimpan…' : 'Simpan'}</button>
				{#if form?.error}<p role="alert" class="text-sm text-danger">{form.error}</p>{/if}
			</div>
		</form>
	</section>
</div>
