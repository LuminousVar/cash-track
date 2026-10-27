// Ikon, warna, dan label status untuk Goals (dipakai halaman dan modal).

/** @type {Record<string, { icon: string, color: string }>} */
export const GOAL_TYPE_STYLE = {
	'Kebutuhan masa depan': { icon: 'home', color: 'var(--color-cat-investasi)' },
	Keinginan: { icon: 'sparkles', color: 'var(--color-cat-kesehatan)' },
	'Dana darurat': { icon: 'shield', color: 'var(--color-cat-transport)' },
	Lainnya: { icon: 'target', color: 'var(--color-cat-lainnya)' }
};

/** Label dan token warna per status jalur goal (lihat summarize di server/goals.js). */
export const TRACK_STYLE = {
	done: { label: 'Tercapai', fg: 'text-success', bg: 'bg-success-bg' },
	ok: { label: 'Sesuai jalur', fg: 'text-success', bg: 'bg-success-bg' },
	behind: { label: 'Perlu dikejar', fg: 'text-warn', bg: 'bg-warn-bg' },
	idle: { label: 'Belum ada setoran', fg: 'text-ink-mute', bg: 'bg-subtle' },
	none: { label: 'Tanpa tenggat', fg: 'text-ink-mute', bg: 'bg-subtle' }
};
