<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import GoalModal from '$lib/components/GoalModal.svelte';
	import ContributeModal from '$lib/components/ContributeModal.svelte';
	import { formatRp, formatDayMonth, cycleLabel, daysBetween } from '$lib/format.js';
	import { GOAL_TYPE_STYLE, TRACK_STYLE } from '$lib/goal-style.js';

	let { data } = $props();

	/** @typedef {import('$lib/server/goals.js').Goal} Goal */

	let showNew = $state(false);
	/** @type {Goal | null} */
	let editing = $state(null);
	/** @type {Goal | null} */
	let contributing = $state(null);
	let contributeKind = $state(/** @type {'deposit' | 'withdraw'} */ ('deposit'));
	let historyOpen = $state(/** @type {string | null} */ (null));

	const active = $derived(data.goals.filter((g) => !g.archived && !g.done));
	const reached = $derived(data.goals.filter((g) => !g.archived && g.done));
	const archived = $derived(data.goals.filter((g) => g.archived));

	const saved = $derived(active.reduce((s, g) => s + g.saved, 0));
	const target = $derived(active.reduce((s, g) => s + g.target, 0));
	const perMonth = $derived(active.reduce((s, g) => s + (g.perMonth ?? 0), 0));

	/** "Des 2026" dari tanggal. @param {string} iso */
	const monthYear = (iso) => cycleLabel(iso.slice(0, 7));

	/** Sisa waktu yang mudah dibaca. @param {number} days */
	function timeLeft(days) {
		if (days < 0) return 'lewat tenggat';
		if (days < 45) return `${days} hari lagi`;
		const months = Math.round(days / 30.44);
		return months < 24 ? `${months} bulan lagi` : `${Math.round(months / 12)} tahun lagi`;
	}

	/**
	 * @param {Goal} g
	 * @param {'deposit' | 'withdraw'} kind
	 */
	function openContribute(g, kind) {
		contributeKind = kind;
		contributing = g;
	}
</script>

<PageHeader title="Goals" description="Target tabungan untuk kebutuhan dan keinginan. Terpisah dari anggaran pengeluaran.">
	<button onclick={() => (showNew = true)} class="btn btn-primary w-full sm:w-auto">
		<Icon name="plus" />
		Goal baru
	</button>
</PageHeader>

<div class="mt-6 space-y-6">
	<section class="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-4" aria-label="Ringkasan goals">
		<div class="bg-surface p-4">
			<p class="eyebrow">Terkumpul</p>
			<p class="num mt-1 text-xl font-semibold">{formatRp(saved)}</p>
			<p class="mt-1 text-xs text-ink-mute">{active.length} goal aktif</p>
		</div>
		<div class="bg-surface p-4">
			<p class="eyebrow">Total target</p>
			<p class="num mt-1 text-xl font-semibold">{formatRp(target)}</p>
			<p class="mt-1 text-xs text-ink-mute">{target > 0 ? Math.round((saved / target) * 100) : 0}% tercapai</p>
		</div>
		<div class="bg-surface p-4">
			<p class="eyebrow">Perlu disisihkan</p>
			<p class="num mt-1 text-xl font-semibold">{formatRp(perMonth)}</p>
			<p class="mt-1 text-xs text-ink-mute">per bulan, untuk goal bertenggat</p>
		</div>
		<div class="bg-surface p-4">
			<p class="eyebrow">Tercapai</p>
			<p class="num mt-1 text-xl font-semibold">{reached.length}</p>
			<p class="mt-1 text-xs text-ink-mute">goal selesai</p>
		</div>
	</section>

	{#snippet card(/** @type {Goal} */ g)}
		{@const st = GOAL_TYPE_STYLE[g.type] ?? GOAL_TYPE_STYLE.Lainnya}
		{@const tr = TRACK_STYLE[g.track]}
		<article class="card flex flex-col p-4 sm:p-5 {g.archived ? 'opacity-70' : ''}">
			<div class="flex items-start gap-3">
				<span
					class="grid size-10 shrink-0 place-items-center rounded-xl"
					style="color: {st.color}; background: color-mix(in srgb, {st.color} 13%, transparent)"
					aria-hidden="true"
				>
					<Icon name={st.icon} size={20} strokeWidth={2} />
				</span>
				<div class="min-w-0 flex-1">
					<h3 class="truncate font-semibold">{g.name}</h3>
					<p class="text-xs text-ink-mute">{g.type}</p>
				</div>
				<button onclick={() => (editing = g)} class="btn btn-ghost btn-icon -mr-2 -mt-1 h-8 w-8" aria-label="Ubah {g.name}" title="Ubah">
					<Icon name="pencil" size={15} />
				</button>
			</div>

			<div class="mt-4 flex items-baseline justify-between gap-2">
				<p class="text-2xl font-semibold tracking-tight">{formatRp(g.saved)}</p>
				<p class="num text-sm font-medium {g.done ? 'text-success' : 'text-ink-soft'}">{g.pct}%</p>
			</div>
			<p class="text-xs text-ink-mute">dari <span class="num">{formatRp(g.target)}</span>{g.remaining > 0 ? `, kurang ${formatRp(g.remaining)}` : ''}</p>

			<div
				class="mt-3 h-2.5 overflow-hidden rounded-full bg-subtle"
				role="progressbar"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={g.pct}
				aria-label="Progres {g.name}"
			>
				<div class="goal-bar h-full rounded-full {g.done ? 'bg-success' : 'bg-accent'}" style="width: {g.pct}%"></div>
			</div>

			<div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
				<span class="rounded-full px-2 py-0.5 font-medium {tr.bg} {tr.fg}">{tr.label}</span>
				{#if g.deadline}
					<span class="rounded-full bg-subtle px-2 py-0.5 text-ink-soft">Tenggat {monthYear(g.deadline)}, {timeLeft(g.daysLeft ?? 0)}</span>
				{/if}
			</div>

			<dl class="mt-3 space-y-1 text-xs">
				{#if g.perMonth}
					<div class="flex justify-between gap-2">
						<dt class="text-ink-mute">Perlu per bulan</dt>
						<dd class="num font-medium">{formatRp(g.perMonth)}</dd>
					</div>
				{/if}
				{#if g.pace > 0 && !g.done}
					<div class="flex justify-between gap-2">
						<dt class="text-ink-mute">Rata-rata setoran</dt>
						<dd class="num">{formatRp(g.pace)}/bulan</dd>
					</div>
				{/if}
				{#if g.eta}
					<div class="flex justify-between gap-2">
						<dt class="text-ink-mute">Perkiraan tercapai</dt>
						<dd class={g.deadline && g.eta > g.deadline ? 'text-warn' : ''}>{monthYear(g.eta)}</dd>
					</div>
				{/if}
				{#if g.notes}<p class="pt-1 text-ink-mute">{g.notes}</p>{/if}
			</dl>

			{#if !g.archived}
				<div class="mt-auto flex items-center gap-2 pt-4">
					<button onclick={() => openContribute(g, 'deposit')} class="btn btn-primary h-8 flex-1 text-xs sm:flex-none">
						<Icon name="plus" size={14} /> Setor
					</button>
					<button onclick={() => openContribute(g, 'withdraw')} disabled={g.saved <= 0} class="btn btn-secondary h-8 text-xs">
						<Icon name="minus" size={14} /> Tarik
					</button>
					{#if g.logs.length}
						<button
							onclick={() => (historyOpen = historyOpen === g.id ? null : g.id)}
							aria-expanded={historyOpen === g.id}
							class="btn btn-ghost ml-auto h-8 px-2 text-xs"
						>
							<Icon name="history" size={14} /> Riwayat
						</button>
					{/if}
				</div>
			{/if}

			{#if historyOpen === g.id}
				<ul class="mt-3 divide-y divide-line border-t border-line text-xs">
					{#each g.logs.slice(0, 12) as l (l.id)}
						<li class="flex items-center gap-2 py-2">
							<span class="w-14 shrink-0 text-ink-mute">{formatDayMonth(l.date)}</span>
							<span class="min-w-0 flex-1 truncate text-ink-soft">{l.note || (l.amount < 0 ? 'Penarikan' : 'Setoran')}{l.source === 'telegram' ? ' (Telegram)' : ''}</span>
							<span class="num font-medium {l.amount < 0 ? 'text-danger' : ''}">{l.amount < 0 ? '-' : '+'}{formatRp(Math.abs(l.amount))}</span>
							{#if !data.demo}
								<form method="POST" action="?/uncontribute" use:enhance={() => async () => invalidateAll()}>
									<input type="hidden" name="logId" value={l.id} />
									<button class="btn btn-ghost btn-icon h-6 w-6" aria-label="Hapus catatan {formatDayMonth(l.date)}" title="Hapus catatan">
										<Icon name="x" size={12} />
									</button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
				{#if g.logs.length > 12}<p class="pt-2 text-xs text-ink-mute">Menampilkan 12 terbaru dari {g.logs.length}. Semua tersimpan di tab GoalLog.</p>{/if}
			{/if}
		</article>
	{/snippet}

	{#if active.length === 0 && reached.length === 0}
		<section class="card px-6 py-12 text-center">
			<span class="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon name="target" size={24} /></span>
			<h2 class="mt-4 font-semibold">Belum ada goal</h2>
			<p class="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
				Buat target seperti dana darurat, DP rumah, atau barang yang sedang diincar. Setoran dicatat terpisah dan tidak mengurangi anggaran.
			</p>
			<button onclick={() => (showNew = true)} class="btn btn-primary mt-5"><Icon name="plus" /> Buat goal pertama</button>
		</section>
	{:else}
		{#if active.length}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each active as g (g.id)}{@render card(g)}{/each}
			</div>
		{/if}
		{#if reached.length}
			<section aria-labelledby="reached-heading">
				<h2 id="reached-heading" class="mb-3 text-sm font-semibold">Tercapai</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{#each reached as g (g.id)}{@render card(g)}{/each}
				</div>
			</section>
		{/if}
	{/if}

	{#if archived.length}
		<details class="group">
			<summary class="text-sm font-medium text-ink-soft hover:text-ink">Arsip ({archived.length})</summary>
			<div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each archived as g (g.id)}{@render card(g)}{/each}
			</div>
		</details>
	{/if}
</div>

<GoalModal open={showNew || !!editing} demo={data.demo} goal={editing} onclose={() => ((showNew = false), (editing = null))} />
<ContributeModal goal={contributing} kind={contributeKind} demo={data.demo} onclose={() => (contributing = null)} />

<style>
	/* Bar progres mengisi dari kiri saat pertama tampil. */
	.goal-bar {
		animation: goal-fill 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
		transition: width 400ms ease;
	}
	@keyframes goal-fill {
		from {
			width: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.goal-bar {
			animation: none;
		}
	}
</style>
