<script>
	let { form } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-canvas px-4">
	<div class="w-full max-w-sm">
		<!-- Brand -->
		<div class="mb-8 flex items-center justify-center gap-2.5">
			<span class="grid size-9 place-items-center rounded-xl bg-lime-500 text-forest-900">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 2.5v19l2-1 2 1 2-1 2 1 2-1 2 1v-19l-2 1-2-1-2 1-2-1-2 1-2-1Z" />
					<path d="M9 8h6M9 12h6M9 16h3" />
				</svg>
			</span>
			<span class="text-xl font-extrabold tracking-tight">cash<span class="text-forest-600">track</span></span>
		</div>

		<div class="rounded-card bg-surface p-7 shadow-sm">
			<h1 class="text-lg font-bold">Masuk</h1>
			<p class="mt-1 text-sm text-ink-soft">Dashboard ini privat. Silakan login untuk melanjutkan.</p>

			{#if form?.error}
				<p class="mt-4 rounded-lg bg-warn-bg px-3 py-2 text-sm font-medium text-warn">{form.error}</p>
			{/if}

			<form method="POST" class="mt-5 space-y-4">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Username</span>
					<input name="username" value={form?.username ?? ''} autocomplete="username" required class="rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lime-300" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-ink-soft">Password</span>
					<input type="password" name="password" autocomplete="current-password" required class="rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lime-300" />
				</label>
				<button type="submit" class="w-full rounded-lg bg-lime-500 py-2.5 text-sm font-bold text-forest-900 transition hover:bg-lime-400">Masuk</button>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-ink-mute">Lupa kredensial? Atur ulang via env <span class="font-mono">AUTH_PASSWORD_HASH</span>.</p>
	</div>
</div>
