// Data laporan satu periode gajian, bahan PDF di /laporan/pdf/[period].
import { listExpenses, isConfigured, getBudget, dailyTotals, demoExpensesIn } from './expenses.js';
import { getWarnPct } from './budget.js';
import { getCycleStartDay } from './cycle.js';
import { normCategory, countsToBudget, cycleKey, cycleRange, prevCycleKey, budgetStatus } from '$lib/format.js';

/** @typedef {import('./expenses.js').Expense} Expense */

/** @param {Expense[]} list */
const sum = (list) => list.reduce((s, e) => s + e.total, 0);

/**
 * Kelompokkan pengeluaran, terbesar dulu. Nama grup diambil dari entri pertama,
 * supaya "Indomaret" dan "INDOMARET" jadi satu baris tanpa mengubah ejaannya.
 * @param {Expense[]} list
 * @param {(e: Expense) => string} labelOf
 */
function groupBy(list, labelOf) {
	/** @type {Map<string, { name: string, count: number, amount: number }>} */
	const map = new Map();
	for (const e of list) {
		const name = labelOf(e);
		const k = name.toLowerCase();
		const g = map.get(k) ?? { name, count: 0, amount: 0 };
		g.count++;
		g.amount += e.total;
		map.set(k, g);
	}
	return [...map.values()].sort((a, b) => b.amount - a.amount);
}

/** @param {Expense} e */
const categoryOf = (e) => normCategory(e.category);

/**
 * Ringkasan lengkap satu periode beserta pembanding periode sebelumnya.
 * @param {string} key  "YYYY-MM"
 */
export async function getPeriodReport(key) {
	const startDay = getCycleStartDay();
	const prevKey = prevCycleKey(key);
	const all = isConfigured()
		? await listExpenses()
		: [...demoExpensesIn(key, startDay), ...demoExpensesIn(prevKey, startDay)];

	const inPeriod = all.filter((e) => cycleKey(e.date, startDay) === key).sort((a, b) => a.date.localeCompare(b.date));
	// Investasi dicatat terpisah: tidak masuk total pengeluaran maupun anggaran.
	const expenses = inPeriod.filter(countsToBudget);
	const investments = inPeriod.filter((e) => !countsToBudget(e));
	const prev = all.filter((e) => countsToBudget(e) && cycleKey(e.date, startDay) === prevKey);

	const total = sum(expenses);
	const budget = getBudget();
	const warnPct = getWarnPct();
	const pct = Math.round((total / budget) * 100);

	// Kategori yang hanya muncul di periode lalu tetap ikut, supaya selisihnya terbaca.
	const prevByCat = new Map(groupBy(prev, categoryOf).map((g) => [g.name, g.amount]));
	const categories = groupBy(expenses, categoryOf).map((g) => ({ ...g, prevAmount: prevByCat.get(g.name) ?? 0 }));
	for (const [name, prevAmount] of prevByCat) {
		if (!categories.some((c) => c.name === name)) categories.push({ name, count: 0, amount: 0, prevAmount });
	}

	return {
		key,
		prevKey,
		startDay,
		range: cycleRange(key, startDay),
		expenses,
		investments,
		invested: sum(investments),
		total,
		prevTotal: sum(prev),
		budget,
		warnPct,
		pct,
		status: budgetStatus(pct, warnPct),
		categories,
		methods: groupBy(expenses, (e) => e.method.trim() || 'Tidak tercatat'),
		merchants: groupBy(expenses, (e) => e.merchant.trim() || 'Tanpa nama').slice(0, 5),
		daily: dailyTotals(expenses, key, startDay),
		prevDaily: dailyTotals(prev, prevKey, startDay)
	};
}
