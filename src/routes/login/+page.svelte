<script>
	import Icon from '$lib/components/Icon.svelte';

	let { data, form } = $props();
</script>

<div class="flex min-h-dvh flex-col bg-canvas">
	<header class="flex h-16 items-center px-6">
		<span class="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
			<span class="grid size-6 place-items-center rounded-md bg-accent text-accent-fg">
				<Icon name="receipt" size={14} strokeWidth={2} />
			</span>
			cashtrack
		</span>
	</header>

	<main class="flex flex-1 items-center justify-center px-6 pb-16">
		<div class="w-full max-w-[360px]">
			<h1 class="text-center text-2xl font-semibold tracking-tight">Masuk ke cashtrack</h1>
			<p class="mt-2 text-center text-sm text-ink-mute">Gunakan akun yang terdaftar di server.</p>

			<!-- Pesan sebagai baris netral bergaris tipis, bukan kotak berwarna. -->
			{#if form?.error}
				<p role="alert" class="mt-8 flex items-start gap-2.5 rounded-md border border-danger/40 px-3 py-2.5 text-[13px] text-danger">
					<Icon name="alert" size={15} class="mt-px" />
					{form.error}
				</p>
			{:else if data.expired}
				<p role="status" class="mt-8 flex items-start gap-2.5 rounded-md border border-line-strong px-3 py-2.5 text-[13px] text-ink-soft">
					<Icon name="clock" size={15} class="mt-px text-ink-mute" />
					Sesi berakhir. Masuk kembali untuk melanjutkan.
				</p>
			{/if}

			<!-- Sengaja tanpa state "submitting": mengubah state saat submit membuat Svelte
				 menulis ulang value username ke nilai awal (kosong) tepat sebelum browser
				 mengambil isi form, sehingga login selalu gagal. -->
			<form method="POST" class="space-y-4 {form?.error || data.expired ? 'mt-4' : 'mt-8'}">
				<label class="block">
					<span class="mb-1.5 block text-[13px] font-medium text-ink-soft">Username</span>
					<input name="username" value={form?.username ?? ''} autocomplete="username" required class="field h-10" />
				</label>
				<label class="block">
					<span class="mb-1.5 block text-[13px] font-medium text-ink-soft">Password</span>
					<input type="password" name="password" autocomplete="current-password" required class="field h-10" />
				</label>
				<button type="submit" class="btn h-10 w-full bg-ink font-medium text-canvas transition-opacity hover:opacity-85">Masuk</button>
			</form>
		</div>
	</main>

	<footer class="flex items-center justify-center gap-1.5 px-6 pb-8 text-center text-xs text-ink-mute">
		<Icon name="lock" size={12} />
		Sesi berakhir otomatis setelah {data.idleMinutes} menit tanpa aktivitas.
	</footer>
</div>
