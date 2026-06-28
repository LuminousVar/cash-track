// Pembuat "Wawasan" dashboard — rule-based, dirakit dari data ringkasan.
// Murni & client-safe: tidak ada import server, tidak ada panggilan API.
import { formatRp, MONTHS } from './format.js';

/**
 * @typedef {{ thisMonth: number, budget: number, budgetPct: number, dailyAvg: number, fromTelegram: number, fromManual: number, count: number }} Summary
 * @typedef {{ month: string, amount: number, telegram?: number }} Flow
 * @typedef {{ name: string, amount: number, tone?: string }} TopCat
 * @typedef {{ summary: Summary, monthlyFlow: Flow[], topCategories: TopCat[] }} DashboardData
 * @typedef {{ tone: 'aman' | 'waspada' | 'lewat', text: string }} Insight
 */

/** @param {string} s */
const b = (s) => `<strong>${s}</strong>`;

/**
 * Rakit satu paragraf wawasan natural dari data dashboard.
 * Mengembalikan HTML (gunakan {@html} di template).
 * @param {DashboardData} data
 * @returns {Insight}
 */
export function buildInsight(data) {
	const s = data.summary;
	const thisMonth = Number(s?.thisMonth) || 0;
	const budget = Number(s?.budget) || 0;
	const pct = budget > 0 ? Math.round((thisMonth / budget) * 100) : 0;

	/** @type {'aman' | 'waspada' | 'lewat'} */
	const tone = pct >= 100 ? 'lewat' : pct >= 80 ? 'waspada' : 'aman';

	if (thisMonth <= 0) {
		return {
			tone: 'aman',
			text: 'Belum ada pengeluaran tercatat bulan ini. Mulai dengan kirim foto struk ke bot Telegram atau tambah pengeluaran secara manual. 🌱'
		};
	}

	const parts = [];

	// 1) Status anggaran.
	if (budget > 0) {
		const sisa = budget - thisMonth;
		if (tone === 'lewat') {
			parts.push(
				`Bulan ini kamu sudah menghabiskan ${b(formatRp(thisMonth))} atau ${b(pct + '%')} dari anggaran ${formatRp(budget)}, melebihi batas sebesar ${b(formatRp(thisMonth - budget))}.`
			);
		} else if (tone === 'waspada') {
			parts.push(
				`Bulan ini kamu sudah menghabiskan ${b(formatRp(thisMonth))} atau ${b(pct + '%')} dari anggaran ${formatRp(budget)}, mendekati batas dengan sisa ${b(formatRp(sisa))}.`
			);
		} else {
			parts.push(
				`Bulan ini kamu sudah menghabiskan ${b(formatRp(thisMonth))} atau ${b(pct + '%')} dari anggaran ${formatRp(budget)}, masih aman dengan sisa ${b(formatRp(sisa))}.`
			);
		}
	} else {
		parts.push(`Pengeluaran bulan ini tercatat ${b(formatRp(thisMonth))}.`);
	}

	// 2) Tren vs bulan lalu.
	const now = new Date();
	const mIdx = now.getMonth();
	const flow = Array.isArray(data.monthlyFlow) ? data.monthlyFlow : [];
	const prev = mIdx > 0 ? Number(flow[mIdx - 1]?.amount) || 0 : 0;
	if (mIdx > 0 && prev > 0) {
		const delta = Math.round(((thisMonth - prev) / prev) * 100);
		const prevName = MONTHS[mIdx - 1];
		if (delta > 2) {
			parts.push(`Dibanding ${prevName}, pengeluaran naik ${b(delta + '%')} dari ${formatRp(prev)}.`);
		} else if (delta < -2) {
			parts.push(`Dibanding ${prevName}, pengeluaran turun ${b(Math.abs(delta) + '%')} dari ${formatRp(prev)} — kerja bagus! 👏`);
		} else {
			parts.push(`Pengeluaran hampir sama seperti ${prevName} (${formatRp(prev)}).`);
		}
	}

	// 3) Kategori teratas + kebiasaan struk vs manual.
	const top = data.topCategories?.[0];
	if (top && Number(top.amount) > 0) {
		const tg = Number(s?.fromTelegram) || 0;
		const man = Number(s?.fromManual) || 0;
		let habit = '';
		if (tg + man > 0) {
			if (tg > man) habit = ` Sebagian besar tercatat otomatis dari struk (${b(tg + ' dari ' + (tg + man) + ' transaksi')}).`;
			else if (man > tg) habit = ` Kebanyakan dicatat manual (${b(man + ' dari ' + (tg + man) + ' transaksi')}).`;
		}
		parts.push(`Pengeluaran terbesar ada di kategori ${b(top.name)} sebesar ${b(formatRp(top.amount))}.${habit}`);
	}

	// 4) Proyeksi akhir bulan.
	const day = now.getDate();
	const daysInMonth = new Date(now.getFullYear(), mIdx + 1, 0).getDate();
	const daysLeft = daysInMonth - day;
	if (day > 0 && thisMonth > 0) {
		const projected = Math.round((thisMonth / day) * daysInMonth);
		if (budget > 0 && projected > budget) {
			parts.push(`Dengan ritme ini, proyeksi akhir bulan sekitar ${b(formatRp(projected))}, sedikit di atas target. Masih ada ${b(daysLeft + ' hari')} tersisa untuk menyesuaikan pengeluaran. 💪`);
		} else if (budget > 0) {
			parts.push(`Dengan ritme ini, proyeksi akhir bulan sekitar ${b(formatRp(projected))}, masih di bawah target. 👍`);
		} else {
			parts.push(`Proyeksi akhir bulan sekitar ${b(formatRp(projected))}.`);
		}
	}

	return { tone, text: parts.join(' ') };
}
