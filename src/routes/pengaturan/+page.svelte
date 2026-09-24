<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { enhance } from '$app/forms';
	import { formatRp, CATEGORIES, PAYMENT_METHODS, CATEGORY_TONE } from '$lib/format.js';

	let { data, form } = $props();

	const initials = $derived((data.user ?? 'CT').slice(0, 2).toUpperCase());

	/** @param {boolean} ok @returns {string} */
	const statusClass = (ok) => ok ? 'bg-success-bg text-success' : 'bg-warn-bg text-warn';
	/** @param {boolean} ok @returns {string} */
	const statusLabel = (ok) => ok ? 'Terhubung' : 'Belum dikonfigurasi';

	// Visibility toggle untuk field bertipe password
	let showFields = $state(/** @type {Record<string, boolean>} */({}));
	/** @param {string} key */
	const toggleShow = (key) => showFields[key] = !showFields[key];

	let saving = $state(false);
</script>

<PageHeader title="Pengaturan" subtitle="Akun, anggaran, dan konfigurasi layanan." />

{#if form?.success}
	<div class="mt-4 rounded-xl bg-success-bg px-4 py-3 text-sm font-semibold text-success">
		Konfigurasi berhasil disimpan.
		{#if data.isVercel}<span class="font-normal opacity-80"> (Vercel: berlaku selama instance aktif. Gunakan env vars untuk permanen.)</span>{/if}
	</div>
{/if}
{#if form?.error}
	<div class="mt-4 rounded-xl bg-warn-bg px-4 py-3 text-sm font-semibold text-warn">{form.error}</div>
{/if}

<!-- Form logout di luar form utama agar tidak nested -->
<form id="logout-form" method="POST" action="/logout"></form>

<form method="POST" action="?/save" use:enhance={() => { saving = true; return ({ update }) => { saving = false; update(); }; }}>
<section class="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

	<!-- Akun -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Akun</span>
		<div class="mt-4 flex items-center gap-3">
			<span class="grid size-11 place-items-center rounded-xl bg-forest-700 text-sm font-bold text-white">{initials}</span>
			<div class="min-w-0 flex-1">
				<p class="font-semibold">{data.user ?? '-'}</p>
				<p class="text-xs text-ink-mute">{data.user ? 'Sedang masuk' : 'Auth belum dikonfigurasi'}</p>
			</div>
			{#if data.user}
				<button form="logout-form" type="submit" class="rounded-lg bg-canvas px-4 py-2 text-sm font-semibold text-ink-soft transition hover:text-ink">Keluar</button>
			{/if}
		</div>
	</article>

	<!-- Anggaran -->
	<article class="rounded-card bg-surface p-5">
		<label for="budget" class="text-sm font-semibold">Anggaran Bulanan</label>
		<p class="num mt-4 text-3xl font-extrabold tracking-tight">{formatRp(data.budget)}</p>
		<input
			id="budget"
			name="MONTHLY_BUDGET"
			type="number"
			min="0"
			placeholder="Contoh: 9500000"
			class="mt-3 w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line placeholder:text-ink-mute focus:ring-2 focus:ring-lime-400"
		/>
		<p class="mt-2 text-xs text-ink-mute">Kosongkan untuk tetap pakai nilai sekarang. Env: <code class="font-mono text-ink">MONTHLY_BUDGET</code></p>
	</article>

	<!-- Bot Telegram -->
	<article class="rounded-card bg-surface p-5 lg:col-span-2">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold">Bot Telegram</span>
			<span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClass(data.telegram.hasToken)}">{statusLabel(data.telegram.hasToken)}</span>
		</div>
		<p class="mt-1.5 text-sm text-ink-soft">Foto struk dibaca OCR, diurai AI, lalu dicatat ke Sheet.</p>

		<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
			<!-- Bot Token -->
			<div class="space-y-1.5">
				<label for="tg-token" class="block text-xs font-semibold text-ink-soft">
					Bot Token <span class="font-normal text-ink-mute">({data.telegram.tokenMasked || 'belum diisi'})</span>
				</label>
				<div class="flex items-center gap-1 overflow-hidden rounded-xl bg-canvas ring-1 ring-line focus-within:ring-2 focus-within:ring-lime-400">
					<input
						id="tg-token"
						name="TELEGRAM_BOT_TOKEN"
						type={showFields['tg-token'] ? 'text' : 'password'}
						placeholder="123456789:AABBcc…"
						autocomplete="off"
						class="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-mute"
					/>
					<button type="button" onclick={() => toggleShow('tg-token')} class="px-3 text-xs text-ink-mute hover:text-ink">{showFields['tg-token'] ? 'Sembunyikan' : 'Tampilkan'}</button>
				</div>
			</div>

			<!-- Secret Token -->
			<div class="space-y-1.5">
				<label for="tg-secret" class="block text-xs font-semibold text-ink-soft">
					Secret Token <span class="font-normal text-ink-mute">({data.telegram.hasSecret ? 'sudah diisi' : 'belum diisi'})</span>
				</label>
				<div class="flex items-center gap-1 overflow-hidden rounded-xl bg-canvas ring-1 ring-line focus-within:ring-2 focus-within:ring-lime-400">
					<input
						id="tg-secret"
						name="TELEGRAM_SECRET_TOKEN"
						type={showFields['tg-secret'] ? 'text' : 'password'}
						placeholder="random-string-aman"
						autocomplete="off"
						class="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-mute"
					/>
					<button type="button" onclick={() => toggleShow('tg-secret')} class="px-3 text-xs text-ink-mute hover:text-ink">{showFields['tg-secret'] ? 'Sembunyikan' : 'Tampilkan'}</button>
				</div>
			</div>

			<!-- Allowed IDs -->
			<div class="space-y-1.5">
				<label for="tg-ids" class="block text-xs font-semibold text-ink-soft">
					Whitelist ID
					{#if !data.telegram.allowedIds}<span class="font-medium text-warn"> Kosong berarti terbuka untuk semua!</span>{/if}
				</label>
				<input
					id="tg-ids"
					name="TELEGRAM_ALLOWED_IDS"
					type="text"
					value={data.telegram.allowedIds ?? ''}
					placeholder="12345678,98765432"
					class="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line placeholder:text-ink-mute focus:ring-2 focus:ring-lime-400"
				/>
				<p class="text-[11px] text-ink-mute">ID Telegram kamu, pisah koma.</p>
			</div>
		</div>

		<!-- Webhook hint -->
		<div class="mt-4 rounded-xl bg-forest-900 px-4 py-3">
			<p class="text-[11px] font-semibold text-white/50">Setup webhook (jalankan sekali setelah deploy)</p>
			<p class="mt-1.5 break-all font-mono text-[11px] text-lime-400">https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url=https://&lt;app&gt;.vercel.app/api/telegram&amp;secret_token=&lt;SECRET&gt;</p>
		</div>
	</article>

	<!-- DeepSeek / LLM -->
	<article class="rounded-card bg-surface p-5">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold">AI Parser: DeepSeek</span>
			<span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClass(data.deepseek.configured)}">{statusLabel(data.deepseek.configured)}</span>
		</div>
		<p class="mt-1.5 text-sm text-ink-soft">Mengurai teks OCR dari struk jadi merchant, total, kategori, dan rincian item (JSON mode).</p>

		<div class="mt-4 space-y-3">
			<div class="space-y-1.5">
				<label for="ds-key" class="block text-xs font-semibold text-ink-soft">
					API Key <span class="font-normal text-ink-mute">({data.deepseek.keyMasked || 'belum diisi'})</span>
				</label>
				<div class="flex items-center gap-1 overflow-hidden rounded-xl bg-canvas ring-1 ring-line focus-within:ring-2 focus-within:ring-lime-400">
					<input
						id="ds-key"
						name="DEEPSEEK_API_KEY"
						type={showFields['ds-key'] ? 'text' : 'password'}
						placeholder="sk-…"
						autocomplete="off"
						class="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-mute"
					/>
					<button type="button" onclick={() => toggleShow('ds-key')} class="px-3 text-xs text-ink-mute hover:text-ink">{showFields['ds-key'] ? 'Sembunyikan' : 'Tampilkan'}</button>
				</div>
			</div>
			<div class="flex items-center justify-between rounded-xl bg-canvas px-4 py-2.5">
				<p class="text-xs text-ink-soft">Model</p>
				<code class="font-mono text-xs text-ink">{data.deepseek.model}</code>
			</div>
		</div>
		<p class="mt-3 text-[11px] text-ink-mute">Daftar key di <span class="text-ink">platform.deepseek.com</span></p>
	</article>

	<!-- Google Sheets + Vision -->
	<article class="rounded-card bg-surface p-5">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold">Google Sheets & Vision OCR</span>
			<span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClass(data.google.configured)}">{statusLabel(data.google.configured)}</span>
		</div>
		<p class="mt-1.5 text-sm text-ink-soft">Vision API ekstrak teks struk. Sheets API simpan pengeluaran ke spreadsheet kamu.</p>

		<div class="mt-4 space-y-3">
			<!-- Sheet ID -->
			<div class="space-y-1.5">
				<label for="g-sheet" class="block text-xs font-semibold text-ink-soft">
					Sheet ID <span class="font-normal text-ink-mute">({data.google.sheetId ?? 'belum diisi'})</span>
				</label>
				<input
					id="g-sheet"
					name="GOOGLE_SHEET_ID"
					type="text"
					placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
					class="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line placeholder:text-ink-mute focus:ring-2 focus:ring-lime-400"
				/>
			</div>

			<!-- Sheet Tab -->
			<div class="space-y-1.5">
				<label for="g-tab" class="block text-xs font-semibold text-ink-soft">Nama Tab</label>
				<input
					id="g-tab"
					name="GOOGLE_SHEET_TAB"
					type="text"
					value={data.google.sheetTab}
					placeholder="Sheet1"
					class="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line placeholder:text-ink-mute focus:ring-2 focus:ring-lime-400"
				/>
			</div>

			<!-- Service Account JSON -->
			<div class="space-y-1.5">
				<label for="g-sa" class="block text-xs font-semibold text-ink-soft">
					Service Account JSON
					<span class="font-normal text-ink-mute">({data.google.hasServiceAccount ? 'sudah diisi' : 'belum diisi'})</span>
				</label>
				<textarea
					id="g-sa"
					name="GOOGLE_SERVICE_ACCOUNT"
					rows="3"
					placeholder={`{"type":"service_account","project_id":"…"}`}
					class="w-full resize-none rounded-xl bg-canvas px-4 py-2.5 font-mono text-xs text-ink outline-none ring-1 ring-line placeholder:text-ink-mute focus:ring-2 focus:ring-lime-400"
				></textarea>
				<p class="text-[11px] text-ink-mute">Paste isi file JSON (satu baris atau diformat biasa).</p>
			</div>
		</div>
	</article>

	<!-- Kategori -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Kategori</span>
		<p class="mt-1 text-xs text-ink-mute">Daftar tetap, dipakai bot & input manual.</p>
		<div class="mt-4 flex flex-wrap gap-2">
			{#each CATEGORIES as c}
				{@const tone = CATEGORY_TONE[c] ?? CATEGORY_TONE.Lainnya}
				<span class="rounded-md px-2.5 py-1 text-xs font-semibold" style="background: {tone.bg}; color: {tone.fg};">{c}</span>
			{/each}
		</div>
	</article>

	<!-- Metode bayar -->
	<article class="rounded-card bg-surface p-5">
		<span class="text-sm font-semibold">Metode Pembayaran</span>
		<p class="mt-1 text-xs text-ink-mute">Pilihan saat input manual.</p>
		<div class="mt-4 flex flex-wrap gap-2">
			{#each PAYMENT_METHODS as m}
				<span class="rounded-md bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">{m}</span>
			{/each}
		</div>
	</article>

</section>

<!-- Tombol simpan -->
<div class="mt-5 flex items-center justify-between gap-4 rounded-card bg-surface p-4">
	<p class="text-sm text-ink-soft">
		{#if data.isVercel}
			<span class="font-medium text-warn">Vercel:</span> konfigurasi tersimpan sementara (reset saat cold start). Gunakan Vercel Dashboard env vars untuk permanen.
		{:else}
			Tersimpan di <code class="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs text-ink">config.local.json</code>, langsung aktif tanpa restart.
		{/if}
	</p>
	<button
		type="submit"
		disabled={saving}
		class="flex shrink-0 items-center gap-2 rounded-xl bg-lime-500 px-5 py-2.5 text-sm font-bold text-forest-900 shadow-sm transition hover:bg-lime-400 disabled:opacity-60"
	>
		{#if saving}
			<svg class="animate-spin" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
			Menyimpan…
		{:else}
			Simpan Konfigurasi
		{/if}
	</button>
</div>
</form>
