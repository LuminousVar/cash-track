<script>
	import { page } from '$app/state';

	/** @type {{ user?: string | null, onnavigate?: () => void }} */
	let { user = null, onnavigate } = $props();

	// Ikon inline (gaya Lucide) — string path, dibungkus <svg> saat render.
	const ic = {
		dashboard:
			'<rect x="3" y="3" width="7" height="9" rx="1.4"/><rect x="14" y="3" width="7" height="5" rx="1.4"/><rect x="14" y="12" width="7" height="9" rx="1.4"/><rect x="3" y="16" width="7" height="5" rx="1.4"/>',
		receipt:
			'<path d="M4 2.5v19l2-1 2 1 2-1 2 1 2-1 2 1v-19l-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M8 7.5h8M8 11.5h8M8 15.5h5"/>',
		tag: '<path d="M3 7v5l9 9 7-7-9-9H5a2 2 0 0 0-2 2Z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
		chart: '<path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7" rx="1"/><rect x="12" y="6" width="3" height="11" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/>',
		history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		wallet: '<rect x="1" y="5" width="22" height="16" rx="2"/><path d="M1 10h22"/><circle cx="16" cy="15" r="1.5"/>',
		bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
		settings:
			'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
		help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1 .9-1 1.7M12 17h.01"/>',
		search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>',
		send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
		logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>'
	};

	const menu = [
		{ label: 'Dashboard', icon: ic.dashboard, href: '/' },
		{ label: 'Pengeluaran', icon: ic.receipt, href: '/pengeluaran' },
		{ label: 'Kategori', icon: ic.tag, href: '/kategori' },
		{ label: 'Laporan', icon: ic.chart, href: '/laporan' },
		{ label: 'Anggaran', icon: ic.wallet, href: '/anggaran' },
		{ label: 'Riwayat', icon: ic.history, href: '/riwayat' },
		{ label: 'Notifikasi', icon: ic.bell, href: '/notifikasi' }
	];
	const tools = [
		{ label: 'Pengaturan', icon: ic.settings, href: '/pengaturan' },
		{ label: 'Bantuan', icon: ic.help, href: '/bantuan' }
	];

	/** @param {string} href */
	const isActive = (href) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));

	const initials = $derived((user ?? 'CT').slice(0, 2).toUpperCase());
</script>

<aside class="flex h-full w-[244px] shrink-0 flex-col bg-surface px-4 py-5">
	<!-- Logo -->
	<a href="/" onclick={onnavigate} class="flex items-center gap-2.5 px-2">
		<span class="grid size-8 place-items-center rounded-xl bg-lime-500 text-forest-900">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 2.5v19l2-1 2 1 2-1 2 1 2-1 2 1v-19l-2 1-2-1-2 1-2-1-2 1-2-1Z" />
				<path d="M9 8h6M9 12h6M9 16h3" />
			</svg>
		</span>
		<span class="text-[17px] font-extrabold tracking-tight">cash<span class="text-forest-600">track</span></span>
	</a>

	<!-- Search -->
	<label class="mt-6 flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5 text-ink-mute focus-within:ring-2 focus-within:ring-lime-300">
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html ic.search}</svg>
		<input class="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute" placeholder="Cari…" />
		<kbd class="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-mute shadow-sm">⌘S</kbd>
	</label>

	<!-- Menu -->
	<nav class="mt-6 flex flex-1 flex-col">
		<p class="px-2 text-[11px] font-semibold tracking-widest text-ink-mute">MENU</p>
		<ul class="mt-2 space-y-1">
			{#each menu as item}
				<li>
					<a
						href={item.href}
						onclick={onnavigate}
						class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors {isActive(item.href)
							? 'bg-active text-active-fg'
							: 'text-ink-soft hover:bg-canvas hover:text-ink'}"
					>
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={isActive(item.href) ? 'text-active-fg' : ''}>{@html item.icon}</svg>
						<span>{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		<p class="mt-7 px-2 text-[11px] font-semibold tracking-widest text-ink-mute">TOOLS</p>
		<ul class="mt-2 space-y-1">
			{#each tools as item}
				<li>
					<a
						href={item.href}
						onclick={onnavigate}
						class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors {isActive(item.href)
							? 'bg-active text-active-fg'
							: 'text-ink-soft hover:bg-canvas hover:text-ink'}"
					>
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={isActive(item.href) ? 'text-active-fg' : ''}>{@html item.icon}</svg>
						<span>{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Kartu status bot -->
	<a href="/bantuan" onclick={onnavigate} class="mt-4 block rounded-2xl bg-linear-to-b from-forest-700 to-forest-900 p-4 text-white">
		<div class="flex items-center gap-2">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-lime-400">{@html ic.send}</svg>
			<p class="text-sm font-semibold">Bot Telegram aktif</p>
		</div>
		<p class="mt-1.5 text-xs leading-relaxed text-white/70">Kirim foto struk ke bot, otomatis tercatat di sini.</p>
	</a>

	<!-- Akun + logout -->
	{#if user}
		<div class="mt-3 flex items-center gap-2.5 rounded-xl bg-canvas p-2">
			<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-forest-700 text-xs font-bold text-white">{initials}</span>
			<div class="min-w-0 flex-1 leading-tight">
				<p class="truncate text-sm font-semibold">{user}</p>
				<p class="text-[11px] text-ink-mute">Masuk</p>
			</div>
			<form method="POST" action="/logout">
				<button class="grid size-8 place-items-center rounded-lg text-ink-mute transition hover:bg-surface hover:text-ink" aria-label="Keluar" title="Keluar">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{@html ic.logout}</svg>
				</button>
			</form>
		</div>
	{/if}
</aside>
