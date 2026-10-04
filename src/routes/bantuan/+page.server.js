import { redirect } from '@sveltejs/kit';

// Halaman lama, dipindah ke Pengaturan. Dialihkan supaya bookmark tetap bekerja.
export function load() {
	throw redirect(308, '/pengaturan#bantuan');
}
