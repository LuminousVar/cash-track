// Feed notifikasi — diturunkan dari data yang sudah ada, bukan disimpan.
// Murni & client-safe: tidak ada import server, tidak ada panggilan API.
// Pola sama seperti insight.js.
import { formatRp, formatDate } from './format.js';

/**
 * @typedef {import('$lib/server/expenses.js').Expense} Expense
 * @typedef {{ id: string, icon: 'receipt' | 'alert' | 'plus', tone: 'success' | 'warn' | 'lime', title: string, desc: string, time: string, at: number }} Notification
 */

/**
 * Label waktu relatif kasar. Tanggal di sheet hanya sampai hari, jadi tidak
 * perlu lebih halus dari ini.
 * @param {string} iso
 */
function relative(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const today = new Date();
	const days = Math.floor((today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86_400_000);
	if (days <= 0) return 'Hari ini';
	if (days === 1) return 'Kemarin';
	if (days < 7) return `${days} hari lalu`;
	return formatDate(iso);
}

/**
 * Rakit feed notifikasi dari transaksi + status anggaran.
 * @param {{ transactions?: Expense[], summary?: { thisMonth: number, budget: number, budgetPct: number } }} data
 * @param {number} [warnPct]
 * @param {number} [limit]
 * @returns {Notification[]}
 */
export function buildNotifications(data, warnPct = 80, limit = 15) {
	/** @type {Notification[]} */
	const out = [];
	const s = data.summary;

	// Ambang anggaran — selalu di atas karena paling perlu dilihat.
	if (s && s.budget > 0 && s.thisMonth > 0) {
		if (s.budgetPct >= 100) {
			out.push({
				id: 'budget-exceed',
				icon: 'alert',
				tone: 'warn',
				title: 'Anggaran bulan ini terlampaui',
				desc: `Terpakai ${formatRp(s.thisMonth)} dari ${formatRp(s.budget)} — lebih ${formatRp(s.thisMonth - s.budget)}.`,
				time: 'Bulan ini',
				at: Number.MAX_SAFE_INTEGER
			});
		} else if (s.budgetPct >= warnPct) {
			out.push({
				id: 'budget-warn',
				icon: 'alert',
				tone: 'warn',
				title: `Anggaran ${s.budgetPct}% terpakai`,
				desc: `Terpakai ${formatRp(s.thisMonth)} dari ${formatRp(s.budget)}. Sisa ${formatRp(s.budget - s.thisMonth)}.`,
				time: 'Bulan ini',
				at: Number.MAX_SAFE_INTEGER
			});
		}
	}

	for (const t of data.transactions ?? []) {
		const at = new Date(t.date).getTime();
		out.push({
			id: t.id || `${t.date}-${t.merchant}-${t.total}`,
			icon: t.source === 'telegram' ? 'receipt' : 'plus',
			tone: t.source === 'telegram' ? 'success' : 'lime',
			title: t.source === 'telegram' ? 'Struk tercatat' : 'Pengeluaran manual ditambahkan',
			desc: `${t.merchant || 'Tanpa nama'} · ${formatRp(t.total)}${t.source === 'telegram' ? ' masuk dari bot Telegram' : ''}.`,
			time: relative(t.date),
			at: Number.isNaN(at) ? 0 : at
		});
	}

	return out.sort((a, b) => b.at - a.at).slice(0, limit);
}
