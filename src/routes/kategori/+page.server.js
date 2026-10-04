import { redirect } from '@sveltejs/kit';

// Halaman lama, digabung ke Laporan. Dialihkan supaya bookmark tetap bekerja.
export function load() {
	throw redirect(308, '/laporan');
}
