<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { CATEGORIES, PAYMENT_METHODS, formatRp } from '$lib/format.js';

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

	const today = () => new Date().toISOString().slice(0, 10);

	let date = $state(today());
	let category = $state('Makanan');
	let method = $state('Tunai');
	let merchant = $state('');
	let notes = $state('');
	let items = $state([{ name: '', qty: 1, price: 0 }]);
	let submitting = $state(false);
	let error = $state('');

	const isEdit = $derived(mode === 'edit');
	// Action update dipusatkan di /pengeluaran; halaman lain memposting ke sana.
	const formAction = $derived(isEdit ? '/pengeluaran?/update' : '/?/add');

	let total = $derived(items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0));

	// Saat dibuka: mode add memakai tanggal hari ini, mode edit mengisi dari transaksi.
	$effect(() => {
		if (!open) return;
		error = '';
		if (!isEdit || !expense) {
			date = today();
			return;
		}
		date = expense.date || today();
		category = CATEGORIES.includes(expense.category) ? expense.category : 'Lainnya';
		method = PAYMENT_METHODS.includes(expense.method) ? expense.method : '';
		merchant = expense.merchant || '';
		notes = expense.notes || '';
		// Struk dari Telegram kadang tanpa rincian barang, jadi buat satu baris dari
		// total supaya nominalnya tidak hilang saat diedit.
		items = expense.items?.length
			? expense.items.map((i) => ({ name: i.name, qty: i.qty || 1, price: i.price || 0 }))
			: [{ name: expense.merchant || 'Total', qty: 1, price: expense.total || 0 }];
	});

	/** Format angka dengan pemisah ribuan koma, misalnya 20000 jadi "20,000" @param {number} n @returns {string} */
	function fmtNum(n) {
		return n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
	}
	/** Ambil angka bersih dari string berformat. @param {string} s @returns {number} */
	function parseNum(s) {
		return Number(s.replace(/[^\d]/g, '')) || 0;
	}
	/**
	 * Handler input harga: format koma otomatis, perbarui state.
	 * @param {Event & { currentTarget: HTMLInputElement }} e
	 * @param {number} idx
	 */
	function onPriceInput(e, idx) {
		const raw = parseNum(e.currentTarget.value);
		items[idx] = { ...items[idx], price: raw };
		// Simpan posisi kursor sebelum format ulang
		const pos = e.currentTarget.selectionStart ?? 0;
		const oldLen = e.currentTarget.value.length;
		e.currentTarget.value = fmtNum(raw);
		// Sesuaikan kursor agar tidak lompat aneh
		const diff = e.currentTarget.value.length - oldLen;
		e.currentTarget.setSelectionRange(pos + diff, pos + diff);
	}

	function addItem() {
		items = [...items, { name: '', qty: 1, price: 0 }];
	}
	/** @param {number} idx */
	function removeItem(idx) {
		if (items.length > 1) items = items.filter((_, i) => i !== idx);
	}
	function reset() {
		category = 'Makanan';
		method = 'Tunai';
		merchant = '';
		notes = '';
		items = [{ name: '', qty: 1, price: 0 }];
	}

	// Inject rincian barang (JSON) ke formData, lalu refresh data setelah submit.
	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function submit({ formData }) {
		submitting = true;
		error = '';
		formData.set('items', JSON.stringify(items));
		return async ({ result }) => {
			submitting = false;
			if (result.type === 'success') {
				if (!isEdit) reset();
				onclose?.();
				// Action edit hidup di route lain, jadi data halaman ini harus
				// diambil ulang secara eksplisit.
				await invalidateAll();
				return;
			}
			if (result.type === 'failure') {
				error = String(result.data?.error ?? 'Gagal menyimpan.');
				return;
			}
			await invalidateAll();
		};
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
		<button class="absolute inset-0 bg-forest-900/30 backdrop-blur-[2px]" aria-label="Tutup" onclick={onclose}></button>

		<form method="POST" action={formAction} use:enhance={submit} class="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-h-[90vh] sm:rounded-card sm:p-6">
			{#if isEdit}<input type="hidden" name="id" value={expense?.id ?? ''} />{/if}
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-lg font-bold">{isEdit ? 'Ubah Pengeluaran' : 'Tambah Pengeluaran'}</h2>
					<p class="text-sm text-ink-soft">
						{isEdit ? 'Perbaiki data yang salah baca atau salah kategori.' : 'Catat pengeluaran tanpa struk secara manual.'}
					</p>
				</div>
				<button type="button" onclick={onclose} class="grid size-8 place-items-center rounded-lg text-ink-mute hover:bg-canvas hover:text-ink" aria-label="Tutup">✕</button>
			</div>

			{#if demo}
				<p class="mt-3 rounded-lg bg-warn-bg px-3 py-2 text-xs font-medium text-warn">Mode demo: data belum tersimpan ke Google Sheet (atur kredensial di .env).</p>
			{/if}
			{#if error}
				<p class="mt-3 rounded-lg bg-warn-bg px-3 py-2 text-xs font-medium text-warn">{error}</p>
			{/if}
			{#if isEdit && expense?.source === 'telegram'}
				<p class="mt-3 rounded-lg bg-active px-3 py-2 text-xs font-medium text-forest-700">
					Hasil baca struk otomatis. Teks asli & foto tetap tersimpan meski data di sini diubah.
				</p>
			{/if}

			<div class="mt-5 grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Tanggal</span>
					<input type="date" name="date" bind:value={date} class="w-full min-w-0 rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Kategori</span>
					<div class="relative">
						<select name="category" bind:value={category} class="w-full appearance-none rounded-lg border border-line bg-canvas py-2 pl-3 pr-8 text-sm text-ink outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-300">
							{#each CATEGORIES as c}<option>{c}</option>{/each}
						</select>
						<svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
					</div>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Metode bayar</span>
					<div class="relative">
						<select name="method" bind:value={method} class="w-full appearance-none rounded-lg border border-line bg-canvas py-2 pl-3 pr-8 text-sm text-ink outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-300">
							{#each PAYMENT_METHODS as m}<option>{m}</option>{/each}
						</select>
						<svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
					</div>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Keterangan / Tempat</span>
					<input name="merchant" bind:value={merchant} placeholder="mis. Parkir motor" class="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300" />
				</label>
			</div>

			<!-- Rincian barang -->
			<div class="mt-4">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-ink-soft">Barang</span>
					<button type="button" onclick={addItem} class="text-xs font-bold text-forest-600 hover:text-forest-700">+ Tambah barang</button>
				</div>
				<div class="mt-2 space-y-2">
					{#each items as item, i}
						<!-- Di HP nama barang satu baris penuh, qty + harga di bawahnya. -->
						<div class="flex flex-wrap items-center gap-2 sm:flex-nowrap">
							<input bind:value={item.name} placeholder="Nama" class="w-full rounded-lg sm:w-auto sm:flex-1 border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300" />
							<input type="number" min="1" bind:value={item.qty} class="num w-16 shrink-0 rounded-lg border sm:w-14 border-line bg-canvas px-2 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-lime-300" />
							<input
								type="text"
								inputmode="numeric"
								value={fmtNum(item.price)}
								placeholder="Harga"
								oninput={(e) => onPriceInput(e, i)}
								class="num min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-right sm:w-28 sm:flex-none text-sm outline-none focus:ring-2 focus:ring-lime-300"
							/>
							<button type="button" onclick={() => removeItem(i)} class="grid size-8 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-canvas hover:text-ink" aria-label="Hapus baris">✕</button>
						</div>
					{/each}
				</div>
			</div>

			<label class="mt-4 flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-ink-soft">Catatan</span>
				<textarea name="notes" bind:value={notes} rows="2" placeholder="opsional" class="resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300"></textarea>
			</label>

			<!-- Total + aksi -->
			<div class="mt-5 flex items-center justify-between rounded-xl bg-active px-4 py-3">
				<span class="text-sm font-semibold text-forest-700">Total</span>
				<span class="num text-lg font-extrabold text-forest-800">{formatRp(total)}</span>
			</div>
			<div class="mt-4 flex justify-end gap-2 max-sm:*:flex-1">
				<button type="button" onclick={onclose} class="rounded-lg px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas">Batal</button>
				<button type="submit" disabled={submitting || total <= 0} class="rounded-lg bg-lime-500 px-5 py-2 text-sm font-bold text-forest-900 transition hover:bg-lime-400 disabled:opacity-50">
					{submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan'}
				</button>
			</div>
		</form>
	</div>
{/if}
