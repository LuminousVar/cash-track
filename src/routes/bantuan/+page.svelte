<script>
	import PageHeader from '$lib/components/PageHeader.svelte';

	const steps = [
		{ n: 1, title: 'Hubungkan bot', desc: 'Buka bot Telegram cash-track, lalu kirim /start.' },
		{ n: 2, title: 'Foto struk', desc: 'Ambil foto struk yang jelas & fokus, kirim ke bot.' },
		{ n: 3, title: 'Otomatis tercatat', desc: 'Bot membaca teks (OCR), menstrukturkan, dan menyimpan ke Sheet.' },
		{ n: 4, title: 'Cek dashboard', desc: 'Transaksi langsung muncul di Dashboard & Pengeluaran.' }
	];

	const faq = [
		{ q: 'Pengeluaran tanpa struk?', a: 'Pakai tombol "Tambah Pengeluaran" di Dashboard/Pengeluaran untuk input manual.' },
		{ q: 'Kenapa muncul "Mode demo"?', a: 'Kredensial Google Sheet belum diisi, jadi data yang tampil contoh dan input belum tersimpan.' },
		{ q: 'Foto tidak terbaca?', a: 'Pastikan struk terang, rata, dan teks tidak buram. Coba foto ulang.' },
		{ q: 'Siapa yang bisa pakai bot?', a: 'Hanya user yang ada di whitelist TELEGRAM_ALLOWED_IDS.' }
	];
</script>

<PageHeader title="Bantuan" subtitle="Cara pakai cash-track." />

<!-- Langkah -->
<section class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
	{#each steps as s}
		<article class="rounded-card bg-surface p-5">
			<span class="grid size-9 place-items-center rounded-xl bg-active text-sm font-extrabold text-forest-700">{s.n}</span>
			<p class="mt-4 font-semibold">{s.title}</p>
			<p class="mt-1 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
		</article>
	{/each}
</section>

<!-- FAQ -->
<section class="mt-5 rounded-card bg-surface p-5">
	<span class="text-sm font-semibold">Pertanyaan umum</span>
	<div class="mt-4 divide-y divide-line">
		{#each faq as f}
			<div class="py-4 first:pt-0 last:pb-0">
				<p class="font-semibold">{f.q}</p>
				<p class="mt-1 text-sm text-ink-soft">{f.a}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Kartu bot -->
<section class="mt-5 rounded-card bg-linear-to-br from-forest-700 to-forest-900 p-6 text-white">
	<p class="text-lg font-bold">Siap mencatat?</p>
	<p class="mt-1 max-w-md text-sm text-white/70">Kirim foto struk pertamamu ke bot Telegram, atau tambah pengeluaran manual dari Dashboard.</p>
	<a href="/" class="mt-4 inline-block rounded-lg bg-lime-500 px-5 py-2.5 text-sm font-bold text-forest-900 transition hover:bg-lime-400">Ke Dashboard</a>
</section>
