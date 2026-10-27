<script>
	// Logout otomatis di browser setelah tidak ada aktivitas selama batas idle sesi,
	// supaya data tidak tetap terpampang di layar (mis. laptop ditinggal atau bangun
	// dari sleep). Server hanya melihat request, jadi selama pengguna aktif membaca
	// tanpa pindah halaman, sesi digeser lewat ping ringan.
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	/** @type {{ idleMs: number }} */
	let { idleMs } = $props();

	const PING_EVERY = 5 * 60 * 1000;
	const ACTIVITY = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

	let lastActive = Date.now();
	// Navigasi SvelteKit memanggil server, jadi sesi sudah tergeser saat itu.
	let lastPing = Date.now();
	afterNavigate(() => (lastPing = Date.now()));

	onMount(() => {
		const mark = () => (lastActive = Date.now());

		async function check() {
			const now = Date.now();
			if (now - lastActive >= idleMs) {
				await fetch('/logout', { method: 'POST' }).catch(() => {});
				location.href = '/login?reason=idle';
				return;
			}
			if (lastActive > lastPing && now - lastPing >= PING_EVERY) {
				lastPing = now;
				const res = await fetch('/api/session', { method: 'POST' }).catch(() => null);
				// Server sudah menganggap sesi habis dan mengalihkan ke halaman login.
				if (res?.redirected) location.href = '/login?reason=expired';
			}
		}

		const onVisible = () => document.visibilityState === 'visible' && check();
		for (const e of ACTIVITY) window.addEventListener(e, mark, { passive: true });
		document.addEventListener('visibilitychange', onVisible);
		const timer = setInterval(check, 30_000);

		return () => {
			for (const e of ACTIVITY) window.removeEventListener(e, mark);
			document.removeEventListener('visibilitychange', onVisible);
			clearInterval(timer);
		};
	});
</script>
