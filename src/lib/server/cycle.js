// Periode gajian yang sedang berjalan. Tanggal gajian dari env CYCLE_START_DAY
// (default 1 = bulan kalender). Aturan periodenya ada di $lib/format.js.
import { env } from '$env/dynamic/private';
import { normStartDay, todayJakarta, cycleKey, cycleRange, cycleLabel, cycleRangeLabel, daysBetween } from '$lib/format.js';

export function getCycleStartDay() {
	return normStartDay(env.CYCLE_START_DAY);
}

/**
 * Info periode hari ini (WIB).
 * `dayIndex` = hari ke berapa dalam periode (mulai 1), `daysLeft` = sisa hari setelah hari ini.
 * @param {Date} [now]
 */
export function currentCycle(now = new Date()) {
	const startDay = getCycleStartDay();
	const today = todayJakarta(now);
	const key = cycleKey(today, startDay);
	const { start, end, days } = cycleRange(key, startDay);
	const dayIndex = daysBetween(start, today) + 1;
	return {
		key,
		startDay,
		start,
		end,
		days,
		dayIndex,
		daysLeft: days - dayIndex,
		label: cycleLabel(key),
		rangeLabel: cycleRangeLabel(key, startDay)
	};
}
