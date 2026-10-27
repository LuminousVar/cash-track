// Goals: target tabungan (kebutuhan masa depan, keinginan, dana darurat, ...).
// Disimpan di spreadsheet yang sama: tab "Goals" untuk goal, "GoalLog" untuk riwayat
// setoran dan penarikan. Kedua tab dibuat otomatis saat pertama dipakai.
// Terpisah dari pengeluaran: setoran tidak muncul di transaksi dan tidak dihitung ke anggaran.
import { readRows, appendRow, updateRow, deleteRows, ensureTab, isConfigured } from './google.js';
import { GOAL_TYPES, todayJakarta, daysBetween, addDays } from '$lib/format.js';

const GOALS_TAB = 'Goals';
const LOG_TAB = 'GoalLog';
const GOAL_HEADER = ['id', 'created', 'name', 'type', 'target', 'deadline', 'notes', 'status'];
const LOG_HEADER = ['id', 'goal_id', 'date', 'amount', 'note', 'source', 'user'];

/** ID pendek, sama seperti transaksi. */
const newId = () => crypto.randomUUID().slice(0, 8);

/**
 * Tandai nilai sebagai teks biasa untuk Sheets (lihat penjelasan di expenses.js).
 * @param {string} v
 */
const text = (v) => (v ? `'${v}` : '');

/**
 * @typedef {{ id: string, goalId: string, date: string, amount: number, note: string, source: string, rowNumber: number }} GoalLog
 * @typedef {{
 *   id: string, created: string, name: string, type: string, target: number, deadline: string,
 *   notes: string, archived: boolean, rowNumber: number
 * }} GoalRow
 */

async function ensureTabs() {
	await ensureTab(GOALS_TAB, GOAL_HEADER);
	await ensureTab(LOG_TAB, LOG_HEADER);
}

/** @returns {Promise<{ goals: GoalRow[], logs: GoalLog[] }>} */
async function readAll() {
	await ensureTabs();
	const [g, l] = await Promise.all([readRows(GOALS_TAB), readRows(LOG_TAB)]);
	const goals = g.slice(1).map((r, i) => ({
		id: r[0] ?? '',
		created: r[1] ?? '',
		name: r[2] ?? '',
		type: GOAL_TYPES.includes(r[3]) ? r[3] : 'Lainnya',
		target: Number(r[4]) || 0,
		deadline: r[5] ?? '',
		notes: r[6] ?? '',
		archived: (r[7] ?? '') === 'arsip',
		rowNumber: i + 2
	}));
	const logs = l.slice(1).map((r, i) => ({
		id: r[0] ?? '',
		goalId: r[1] ?? '',
		date: r[2] ?? '',
		amount: Number(r[3]) || 0,
		note: r[4] ?? '',
		source: r[5] ?? '',
		rowNumber: i + 2
	}));
	return { goals: goals.filter((x) => x.id), logs: logs.filter((x) => x.id) };
}

/**
 * Hitung progres satu goal dari riwayatnya.
 * - perMonth: yang perlu disisihkan per bulan supaya tepat tenggat.
 * - pace: rata-rata setoran bersih per bulan dalam 90 hari terakhir.
 * - track: 'done' tercapai, 'ok' sesuai jalur, 'behind' perlu dikejar,
 *   'idle' belum ada setoran, 'none' tanpa tenggat.
 * @param {GoalRow} g
 * @param {GoalLog[]} logs  riwayat goal ini saja
 * @param {string} today
 */
function summarize(g, logs, today) {
	const saved = logs.reduce((s, l) => s + l.amount, 0);
	const remaining = Math.max(0, g.target - saved);
	const done = g.target > 0 && saved >= g.target;
	const daysLeft = g.deadline ? daysBetween(today, g.deadline) : null;
	const monthsLeft = daysLeft === null ? null : Math.max(1, Math.ceil(daysLeft / 30.44));
	const perMonth = monthsLeft === null || done ? null : Math.ceil(remaining / monthsLeft);

	const since = addDays(today, -90);
	const window = Math.min(3, Math.max(1, (daysBetween(g.created.slice(0, 10) || today, today) + 1) / 30.44));
	const pace = Math.max(0, Math.round(logs.filter((l) => l.date >= since).reduce((s, l) => s + l.amount, 0) / window));
	const etaDays = !done && pace > 0 ? Math.ceil((remaining / pace) * 30.44) : null;

	/** @type {'done' | 'ok' | 'behind' | 'idle' | 'none'} */
	let track = 'none';
	if (done) track = 'done';
	else if (logs.length === 0) track = 'idle';
	else if (perMonth !== null) track = pace >= perMonth * 0.95 ? 'ok' : 'behind';

	return {
		id: g.id,
		name: g.name,
		type: g.type,
		target: g.target,
		deadline: g.deadline,
		notes: g.notes,
		created: g.created,
		archived: g.archived,
		saved,
		remaining,
		pct: g.target > 0 ? Math.min(100, Math.round((saved / g.target) * 100)) : 0,
		done,
		daysLeft,
		perMonth,
		pace,
		eta: etaDays === null ? null : addDays(today, etaDays),
		track,
		logs: [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.rowNumber - a.rowNumber).map(({ rowNumber, goalId, ...l }) => l)
	};
}

/** @typedef {ReturnType<typeof summarize>} Goal */

/** Semua goal beserta progresnya, yang aktif dulu. DEMO bila Sheet belum dikonfigurasi. */
export async function listGoals() {
	const today = todayJakarta();
	const { goals, logs } = isConfigured() ? await readAll() : demoData(today);
	return goals
		.map((g) => summarize(g, logs.filter((l) => l.goalId === g.id), today))
		.sort((a, b) => Number(a.archived) - Number(b.archived) || Number(a.done) - Number(b.done) || (a.deadline || '9999').localeCompare(b.deadline || '9999'));
}

/**
 * @param {{ name: string, type: string, target: number, deadline: string, notes: string }} input
 */
export async function createGoal(input) {
	if (!isConfigured()) return { persisted: false };
	await ensureTabs();
	const id = newId();
	await appendRow(
		[text(id), new Date().toISOString(), text(input.name), input.type, String(Math.round(input.target)), input.deadline, text(input.notes), ''],
		GOALS_TAB
	);
	return { persisted: true, id };
}

/**
 * Ubah goal. Kolom yang tidak dikirim tetap.
 * @param {string} id
 * @param {{ name?: string, type?: string, target?: number, deadline?: string, notes?: string, archived?: boolean }} patch
 */
export async function updateGoal(id, patch) {
	if (!isConfigured()) return { persisted: false };
	const { goals } = await readAll();
	const g = goals.find((x) => x.id === id);
	if (!g) return { persisted: false, notFound: true };
	await updateRow(
		g.rowNumber,
		[
			text(g.id),
			g.created,
			text(patch.name ?? g.name),
			patch.type ?? g.type,
			String(Math.round(patch.target ?? g.target)),
			patch.deadline ?? g.deadline,
			text(patch.notes ?? g.notes),
			(patch.archived ?? g.archived) ? 'arsip' : ''
		],
		GOALS_TAB
	);
	return { persisted: true };
}

/**
 * Hapus goal beserta seluruh riwayat setorannya.
 * @param {string} id
 */
export async function deleteGoal(id) {
	if (!isConfigured()) return { persisted: false };
	const { goals, logs } = await readAll();
	const g = goals.find((x) => x.id === id);
	if (!g) return { persisted: false, notFound: true };
	await deleteRows(logs.filter((l) => l.goalId === id).map((l) => l.rowNumber), LOG_TAB);
	await deleteRows([g.rowNumber], GOALS_TAB);
	return { persisted: true };
}

/**
 * Catat setoran (amount positif) atau penarikan (negatif).
 * @param {string} goalId
 * @param {{ amount: number, date?: string, note?: string, source?: 'web' | 'telegram', user?: string }} input
 */
export async function addContribution(goalId, input) {
	if (!isConfigured()) return { persisted: false };
	const { goals } = await readAll();
	if (!goals.some((g) => g.id === goalId)) return { persisted: false, notFound: true };
	await appendRow(
		[text(newId()), text(goalId), input.date || todayJakarta(), String(Math.round(input.amount)), text(input.note ?? ''), input.source ?? 'web', text(input.user ?? '')],
		LOG_TAB
	);
	return { persisted: true };
}

/**
 * Hapus satu catatan setoran.
 * @param {string} id
 */
export async function deleteContribution(id) {
	if (!isConfigured()) return { persisted: false };
	const { logs } = await readAll();
	const l = logs.find((x) => x.id === id);
	if (!l) return { persisted: false, notFound: true };
	await deleteRows([l.rowNumber], LOG_TAB);
	return { persisted: true };
}

// Data contoh (dev/preview), tanggal relatif terhadap hari ini supaya progresnya masuk akal.
/** @param {string} today */
function demoData(today) {
	/** @type {GoalRow[]} */
	const goals = [
		{ id: 'demo-1', created: addDays(today, -150), name: 'Dana darurat 6 bulan', type: 'Dana darurat', target: 30_000_000, deadline: addDays(today, 420), notes: '', archived: false, rowNumber: 2 },
		{ id: 'demo-2', created: addDays(today, -60), name: 'Laptop kerja baru', type: 'Keinginan', target: 18_000_000, deadline: addDays(today, 150), notes: 'MacBook Air', archived: false, rowNumber: 3 },
		{ id: 'demo-3', created: addDays(today, -30), name: 'DP rumah', type: 'Kebutuhan masa depan', target: 120_000_000, deadline: addDays(today, 1460), notes: '', archived: false, rowNumber: 4 },
		{ id: 'demo-4', created: addDays(today, -200), name: 'Liburan ke Jepang', type: 'Keinginan', target: 15_000_000, deadline: '', notes: '', archived: false, rowNumber: 5 }
	];
	/** @type {GoalLog[]} */
	const logs = [];
	/** @type {[string, number, number][]} */
	const plan = [['demo-1', 1_700_000, 5], ['demo-2', 1_800_000, 2], ['demo-3', 2_000_000, 1], ['demo-4', 2_500_000, 6]];
	for (const [goalId, amount, months] of plan) {
		for (let m = 0; m < months; m++) {
			logs.push({ id: `${goalId}-${m}`, goalId, date: addDays(today, -m * 30 - 3), amount, note: 'Setoran bulanan', source: 'web', rowNumber: 0 });
		}
	}
	return { goals, logs };
}
