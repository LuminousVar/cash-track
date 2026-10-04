<script>
	import Icon from '$lib/components/Icon.svelte';

	let { form } = $props();
	let submitting = $state(false);
</script>

<div class="flex min-h-dvh items-center justify-center bg-canvas px-4">
	<div class="w-full max-w-sm">
		<div class="mb-6 flex items-center justify-center gap-2 text-base font-semibold tracking-tight">
			<span class="grid size-7 place-items-center rounded-md bg-accent text-accent-fg">
				<Icon name="receipt" size={15} strokeWidth={2} />
			</span>
			cashtrack
		</div>

		<div class="card p-6">
			<h1 class="text-lg font-semibold">Masuk</h1>
			<p class="mt-1 text-sm text-ink-mute">Gunakan akun yang diatur di server.</p>

			{#if form?.error}
				<p role="alert" class="mt-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{form.error}</p>
			{/if}

			<form method="POST" class="mt-5 space-y-4" onsubmit={() => (submitting = true)}>
				<label class="block">
					<span class="label">Username</span>
					<input name="username" value={form?.username ?? ''} autocomplete="username" required class="field" />
				</label>
				<label class="block">
					<span class="label">Password</span>
					<input type="password" name="password" autocomplete="current-password" required class="field" />
				</label>
				<button type="submit" disabled={submitting} class="btn btn-primary w-full">{submitting ? 'Memeriksa…' : 'Masuk'}</button>
			</form>
		</div>
	</div>
</div>
