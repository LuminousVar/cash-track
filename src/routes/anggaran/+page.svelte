<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { enhance } from '$app/forms';
	import { formatRp } from '$lib/format.js';
	import { untrack } from 'svelte';

	let { data, form } = $props();

	const pct = $derived(data.summary.budgetPct);
	const remaining = $derived(Math.max(0, data.budget - data.summary.thisMonth));
	const exceeded = $derived(pct >= 100);
	const warning = $derived(!exceeded && pct >= data.warnPct);

	const statusLabel = $derived(exceeded ? 'Melebihi Budget' : warning ? 'Peringatan' : 'Aman');
	const statusBg = $derived(
		exceeded
			? 'bg-[#fef2f2] text-[#dc2626]'
			: warning
				? 'bg-warn-bg text-warn'
				: 'bg-success-bg text-success'
	);
	const barColor = $derived(
		exceeded
			? 'linear-gradient(to right, #dc2626, #ef4444)'
			: warning
				? 'linear-gradient(to right, var(--color-warn), #e0a838)'
				: 'linear-gradient(to right, var(--color-forest-700), var(--color-lime-400))'
	);

	let saving = $state(false);

	/** @param {number} n @returns {string} */
	function fmtNum(n) {
		return n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
	}
	/** @param {string} s @returns {number} */
	function parseNum(s) {
		return Number(s.replace(/[^\d]/g, '')) || 0;
	}
	let budgetRaw = $state(untrack(() => data.budget));
	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function onBudgetInput(e) {
		const raw = parseNum(e.currentTarget.value);
		budgetRaw = raw;
		const pos = e.currentTarget.selectionStart ?? 0;
		const oldLen = e.currentTarget.value.length;
		e.currentTarget.value = fmtNum(raw);
		const diff = e.currentTarget.value.length - oldLen;
		e.currentTarget.setSelectionRange(pos + diff, pos + diff);
	}
</script>

<PageHeader title="Anggaran Bulanan" subtitle="Pantau dan kelola batas pengeluaran bulanan." />

{#if form?.success}
	<div class="mt-4 rounded-xl bg-success-bg px-4 py-3 text-sm font-semibold text-success">
		Pengaturan anggaran berhasil disimpan.
	</div>
{/if}
{#if form?.error}
	<div class="mt-4 rounded-xl bg-warn-bg px-4 py-3 text-sm font-semibold text-warn">{form.error}</div>
{/if}

<!-- Stat cards -->
<section class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
	<article class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Pengeluaran Bulan Ini</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(data.summary.thisMonth)}</p>
		<span class="mt-2 inline-block rounded-lg px-2.5 py-1 text-xs font-semibold {statusBg}">{statusLabel}</span>
	</article>
	<article class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Target Anggaran</p>
		<p class="num mt-2 text-2xl font-extrabold">{formatRp(data.budget)}</p>
		<p class="mt-2 text-xs text-ink-mute">Batas pengeluaran per bulan</p>
	</article>
	<article class="rounded-card bg-surface p-5">
		<p class="text-sm font-semibold text-ink-soft">Sisa Anggaran</p>
		<p class="num mt-2 text-2xl font-extrabold {exceeded ? 'text-[#dc2626]' : ''}">{exceeded ? '−' : ''}{formatRp(exceeded ? data.summary.thisMonth - data.budget : remaining)}</p>
		<p class="mt-2 text-xs text-ink-mute">{data.daysLeft} hari tersisa bulan ini</p>
	</article>
</section>

<!-- Progress card -->
<section class="mt-5 rounded-card bg-surface p-5">
	<div class="flex items-center justify-between">
		<span class="text-sm font-semibold">Progres Anggaran</span>
		<span class="num text-sm font-bold {exceeded ? 'text-[#dc2626]' : warning ? 'text-warn' : 'text-forest-600'}">{pct}%</span>
	</div>

	<!-- Progress bar -->
	<div class="relative mt-4">
		<div class="h-4 overflow-hidden rounded-full bg-canvas">
			<div
				class="h-full rounded-full transition-all duration-700"
				style="width:{Math.min(100, pct)}%; background:{barColor}"
			></div>
		</div>
		<!-- Marker threshold peringatan -->
		{#if data.warnPct < 100}
			<div
				class="pointer-events-none absolute top-0 h-4 border-l-2 border-dashed border-forest-700/40"
				style="left:{data.warnPct}%"
			>
				<span class="absolute top-5 -translate-x-1/2 whitespace-nowrap text-[10px] text-ink-mute">
					{data.warnPct}%
				</span>
			</div>
		{/if}
	</div>

	<div class="mt-6 flex justify-between text-xs text-ink-mute">
		<span>Rp 0</span>
		<span class="num">{formatRp(data.budget)}</span>
	</div>

	<!-- Proyeksi akhir bulan -->
	<div class="mt-4 flex flex-wrap gap-3">
		<span class="rounded-lg bg-canvas px-3 py-1.5 text-xs text-ink-soft">
			Proyeksi akhir bulan:
			<span class="num font-semibold text-ink">{formatRp(data.projected)}</span>
		</span>
		<span class="rounded-lg bg-canvas px-3 py-1.5 text-xs text-ink-soft">
			Rata-rata harian:
			<span class="num font-semibold text-ink">{formatRp(data.summary.dailyAvg)}</span>
		</span>
	</div>
</section>

<!-- 2-col: settings + history -->
<section class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

	<!-- Form pengaturan -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Pengaturan Anggaran</span>
		<p class="mt-1 text-xs text-ink-mute">Perubahan langsung aktif tanpa restart.</p>

		<form
			method="POST"
			action="?/save"
			use:enhance={() => {
				saving = true;
				return ({ update }) => { saving = false; update(); };
			}}
			class="mt-4 space-y-4"
		>
			<!-- Budget amount -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-ink-soft">Target Anggaran (Rp)</span>
				<input
					type="text"
					inputmode="numeric"
					value={fmtNum(data.budget)}
					placeholder="Contoh: 9,500,000"
					oninput={onBudgetInput}
					class="num rounded-xl bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line placeholder:text-ink-mute focus:ring-2 focus:ring-lime-400"
				/>
				<input type="hidden" name="MONTHLY_BUDGET" value={budgetRaw} />
			</div>

			<!-- Warn threshold -->
			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-ink-soft">Kirim peringatan saat mencapai (%)</span>
				<div class="flex items-center gap-3">
					<input
						name="BUDGET_WARN_PCT"
						type="number"
						min="1"
						max="99"
						value={data.warnPct}
						class="w-24 rounded-xl bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line focus:ring-2 focus:ring-lime-400"
					/>
					<span class="text-sm text-ink-soft">% dari budget</span>
				</div>
				<p class="text-[11px] text-ink-mute">Notif pertama dikirim saat pemakaian menyentuh batas ini, lalu sekali lagi saat 100%.</p>
			</label>

			<!-- Telegram chat ID -->
			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-ink-soft">Kirim notifikasi ke ID Telegram</span>
				<input
					name="BUDGET_NOTIFY_CHAT_ID"
					type="text"
					value={data.notifyChatId}
					placeholder={data.firstAllowedId || 'ID Telegram kamu, mis. 12345678'}
					class="rounded-xl bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line placeholder:text-ink-mute focus:ring-2 focus:ring-lime-400"
				/>
				{#if !data.notifyChatId && data.firstAllowedId}
					<p class="text-[11px] text-ink-mute">Kosong = otomatis pakai <span class="font-mono text-ink">{data.firstAllowedId}</span> (ID pertama di whitelist).</p>
				{:else if !data.notifyChatId && !data.firstAllowedId}
					<p class="text-[11px] text-warn">Isi ID Telegram kamu agar notifikasi bisa dikirim.</p>
				{/if}
			</label>

			<button
				type="submit"
				disabled={saving}
				class="flex items-center gap-2 rounded-xl bg-lime-500 px-5 py-2.5 text-sm font-bold text-forest-900 shadow-sm transition hover:bg-lime-400 disabled:opacity-60"
			>
				{#if saving}
					<svg class="animate-spin" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
					Menyimpan…
				{:else}
					Simpan
				{/if}
			</button>
		</form>
	</article>

	<!-- Riwayat 12 bulan -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Riwayat Bulanan</span>
		<p class="mt-1 text-xs text-ink-mute">Perbandingan pengeluaran vs anggaran per bulan.</p>

		<div class="mt-4 overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-line text-left text-xs font-semibold text-ink-mute">
						<th class="pb-2.5 font-semibold">Bulan</th>
						<th class="pb-2.5 text-right font-semibold">Pengeluaran</th>
						<th class="pb-2.5 text-right font-semibold">%</th>
						<th class="pb-2.5 text-center font-semibold">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.monthlyFlow as m}
						{@const mpct = m.amount > 0 ? Math.round((m.amount / data.budget) * 100) : 0}
						{@const mExceed = mpct >= 100}
						{@const mWarn = !mExceed && mpct >= data.warnPct}
						<tr class="border-b border-line/60 last:border-0">
							<td class="py-2.5 font-medium">{m.month}</td>
							<td class="num py-2.5 text-right {m.amount === 0 ? 'text-ink-mute' : ''}">
								{m.amount > 0 ? formatRp(m.amount) : '-'}
							</td>
							<td class="num py-2.5 text-right text-xs {mExceed ? 'font-bold text-[#dc2626]' : mWarn ? 'font-semibold text-warn' : 'text-ink-mute'}">
								{m.amount > 0 ? `${mpct}%` : '-'}
							</td>
							<td class="py-2.5 text-center">
								{#if m.amount === 0}
									<span class="text-xs text-ink-mute">-</span>
								{:else if mExceed}
									<span class="rounded-md bg-[#fef2f2] px-2 py-0.5 text-[11px] font-semibold text-[#dc2626]">Melebihi</span>
								{:else if mWarn}
									<span class="rounded-md bg-warn-bg px-2 py-0.5 text-[11px] font-semibold text-warn">Peringatan</span>
								{:else}
									<span class="rounded-md bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success">Aman</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</article>
</section>
