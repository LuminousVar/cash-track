// Ikon goal: glyph solid buatan sendiri, satu keluarga dengan ikon kategori dan logo
// (grid 256, isi solid, potongan datar, celah 16 antarbagian, lubang lewat evenodd).
// Seperti logo merek pada transaksi, ikon ditebak dari nama goal. User bisa memilih
// ikon sendiri di form goal; pilihannya disimpan di kolom "icon" tab Goals.
import { GOAL_TYPE_STYLE } from './goal-style.js';

/** @type {Record<string, { label: string, d: string }>} */
export const GOAL_ICONS = {
	// Atap dan rumah dengan pintu melengkung.
	rumah: { label: 'Rumah', d: 'M128 28L232 116L24 116ZM56 132H200V216A8 8 0 0 1 192 224H148V196A20 20 0 0 0 108 196V224H64A8 8 0 0 1 56 216Z' },
	// Mobil tampak samping, roda di dalam lengkung spakbor.
	mobil: { label: 'Mobil', d: 'M20 136A20 20 0 0 1 40 116H64L92 56H168L204 116H216A20 20 0 0 1 236 136V164A12 12 0 0 1 224 176H220A40 40 0 0 0 140 176H116A40 40 0 0 0 36 176H32A12 12 0 0 1 20 164ZM100 72L124 72L124 100L87 100ZM140 72L161 72L178 100L140 100ZM52 176A24 24 0 1 1 100 176A24 24 0 1 1 52 176ZM156 176A24 24 0 1 1 204 176A24 24 0 1 1 156 176Z' },
	// Motor tampak samping: dua roda, tangki, dan setang.
	motor: { label: 'Motor', d: 'M24 168A40 40 0 1 1 104 168A40 40 0 1 1 24 168ZM46 168A18 18 0 1 1 82 168A18 18 0 1 1 46 168ZM156 168A40 40 0 1 1 236 168A40 40 0 1 1 156 168ZM178 168A18 18 0 1 1 214 168A18 18 0 1 1 178 168ZM32 96L108 96L124 80L168 80L172 96L148 140L112 144L104 112L32 112ZM160 36L204 36L204 52L194 52L210 112L192 112L176 52L160 52Z' },
	// Layar berbingkai dan alas bertakik.
	laptop: { label: 'Laptop', d: 'M60 44H196A12 12 0 0 1 208 56V144A12 12 0 0 1 196 156H60A12 12 0 0 1 48 144V56A12 12 0 0 1 60 44ZM68 60H188A4 4 0 0 1 192 64V136A4 4 0 0 1 188 140H68A4 4 0 0 1 64 136V64A4 4 0 0 1 68 60ZM20 172H104V180H152V172H236V192A12 12 0 0 1 224 204H32A12 12 0 0 1 20 192Z' },
	// Bingkai ponsel dengan pulau kamera.
	ponsel: { label: 'Ponsel', d: 'M96 20H160A32 32 0 0 1 192 52V204A32 32 0 0 1 160 236H96A32 32 0 0 1 64 204V52A32 32 0 0 1 96 20ZM98 36H158A18 18 0 0 1 176 54V202A18 18 0 0 1 158 220H98A18 18 0 0 1 80 202V54A18 18 0 0 1 98 36ZM118 50H138A6 6 0 0 1 144 56V56A6 6 0 0 1 138 62H118A6 6 0 0 1 112 56V56A6 6 0 0 1 118 50Z' },
	// Tiga unit rak, masing-masing dengan slot dan dua lampu.
	server: { label: 'Server', d: 'M44 34H212A12 12 0 0 1 224 46V74A12 12 0 0 1 212 86H44A12 12 0 0 1 32 74V46A12 12 0 0 1 44 34ZM62 54H122A6 6 0 0 1 128 60V60A6 6 0 0 1 122 66H62A6 6 0 0 1 56 60V60A6 6 0 0 1 62 54ZM164 60A8 8 0 1 1 180 60A8 8 0 1 1 164 60ZM188 60A8 8 0 1 1 204 60A8 8 0 1 1 188 60ZM44 102H212A12 12 0 0 1 224 114V142A12 12 0 0 1 212 154H44A12 12 0 0 1 32 142V114A12 12 0 0 1 44 102ZM62 122H122A6 6 0 0 1 128 128V128A6 6 0 0 1 122 134H62A6 6 0 0 1 56 128V128A6 6 0 0 1 62 122ZM164 128A8 8 0 1 1 180 128A8 8 0 1 1 164 128ZM188 128A8 8 0 1 1 204 128A8 8 0 1 1 188 128ZM44 170H212A12 12 0 0 1 224 182V210A12 12 0 0 1 212 222H44A12 12 0 0 1 32 210V182A12 12 0 0 1 44 170ZM62 190H122A6 6 0 0 1 128 196V196A6 6 0 0 1 122 202H62A6 6 0 0 1 56 196V196A6 6 0 0 1 62 190ZM164 196A8 8 0 1 1 180 196A8 8 0 1 1 164 196ZM188 196A8 8 0 1 1 204 196A8 8 0 1 1 188 196Z' },
	// Badan kamera, lensa bercincin, lampu kilat.
	kamera: { label: 'Kamera', d: 'M24 96A24 24 0 0 1 48 72H84L100 44H156L172 72H208A24 24 0 0 1 232 96V196A24 24 0 0 1 208 220H48A24 24 0 0 1 24 196ZM76 146A52 52 0 1 1 180 146A52 52 0 1 1 76 146ZM96 146A32 32 0 1 1 160 146A32 32 0 1 1 96 146ZM188 92H204A4 4 0 0 1 208 96V102A4 4 0 0 1 204 106H188A4 4 0 0 1 184 102V96A4 4 0 0 1 188 92Z' },
	// Tiga batang emas bertumpuk.
	emas: { label: 'Emas', d: 'M28 196L120 196L108 136L40 136ZM136 196L228 196L216 136L148 136ZM82 120L174 120L162 60L94 60Z' },
	// Koin dengan simbol B bergaris.
	kripto: { label: 'Kripto', d: 'M24 128A104 104 0 1 1 232 128A104 104 0 1 1 24 128ZM88 72H100V56H112V72H124V56H136V72A26 26 0 0 1 136 124H144A30 30 0 0 1 144 184H136V200H124V184H112V200H100V184H88ZM108 88H128A12 12 0 0 1 140 100V100A12 12 0 0 1 128 112H108V88ZM108 136H132A16 16 0 0 1 148 152V152A16 16 0 0 1 132 168H108V136Z' },
	// Tiga batang naik, sama dengan ikon kategori Investasi.
	saham: { label: 'Saham & reksa dana', d: 'M48 172H80A8 8 0 0 1 88 180V212A8 8 0 0 1 80 220H48A8 8 0 0 1 40 212V180A8 8 0 0 1 48 172ZM112 132H144A8 8 0 0 1 152 140V212A8 8 0 0 1 144 220H112A8 8 0 0 1 104 212V140A8 8 0 0 1 112 132ZM176 92H208A8 8 0 0 1 216 100V212A8 8 0 0 1 208 220H176A8 8 0 0 1 168 212V100A8 8 0 0 1 176 92ZM176 28H208A8 8 0 0 1 216 36V68A8 8 0 0 1 208 76H176A8 8 0 0 1 168 68V36A8 8 0 0 1 176 28Z' },
	// Pesawat tampak atas.
	liburan: { label: 'Liburan', d: 'M114 34A14 14 0 0 1 142 34V96L232 150V174L142 146V196L172 218V236L128 222L84 236V218L114 196V146L24 174V150L114 96Z' },
	// Topi wisuda dengan rumbai.
	pendidikan: { label: 'Pendidikan', d: 'M128 48L236 100L128 152L20 100ZM72 142L128 169L184 142V192Q128 224 72 192ZM208 132A6 6 0 0 1 220 132V176H222A6 6 0 0 1 228 182V198A6 6 0 0 1 222 204H206A6 6 0 0 1 200 198V182A6 6 0 0 1 206 176H208Z' },
	// Cincin dengan permata.
	nikah: { label: 'Pernikahan', d: 'M60 160A68 68 0 1 1 196 160A68 68 0 1 1 60 160ZM84 160A44 44 0 1 1 172 160A44 44 0 1 1 84 160ZM104 24L152 24L172 44L128 76L84 44Z' },
	// Perisai dengan tanda centang.
	asuransi: { label: 'Asuransi', d: 'M128 20L212 52V116C212 172 176 212 128 236C80 212 44 172 44 116V52ZM77.51 136.49L116 174.97L178.49 112.49L161.51 95.51L116 141.03L94.49 119.51Z' },
	// Payung: sedia sebelum hujan.
	darurat: { label: 'Dana darurat', d: 'M24 132A104 104 0 0 1 232 132A26 26 0 0 0 180 132A26 26 0 0 0 128 132A26 26 0 0 0 76 132A26 26 0 0 0 24 132ZM120 148H136V204A28 28 0 0 1 80 204V196H96V204A12 12 0 0 0 120 204Z' },
	// Kapsul, sama dengan ikon kategori Kesehatan.
	kesehatan: { label: 'Kesehatan', d: 'M91.23 102.54L54.46 139.31A44 44 0 0 0 116.69 201.54L153.46 164.77ZM102.54 91.23L139.31 54.46A44 44 0 0 1 201.54 116.69L164.77 153.46Z' },
	// Kotak hadiah dengan pita dan simpul.
	hadiah: { label: 'Hadiah', d: 'M36 84H120V124H36A8 8 0 0 1 28 116V92A8 8 0 0 1 36 84ZM136 84H220A8 8 0 0 1 228 92V116A8 8 0 0 1 220 124H136V84ZM44 140H120V228H56A12 12 0 0 1 44 216V140ZM136 140H212V216A12 12 0 0 1 200 228H136V140ZM80 56A20 20 0 1 1 120 56A20 20 0 1 1 80 56ZM92 56A8 8 0 1 1 108 56A8 8 0 1 1 92 56ZM136 56A20 20 0 1 1 176 56A20 20 0 1 1 136 56ZM148 56A8 8 0 1 1 164 56A8 8 0 1 1 148 56Z' },
	// Brankas dengan tombol putar dan gagang.
	brankas: { label: 'Tabungan', d: 'M52 32H204A24 24 0 0 1 228 56V184A24 24 0 0 1 204 208H52A24 24 0 0 1 28 184V56A24 24 0 0 1 52 32ZM64 120A48 48 0 1 1 160 120A48 48 0 1 1 64 120ZM82 120A30 30 0 1 1 142 120A30 30 0 1 1 82 120ZM198 96H198A6 6 0 0 1 204 102V138A6 6 0 0 1 198 144H198A6 6 0 0 1 192 138V102A6 6 0 0 1 198 96ZM52 216H92V226A6 6 0 0 1 86 232H58A6 6 0 0 1 52 226V216ZM164 216H204V226A6 6 0 0 1 198 232H170A6 6 0 0 1 164 226V216Z' },
	// Bendera berekor.
	bendera: { label: 'Lainnya', d: 'M50 20H50A10 10 0 0 1 60 30V226A10 10 0 0 1 50 236H50A10 10 0 0 1 40 226V30A10 10 0 0 1 50 20ZM76 28L220 28L188 80L220 132L76 132Z' }
};

// Kata kunci per ikon, dicocokkan per kata utuh pada nama goal. Kalau beberapa cocok,
// yang terpanjang menang, jadi "rumah sakit" jadi Kesehatan, bukan Rumah.
/** @type {[string, string[]][]} */
const KEYWORDS = [
	['darurat', ['dana darurat', 'darurat', 'emergency', 'dana cadangan']],
	['asuransi', ['asuransi', 'bpjs', 'proteksi', 'insurance', 'premi']],
	['emas', ['emas', 'gold', 'logam mulia', 'antam']],
	['kripto', ['kripto', 'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'usdt']],
	['saham', ['saham', 'reksa dana', 'reksadana', 'investasi', 'obligasi', 'sbn', 'sukuk', 'deposito', 'pensiun', 'dividen']],
	['rumah', ['rumah', 'dp', 'kpr', 'apartemen', 'properti', 'tanah', 'renovasi', 'kontrakan', 'kos']],
	['mobil', ['mobil', 'car', 'suv']],
	['motor', ['motor', 'motorcycle', 'vespa', 'nmax', 'pcx', 'scoopy', 'vario', 'aerox', 'xmax']],
	['laptop', ['laptop', 'macbook', 'notebook', 'komputer', 'pc', 'thinkpad', 'monitor']],
	['ponsel', ['hp', 'handphone', 'ponsel', 'smartphone', 'iphone', 'tablet', 'ipad']],
	['server', ['server', 'homelab', 'nas', 'vps']],
	['kamera', ['kamera', 'camera', 'lensa', 'drone', 'gopro']],
	['liburan', ['liburan', 'travel', 'trip', 'jalan jalan', 'umroh', 'umrah', 'haji', 'tiket pesawat', 'pesawat', 'mudik', 'honeymoon']],
	['pendidikan', ['pendidikan', 'sekolah', 'kuliah', 'kursus', 'sertifikasi', 'bootcamp', 'spp', 'wisuda']],
	['nikah', ['nikah', 'menikah', 'pernikahan', 'wedding', 'lamaran', 'cincin', 'mahar', 'resepsi', 'tunangan']],
	['kesehatan', ['kesehatan', 'operasi', 'medis', 'dokter', 'gigi', 'lasik', 'persalinan', 'melahirkan', 'rumah sakit']],
	['hadiah', ['hadiah', 'kado', 'gift', 'ulang tahun', 'anniversary']]
];

/**
 * Ikon dari nama goal, string kosong kalau tidak ada kata kunci yang cocok.
 * @param {string} name
 */
export function detectGoalIcon(name) {
	const words = ` ${String(name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
	let best = '';
	let len = 0;
	for (const [icon, keys] of KEYWORDS)
		for (const k of keys) if (k.length > len && words.includes(` ${k} `)) [best, len] = [icon, k.length];
	return best;
}

/**
 * Ikon yang dipakai: pilihan user, tebakan dari nama, lalu ikon jenis goal.
 * @param {{ icon?: string, name: string, type: string }} goal
 */
export function goalIcon(goal) {
	if (goal.icon && GOAL_ICONS[goal.icon]) return goal.icon;
	return detectGoalIcon(goal.name) || (GOAL_TYPE_STYLE[goal.type] ?? GOAL_TYPE_STYLE.Lainnya).icon;
}
