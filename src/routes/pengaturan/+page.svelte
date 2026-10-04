<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { CATEGORIES, PAYMENT_METHODS, categoryColor } from '$lib/format.js';

	let { data } = $props();
</script>

<PageHeader title="Pengaturan" description="Akun, tampilan, dan status layanan yang terhubung." />

<div class="mt-6 space-y-6">
	<section class="card divide-y divide-line" aria-label="Akun dan tampilan">
		<div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
			<div>
				<h2 class="text-sm font-semibold">Akun</h2>
				<p class="mt-0.5 text-sm text-ink-mute">{data.user ? `Masuk sebagai ${data.user}` : 'Login belum dikonfigurasi.'}</p>
			</div>
			{#if data.user}
				<form method="POST" action="/logout">
					<button class="btn btn-secondary"><Icon name="logout" /> Keluar</button>
				</form>
			{/if}
		</div>
		<div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
			<div>
				<h2 class="text-sm font-semibold">Tema</h2>
				<p class="mt-0.5 text-sm text-ink-mute">Disimpan di browser ini.</p>
			</div>
			<ThemeToggle />
		</div>
		<div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
			<div>
				<h2 class="text-sm font-semibold">Periode gajian</h2>
				<p class="mt-0.5 text-sm text-ink-mute">
					{#if data.cycleStartDay > 1}
						Mulai tanggal {data.cycleStartDay} sampai tanggal {data.cycleStartDay - 1} bulan berikutnya.
					{:else}
						Mengikuti bulan kalender (tanggal 1 sampai akhir bulan).
					{/if}
					Ubah lewat <code class="text-ink-soft">CYCLE_START_DAY</code>.
				</p>
			</div>
		</div>
	</section>

	<section class="card" aria-labelledby="int-heading">
		<div class="border-b border-line px-5 py-4">
			<h2 id="int-heading" class="text-sm font-semibold">Layanan terhubung</h2>
			<p class="mt-0.5 text-sm text-ink-mute">Kunci API diatur di Environment Variables (Vercel atau file <code class="text-ink-soft">.env</code>), tidak dari halaman ini.</p>
		</div>
		<ul class="divide-y divide-line">
			{#each data.integrations as it}
				<li class="flex items-start gap-3 px-5 py-3.5">
					<span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full {it.ok ? 'bg-success-bg text-success' : 'bg-warn-bg text-warn'}">
						<Icon name={it.ok ? 'check' : 'alert'} size={12} strokeWidth={2.25} />
					</span>
					<div class="min-w-0">
						<p class="text-sm font-medium">{it.name}</p>
						<p class="text-sm text-ink-mute">{it.detail}</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section class="card" aria-labelledby="ref-heading">
		<h2 id="ref-heading" class="border-b border-line px-5 py-4 text-sm font-semibold">Kategori dan metode bayar</h2>
		<div class="grid gap-5 p-5 sm:grid-cols-2">
			<div>
				<p class="eyebrow mb-2">Kategori (tetap)</p>
				<ul class="flex flex-wrap gap-x-4 gap-y-2 text-sm">
					{#each CATEGORIES as c}
						<li class="flex items-center gap-2"><span class="size-2 rounded-full" style="background: {categoryColor(c)}"></span>{c}</li>
					{/each}
				</ul>
			</div>
			<div>
				<p class="eyebrow mb-2">Metode bayar</p>
				<p class="text-sm text-ink-soft">{PAYMENT_METHODS.join(', ')}</p>
			</div>
		</div>
	</section>

	<section id="bantuan" class="card" aria-labelledby="help-heading">
		<h2 id="help-heading" class="border-b border-line px-5 py-4 text-sm font-semibold">Bantuan</h2>
		<div class="grid gap-6 p-5 lg:grid-cols-2">
			<div>
				<p class="eyebrow mb-2">Mencatat lewat Telegram</p>
				<ol class="list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
					<li>Kirim foto struk yang terang dan fokus ke bot.</li>
					<li>Bot membaca teks, menentukan kategori, lalu menyimpan ke Google Sheet.</li>
					<li>Bot membalas ringkasan beserta ID transaksi.</li>
				</ol>
			</div>
			<div>
				<p class="eyebrow mb-2">Perintah bot</p>
				<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
					<dt><code>/hapus</code></dt>
					<dd class="text-ink-soft">Batalkan catatan Telegram terakhir.</dd>
					<dt><code>/hapus &lt;id&gt;</code></dt>
					<dd class="text-ink-soft">Hapus transaksi dengan ID tersebut.</dd>
					<dt><code>/start</code></dt>
					<dd class="text-ink-soft">Pesan pembuka.</dd>
				</dl>
			</div>
			<div class="lg:col-span-2">
				<p class="eyebrow mb-2">Pertanyaan umum</p>
				<dl class="space-y-3 text-sm">
					<div>
						<dt class="font-medium">Pengeluaran tanpa struk?</dt>
						<dd class="text-ink-soft">Gunakan tombol "Tambah pengeluaran" di Ringkasan atau Transaksi.</dd>
					</div>
					<div>
						<dt class="font-medium">Salah baca struk?</dt>
						<dd class="text-ink-soft">Buka Transaksi, klik ikon pensil, lalu perbaiki atau hapus.</dd>
					</div>
					<div>
						<dt class="font-medium">Transaksi tanpa ikon pensil?</dt>
						<dd class="text-ink-soft">Baris lama belum punya ID. Jalankan <code>bun scripts/backfill-ids.js</code> sekali.</dd>
					</div>
				</dl>
			</div>
		</div>
	</section>
</div>
