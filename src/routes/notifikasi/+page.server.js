import { redirect } from '@sveltejs/kit';

// Halaman lama, diganti peringatan Telegram dan status di Ringkasan. Dialihkan supaya bookmark tetap bekerja.
export function load() {
	throw redirect(308, '/');
}
