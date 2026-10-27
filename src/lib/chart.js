// Helper chart, dipakai chart di halaman Laporan dan SVG statis di PDF laporan.

/**
 * Jumlah berjalan, misalnya [1, 2, 3] jadi [1, 3, 6].
 * @param {number[]} values
 */
export function cumulative(values) {
	let s = 0;
	return values.map((v) => (s += v));
}

/**
 * Nilai garis bantu sumbu Y: kelipatan angka bulat dari 0 sampai melewati `max`.
 * @param {number} max
 * @param {number} [count]  kira-kira jumlah interval
 */
export function niceTicks(max, count = 4) {
	if (!(max > 0)) return [0, 1];
	const raw = max / count;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
	return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

/**
 * Atribut `d` untuk garis lurus antar titik.
 * @param {[number, number][]} points
 */
export function linePath(points) {
	return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
}

/**
 * Indeks label sumbu X yang muat tanpa bertabrakan (jarak minimal `gap` px).
 * @param {number} n  jumlah titik
 * @param {number} plotW  lebar area plot
 * @param {number} [gap]
 */
export function labelIndexes(n, plotW, gap = 56) {
	const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / gap))));
	return Array.from({ length: n }, (_, i) => i).filter((i) => i % every === 0);
}
