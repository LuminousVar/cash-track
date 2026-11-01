// Notifikasi singkat setelah simpan atau hapus, ditampilkan Toaster di layout.
// Hanya dipanggil dari event di browser, jadi state modul ini tidak bocor antar-request di server.

/** @typedef {'success' | 'info' | 'error'} Tone */
/** @typedef {{ id: number, message: string, tone: Tone }} Toast */

/** @type {Toast[]} */
export const toasts = $state([]);
let lastId = 0;

/**
 * @param {string} message
 * @param {Tone} [tone]
 */
export function toast(message, tone = 'success') {
	const id = ++lastId;
	toasts.push({ id, message, tone });
	// Paling banyak tiga sekaligus, yang lama keluar duluan.
	if (toasts.length > 3) toasts.shift();
	setTimeout(() => dismiss(id), 4000);
}

/** @param {number} id */
export function dismiss(id) {
	const i = toasts.findIndex((t) => t.id === id);
	if (i >= 0) toasts.splice(i, 1);
}

/**
 * Toast untuk hasil action form. Action mengembalikan `persisted: false` di mode demo;
 * saat itu yang tampil pengingat bahwa tidak ada yang tersimpan.
 * @param {Record<string, unknown> | undefined} data
 * @param {string} message
 */
export function toastSaved(data, message) {
	if (data?.persisted === false) toast('Mode demo: perubahan tidak disimpan ke Google Sheet.', 'info');
	else toast(message);
}
