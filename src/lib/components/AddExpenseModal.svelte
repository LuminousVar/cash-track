<script>
	import { CATEGORIES, PAYMENT_METHODS, formatRp } from '$lib/data/mock.js';

	let { open = false, onclose, onsave } = $props();

	const today = () => new Date().toISOString().slice(0, 10);

	let date = $state(today());
	let category = $state('Makanan');
	let method = $state('Tunai');
	let merchant = $state('');
	let notes = $state('');
	let items = $state([{ name: '', qty: 1, price: 0 }]);

	let total = $derived(items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0));

	// Saat dibuka, default tanggal = sekarang (boleh diedit). Lihat plan.
	$effect(() => {
		if (open) date = today();
	});

	function addItem() {
		items = [...items, { name: '', qty: 1, price: 0 }];
	}
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
	function submit(e) {
		e.preventDefault();
		// TODO: persist ke Google Sheet via form action (appendRow, source='manual').
		onsave?.({ merchant: merchant || 'Tanpa nama', date, category, method, total, source: 'manual' });
		reset();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button class="absolute inset-0 bg-forest-900/30 backdrop-blur-[2px]" aria-label="Tutup" onclick={onclose}></button>

		<form onsubmit={submit} class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface p-6 shadow-xl">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-lg font-bold">Tambah Pengeluaran</h2>
					<p class="text-sm text-ink-soft">Catat pengeluaran tanpa struk secara manual.</p>
				</div>
				<button type="button" onclick={onclose} class="grid size-8 place-items-center rounded-lg text-ink-mute hover:bg-canvas hover:text-ink" aria-label="Tutup">✕</button>
			</div>

			<div class="mt-5 grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Tanggal</span>
					<input type="date" bind:value={date} class="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Kategori</span>
					<select bind:value={category} class="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300">
						{#each CATEGORIES as c}<option>{c}</option>{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Metode bayar</span>
					<select bind:value={method} class="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300">
						{#each PAYMENT_METHODS as m}<option>{m}</option>{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Keterangan / Tempat</span>
					<input bind:value={merchant} placeholder="mis. Parkir motor" class="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300" />
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
						<div class="flex items-center gap-2">
							<input bind:value={item.name} placeholder="Nama" class="flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300" />
							<input type="number" min="1" bind:value={item.qty} class="num w-14 rounded-lg border border-line bg-canvas px-2 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-lime-300" />
							<input type="number" min="0" bind:value={item.price} placeholder="Harga" class="num w-28 rounded-lg border border-line bg-canvas px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-lime-300" />
							<button type="button" onclick={() => removeItem(i)} class="grid size-8 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-canvas hover:text-ink" aria-label="Hapus baris">✕</button>
						</div>
					{/each}
				</div>
			</div>

			<label class="mt-4 flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-ink-soft">Catatan</span>
				<textarea bind:value={notes} rows="2" placeholder="opsional" class="resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300"></textarea>
			</label>

			<!-- Total + aksi -->
			<div class="mt-5 flex items-center justify-between rounded-xl bg-active px-4 py-3">
				<span class="text-sm font-semibold text-forest-700">Total</span>
				<span class="num text-lg font-extrabold text-forest-800">{formatRp(total)}</span>
			</div>
			<div class="mt-4 flex justify-end gap-2">
				<button type="button" onclick={onclose} class="rounded-lg px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas">Batal</button>
				<button type="submit" class="rounded-lg bg-lime-500 px-5 py-2 text-sm font-bold text-forest-900 transition hover:bg-lime-400">Simpan</button>
			</div>
		</form>
	</div>
{/if}
