<script>
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Icon from './Icon.svelte';
	import { CATEGORIES, PAYMENT_METHODS, formatRp, formatNumber, parseNumber, todayJakarta } from '$lib/format.js';

	/**
	 * @type {{
	 *   open?: boolean,
	 *   demo?: boolean,
	 *   mode?: 'add' | 'edit',
	 *   expense?: import('$lib/server/expenses.js').Expense | null,
	 *   onclose?: () => void
	 * }}
	 */
	let { open = false, demo = false, mode = 'add', expense = null, onclose } = $props();

	let date = $state(todayJakarta());
	let category = $state('Makanan');
	let method = $state('Tunai');
	let merchant = $state('');
	let notes = $state('');
	let items = $state([{ name: '', qty: 1, price: 0 }]);
	let submitting = $state(false);
	let confirmDelete = $state(false);
	let error = $state('');
	/** @type {HTMLDivElement | undefined} */
	let panel = $state();

	const isEdit = $derived(mode === 'edit');
	// Action update dan delete dipusatkan di /pengeluaran; halaman lain memposting ke sana.
	const formAction = $derived(isEdit ? '/pengeluaran?/update' : '/?/add');
	const itemsSum = $derived(items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0));
	// Total dibayar bisa berbeda dari jumlah barang (diskon, pajak, ongkir di struk).
	// null = ikut jumlah barang. Mode ubah memakai total asli supaya tidak berubah diam-diam.
	/** @type {number | null} */
	let paidOverride = $state(null);
	const total = $derived(paidOverride ?? itemsSum);

	// Saat dibuka: mode tambah mulai kosong dengan tanggal hari ini (WIB), mode ubah
	// mengisi dari transaksi. Fokus dipindah ke dialog supaya keyboard langsung bekerja.
	// Hanya bergantung pada open/mode/expense. Sisanya di dalam untrack: tanpa itu,
	// membaca `items` setelah mengisinya membuat effect berulang dan form ter-reset
	// setiap kali user mengetik.
	$effect(() => {
		if (!open) return;
		const edit = isEdit;
		const ex = expense;
		untrack(() => fill(edit, ex));
	});

	/**
	 * @param {boolean} edit
	 * @param {import('$lib/server/expenses.js').Expense | null} expense
	 */
	function fill(edit, expense) {
		error = '';
		confirmDelete = false;
		if (!edit || !expense) {
			date = todayJakarta();
			category = 'Makanan';
			method = 'Tunai';
			merchant = '';
			notes = '';
			items = [{ name: '', qty: 1, price: 0 }];
			paidOverride = null;
		} else {
			date = expense.date || todayJakarta();
			category = CATEGORIES.includes(expense.category) ? expense.category : 'Lainnya';
			method = PAYMENT_METHODS.includes(expense.method) ? expense.method : '';
			merchant = expense.merchant || '';
			notes = expense.notes || '';
			// Struk tanpa rincian barang: satu baris dari total supaya nominalnya tidak hilang.
			items = expense.items?.length
				? expense.items.map((i) => ({ name: i.name, qty: i.qty || 1, price: i.price || 0 }))
				: [{ name: expense.merchant || 'Total', qty: 1, price: expense.total || 0 }];
			const sum = items.reduce((s, i) => s + i.qty * i.price, 0);
			paidOverride = expense.total && expense.total !== sum ? expense.total : null;
		}
		queueMicrotask(() => panel?.querySelector('input')?.focus());
	}

	/**
	 * Format harga dengan titik ribuan sambil mengetik, kursor tetap di tempatnya.
	 * @param {Event & { currentTarget: HTMLInputElement }} e
	 * @param {number} idx
	 */
	function onPriceInput(e, idx) {
		const el = e.currentTarget;
		const raw = parseNumber(el.value);
		items[idx] = { ...items[idx], price: raw };
		const pos = el.selectionStart ?? 0;
		const oldLen = el.value.length;
		el.value = formatNumber(raw);
		const next = Math.max(0, pos + el.value.length - oldLen);
		el.setSelectionRange(next, next);
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function onTotalInput(e) {
		const el = e.currentTarget;
		const raw = parseNumber(el.value);
		paidOverride = raw > 0 ? raw : null;
		const pos = el.selectionStart ?? 0;
		const oldLen = el.value.length;
		el.value = formatNumber(raw);
		const next = Math.max(0, pos + el.value.length - oldLen);
		el.setSelectionRange(next, next);
	}

	const addItem = () => (items = [...items, { name: '', qty: 1, price: 0 }]);
	/** @param {number} idx */
	const removeItem = (idx) => {
		if (items.length > 1) items = items.filter((_, i) => i !== idx);
	};

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (open && e.key === 'Escape' && !submitting) onclose?.();
	}

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function submit({ formData }) {
		submitting = true;
		error = '';
		formData.set('items', JSON.stringify(items));
		formData.set('total', String(total));
		return async ({ result }) => {
			submitting = false;
			if (result.type === 'failure') {
				error = String(result.data?.error ?? 'Gagal menyimpan.');
				return;
			}
			if (result.type === 'success') onclose?.();
			// Action bisa hidup di route lain, jadi data halaman ini diambil ulang eksplisit.
			await invalidateAll();
		};
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
		<button class="absolute inset-0 bg-black/40" aria-label="Tutup" tabindex="-1" onclick={onclose}></button>

		<div
			bind:this={panel}
			role="dialog"
			aria-modal="true"
			aria-labelledby="expense-dialog-title"
			class="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl border border-line bg-surface shadow-xl sm:rounded-xl"
		>
			<div class="flex items-center justify-between border-b border-line px-5 py-4">
				<h2 id="expense-dialog-title" class="text-base font-semibold">{isEdit ? 'Ubah transaksi' : 'Tambah pengeluaran'}</h2>
				<button type="button" onclick={onclose} class="btn btn-ghost btn-icon h-8 w-8" aria-label="Tutup"><Icon name="x" /></button>
			</div>

			<form id="expense-form" method="POST" action={formAction} use:enhance={submit} class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
				{#if isEdit}<input type="hidden" name="id" value={expense?.id ?? ''} />{/if}

				{#if demo}
					<p class="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">Mode demo: perubahan tidak disimpan ke Google Sheet.</p>
				{/if}
				{#if error}
					<p role="alert" class="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
				{/if}
				{#if isEdit && expense?.source === 'telegram'}
					<p class="text-sm text-ink-mute">Dicatat dari struk Telegram. Teks asli dan foto tetap tersimpan meski data di sini diubah.</p>
				{/if}

				<div class="grid grid-cols-2 gap-3">
					<label class="col-span-2">
						<span class="label">Keterangan / tempat</span>
						<input name="merchant" bind:value={merchant} placeholder="mis. Indomaret" class="field" />
					</label>
					<label>
						<span class="label">Tanggal</span>
						<input type="date" name="date" bind:value={date} required class="field" />
					</label>
					<label>
						<span class="label">Kategori</span>
						<select name="category" bind:value={category} class="field">
							{#each CATEGORIES as c}<option>{c}</option>{/each}
						</select>
					</label>
					<label class="col-span-2 sm:col-span-1">
						<span class="label">Metode bayar</span>
						<!-- Struk Telegram bisa tanpa metode bayar. Tanpa opsi kosong, browser
							 menampilkan dan menyimpan "Tunai" diam-diam saat diedit. -->
						<select name="method" bind:value={method} class="field">
							<option value="">Tidak diketahui</option>
							{#each PAYMENT_METHODS as m}<option>{m}</option>{/each}
						</select>
					</label>
				</div>

				<fieldset>
					<div class="mb-1.5 flex items-center justify-between">
						<legend class="text-[13px] font-medium text-ink-soft">Barang</legend>
						<button type="button" onclick={addItem} class="text-sm font-medium text-accent hover:underline">Tambah baris</button>
					</div>
					<div class="space-y-2">
						{#each items as item, i}
							<div class="grid grid-cols-[1fr_3.5rem_7rem_2rem] items-center gap-2">
								<input bind:value={item.name} placeholder="Nama barang" aria-label="Nama barang {i + 1}" class="field" />
								<input type="number" min="1" bind:value={item.qty} aria-label="Jumlah barang {i + 1}" class="field num px-2 text-center" />
								<input
									type="text"
									inputmode="numeric"
									value={formatNumber(item.price)}
									placeholder="Harga"
									aria-label="Harga satuan barang {i + 1}"
									oninput={(e) => onPriceInput(e, i)}
									class="field num text-right"
								/>
								<button
									type="button"
									onclick={() => removeItem(i)}
									disabled={items.length === 1}
									class="btn btn-ghost btn-icon h-8 w-8"
									aria-label="Hapus baris {i + 1}"
								>
									<Icon name="x" size={14} />
								</button>
							</div>
						{/each}
					</div>
				</fieldset>

				<div>
					<label for="expense-total" class="label">Total dibayar</label>
					<div class="relative">
						<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">Rp</span>
						<input
							id="expense-total"
							type="text"
							inputmode="numeric"
							value={formatNumber(total)}
							oninput={onTotalInput}
							class="field num pl-9"
						/>
					</div>
					{#if paidOverride !== null && paidOverride !== itemsSum}
						<p class="mt-1.5 text-xs text-ink-mute">
							Jumlah barang {formatRp(itemsSum)}, selisih {formatRp(Math.abs(itemsSum - paidOverride))}
							({paidOverride < itemsSum ? 'diskon' : 'biaya tambahan'}).
							<button type="button" onclick={() => (paidOverride = null)} class="font-medium text-ink-soft underline">Samakan dengan jumlah barang</button>
						</p>
					{:else}
						<p class="mt-1.5 text-xs text-ink-mute">Otomatis dari jumlah barang. Ubah bila struk ada diskon atau pajak.</p>
					{/if}
				</div>

				<label class="block">
					<span class="label">Catatan <span class="font-normal text-ink-mute">(opsional)</span></span>
					<textarea name="notes" bind:value={notes} rows="2" class="field resize-none"></textarea>
				</label>
			</form>

			<div class="flex items-center gap-3 border-t border-line px-5 py-3.5">
				<div class="mr-auto">
					<p class="eyebrow">Total</p>
					<p class="num text-lg font-semibold">{formatRp(total)}</p>
				</div>
				{#if isEdit && !demo}
					{#if confirmDelete}
						<form
							method="POST"
							action="/pengeluaran?/delete"
							use:enhance={() => {
								submitting = true;
								return async ({ result }) => {
									submitting = false;
									if (result.type === 'failure') error = String(result.data?.error ?? 'Gagal menghapus.');
									else onclose?.();
									await invalidateAll();
								};
							}}
						>
							<input type="hidden" name="id" value={expense?.id ?? ''} />
							<button class="btn btn-danger" disabled={submitting}>Ya, hapus</button>
						</form>
						<button type="button" class="btn btn-ghost" onclick={() => (confirmDelete = false)}>Batal</button>
					{:else}
						<button type="button" class="btn btn-ghost text-danger" onclick={() => (confirmDelete = true)}>Hapus</button>
					{/if}
				{/if}
				{#if !confirmDelete}
					<button type="submit" form="expense-form" disabled={submitting || total <= 0} class="btn btn-primary">
						{submitting ? 'Menyimpan…' : 'Simpan'}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
