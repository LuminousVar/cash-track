<script>
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import BudgetStatus from '$lib/components/BudgetStatus.svelte';
	import TransactionRow from '$lib/components/TransactionRow.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { formatRp, categoryColor, cycleLabel, prevCycleKey } from '$lib/format.js';

	let { data } = $props();

	let showAdd = $state(false);
	/** @type {import('$lib/server/expenses.js').Expense | null} */
	let editing = $state(null);

	const s = $derived(data.summary);
	const prevLabel = $derived(cycleLabel(prevCycleKey(s.cycle.key)).split(' ')[0]);
	const delta = $derived(s.prevPeriod > 0 ? Math.round(((s.thisMonth - s.prevPeriod) / s.prevPeriod) * 100) : null);
	const catMax = $derived(Math.max(1, ...data.categories.map((c) => c.amount)));
</script>

<PageHeader title="Ringkasan">
	<button onclick={() => (showAdd = true)} class="btn btn-primary w-full sm:w-auto">
		<Icon name="plus" />
		Tambah pengeluaran
	</button>
</PageHeader>

<div class="mt-6 space-y-6">
	<BudgetStatus spent={s.thisMonth} budget={s.budget} warnPct={data.warnPct} cycle={s.cycle} />

	<section class="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3" aria-label="Statistik periode">
		<div class="bg-surface p-4">
			<p class="eyebrow">Pengeluaran periode ini</p>
			<p class="num mt-1 text-xl font-semibold">{formatRp(s.thisMonth)}</p>
			<p class="mt-1 text-xs text-ink-mute">
				{#if delta === null}
					Belum ada data periode {prevLabel}
				{:else if delta === 0}
					Sama dengan periode {prevLabel}
				{:else}
					<span class={delta > 0 ? 'text-danger' : 'text-success'}>{delta > 0 ? 'Naik' : 'Turun'} {Math.abs(delta)}%</span>
					dari periode {prevLabel} ({formatRp(s.prevPeriod)})
				{/if}
			</p>
		</div>
		<div class="bg-surface p-4">
			<p class="eyebrow">Rata-rata per hari</p>
			<p class="num mt-1 text-xl font-semibold">{formatRp(s.dailyAvg)}</p>
			<p class="mt-1 text-xs text-ink-mute">Hari ke-{s.cycle.dayIndex} dari {s.cycle.days}</p>
		</div>
		<div class="bg-surface p-4">
			<p class="eyebrow">Transaksi</p>
			<p class="num mt-1 text-xl font-semibold">{s.count}</p>
			<p class="mt-1 text-xs text-ink-mute">{s.fromTelegram} dari struk, {s.fromManual} manual</p>
		</div>
	</section>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
		<section class="card lg:col-span-2" aria-labelledby="cat-heading">
			<div class="flex items-center justify-between border-b border-line px-4 py-3">
				<h2 id="cat-heading" class="text-sm font-semibold">Per kategori</h2>
				<a href="/laporan" class="text-sm text-ink-soft hover:text-ink">Laporan</a>
			</div>
			{#if data.categories.length === 0}
				<p class="px-4 py-10 text-center text-sm text-ink-mute">Belum ada pengeluaran di periode ini.</p>
			{:else}
				<ul class="space-y-3 p-4">
					{#each data.categories as c}
						<li>
							<a href="/pengeluaran?category={encodeURIComponent(c.name)}&period={s.cycle.key}" class="group block">
								<div class="flex items-baseline justify-between gap-3 text-sm">
									<span class="flex items-center gap-2 group-hover:underline">
										<span class="size-2 rounded-full" style="background: {categoryColor(c.name)}"></span>
										{c.name}
									</span>
									<span class="num text-ink-soft">
										{formatRp(c.amount)}
										<span class="ml-1 inline-block w-9 text-right text-xs text-ink-mute">{Math.round((c.amount / Math.max(1, s.thisMonth)) * 100)}%</span>
									</span>
								</div>
								<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle">
									<div class="h-full rounded-full" style="width: {(c.amount / catMax) * 100}%; background: {categoryColor(c.name)}"></div>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="card lg:col-span-3" aria-labelledby="tx-heading">
			<div class="flex items-center justify-between border-b border-line px-4 py-3">
				<h2 id="tx-heading" class="text-sm font-semibold">Transaksi terbaru</h2>
				<a href="/pengeluaran" class="text-sm text-ink-soft hover:text-ink">Lihat semua</a>
			</div>
			{#if data.transactions.length === 0}
				<div class="px-4 py-10 text-center">
					<p class="text-sm text-ink-soft">Belum ada transaksi.</p>
					<p class="mt-1 text-sm text-ink-mute">Kirim foto struk ke bot Telegram, atau tambah secara manual.</p>
				</div>
			{:else}
				<ul class="divide-y divide-line">
					{#each data.transactions as t (t.id || `${t.date}-${t.merchant}-${t.total}`)}
						<li><TransactionRow {t} editable={!data.demo} onedit={(x) => (editing = x)} /></li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>

<AddExpenseModal open={showAdd} demo={data.demo} onclose={() => (showAdd = false)} />
<AddExpenseModal open={!!editing} demo={data.demo} mode="edit" expense={editing} onclose={() => (editing = null)} />
