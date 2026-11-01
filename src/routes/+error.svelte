<script>
	// Halaman error di dalam kerangka aplikasi, jadi sidebar dan tab bar tetap ada untuk keluar.
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';

	const notFound = $derived(page.status === 404);
	// "Internal Error" adalah pesan bawaan SvelteKit untuk error tak terduga, tidak berguna bagi user.
	const message = $derived(
		notFound
			? 'Alamatnya mungkin salah ketik, atau halamannya sudah dipindah.'
			: page.error?.message && page.error.message !== 'Internal Error'
				? page.error.message
				: 'Server gagal memproses permintaan. Coba muat ulang; kalau berulang, periksa koneksi ke Google Sheet di Pengaturan.'
	);
</script>

<section class="card mx-auto mt-6 max-w-md px-6 py-10 text-center sm:mt-12">
	<span class="mx-auto grid size-11 place-items-center rounded-xl {notFound ? 'bg-subtle text-ink-soft' : 'bg-danger-bg text-danger'}">
		<Icon name={notFound ? 'search' : 'alert'} size={20} />
	</span>
	<p class="num mt-4 text-xs font-medium text-ink-mute">Kode {page.status}</p>
	<h1 class="mt-1 text-xl font-semibold tracking-tight">{notFound ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'}</h1>
	<p class="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{message}</p>
	<div class="mt-6 flex flex-wrap justify-center gap-2">
		<a href="/" class="btn btn-primary">Ke Ringkasan</a>
		{#if !notFound}
			<button type="button" onclick={() => location.reload()} class="btn btn-secondary">Muat ulang</button>
		{/if}
	</div>
</section>
