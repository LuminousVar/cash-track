<script>
	// Ikon kategori: glyph solid berwarna kategori di atas latar tipis warna yang sama.
	// Dipakai daftar per kategori dan sebagai cadangan ikon merchant.
	// Satu keluarga dengan logo (Logo.svelte): grid 256, isi solid, potongan datar,
	// celah 16 antarbagian. Ujung batang Investasi adalah blok terpisah seperti di logo.
	import { categoryColor, normCategory } from '$lib/format.js';

	/** @type {Record<string, string>} */
	const GLYPHS = {
		// Mangkuk dan sepasang sumpit 60 derajat.
		'Makanan & Minuman':
			'M38 136H214A88 88 0 0 1 38 136ZM101.88 105L126.12 119L170.12 42.79L145.88 28.79ZM149.88 105L174.12 119L218.12 42.79L193.88 28.79Z',
		// Tas belanja dengan gagang lengkung dan dua lubang tali.
		Belanja:
			'M60 88H80V80A48 48 0 0 1 176 80V88H196A8 8 0 0 1 204 96V200A24 24 0 0 1 180 224H76A24 24 0 0 1 52 200V96A8 8 0 0 1 60 88ZM104 88V80A24 24 0 0 1 152 80V88ZM82 112H94A6 6 0 0 1 100 118V130A6 6 0 0 1 94 136H82A6 6 0 0 1 76 130V118A6 6 0 0 1 82 112ZM162 112H174A6 6 0 0 1 180 118V130A6 6 0 0 1 174 136H162A6 6 0 0 1 156 130V118A6 6 0 0 1 162 112Z',
		// Mobil tampak depan: kabin, kaca depan, lampu, roda.
		Transport:
			'M96 36H160A40 40 0 0 1 200 76V116A24 24 0 0 1 224 140V164A24 24 0 0 1 200 188V212A8 8 0 0 1 192 220H160A8 8 0 0 1 152 212V188H104V212A8 8 0 0 1 96 220H64A8 8 0 0 1 56 212V188A24 24 0 0 1 32 164V140A24 24 0 0 1 56 116V76A40 40 0 0 1 96 36ZM88 116V84A8 8 0 0 1 96 76H160A8 8 0 0 1 168 84V116ZM58 136H82A6 6 0 0 1 88 142V158A6 6 0 0 1 82 164H58A6 6 0 0 1 52 158V142A6 6 0 0 1 58 136ZM174 136H198A6 6 0 0 1 204 142V158A6 6 0 0 1 198 164H174A6 6 0 0 1 168 158V142A6 6 0 0 1 174 136Z',
		// Lembar tagihan, sudut terpotong 45 derajat, dua baris.
		Tagihan:
			'M72 32H152L200 80V208A16 16 0 0 1 184 224H72A16 16 0 0 1 56 208V48A16 16 0 0 1 72 32ZM92 112H164A4 4 0 0 1 168 116V136A4 4 0 0 1 164 140H92A4 4 0 0 1 88 136V116A4 4 0 0 1 92 112ZM92 160H132A4 4 0 0 1 136 164V184A4 4 0 0 1 132 188H92A4 4 0 0 1 88 184V164A4 4 0 0 1 92 160Z',
		// Kapsul -45 derajat, dua belahan.
		Kesehatan:
			'M91.23 102.54L54.46 139.31A44 44 0 0 0 116.69 201.54L153.46 164.77ZM102.54 91.23L139.31 54.46A44 44 0 0 1 201.54 116.69L164.77 153.46Z',
		// Tiket bertakik dengan garis sobek.
		Hiburan:
			'M40 56H216A16 16 0 0 1 232 72V100A28 28 0 0 0 232 156V184A16 16 0 0 1 216 200H40A16 16 0 0 1 24 184V156A28 28 0 0 0 24 100V72A16 16 0 0 1 40 56ZM162 80H174A6 6 0 0 1 180 86V110A6 6 0 0 1 174 116H162A6 6 0 0 1 156 110V86A6 6 0 0 1 162 80ZM162 140H174A6 6 0 0 1 180 146V170A6 6 0 0 1 174 176H162A6 6 0 0 1 156 170V146A6 6 0 0 1 162 140Z',
		// Tiga batang naik, puncaknya blok terpisah.
		Investasi:
			'M48 172H80A8 8 0 0 1 88 180V212A8 8 0 0 1 80 220H48A8 8 0 0 1 40 212V180A8 8 0 0 1 48 172ZM112 132H144A8 8 0 0 1 152 140V212A8 8 0 0 1 144 220H112A8 8 0 0 1 104 212V140A8 8 0 0 1 112 132ZM176 92H208A8 8 0 0 1 216 100V212A8 8 0 0 1 208 220H176A8 8 0 0 1 168 212V100A8 8 0 0 1 176 92ZM176 28H208A8 8 0 0 1 216 36V68A8 8 0 0 1 208 76H176A8 8 0 0 1 168 68V36A8 8 0 0 1 176 28Z',
		// Grid 2x2.
		Lainnya:
			'M64 40H96A24 24 0 0 1 120 64V96A24 24 0 0 1 96 120H64A24 24 0 0 1 40 96V64A24 24 0 0 1 64 40ZM160 40H192A24 24 0 0 1 216 64V96A24 24 0 0 1 192 120H160A24 24 0 0 1 136 96V64A24 24 0 0 1 160 40ZM64 136H96A24 24 0 0 1 120 160V192A24 24 0 0 1 96 216H64A24 24 0 0 1 40 192V160A24 24 0 0 1 64 136ZM160 136H192A24 24 0 0 1 216 160V192A24 24 0 0 1 192 216H160A24 24 0 0 1 136 192V160A24 24 0 0 1 160 136Z'
	};

	/** @type {{ category: string, size?: number }} */
	let { category, size = 36 } = $props();

	const cat = $derived(normCategory(category));
	const color = $derived(categoryColor(cat));
	// Kanvas 256 punya margin sekitar 15%, jadi 0.56 di sini setara ukuran ikon garis lama (0.5).
	const glyph = $derived(Math.round(size * 0.56));
</script>

<span
	class="grid shrink-0 place-items-center rounded-[28%]"
	style="width: {size}px; height: {size}px; color: {color}; background: color-mix(in srgb, {color} 13%, transparent)"
	title={cat}
	aria-hidden="true"
>
	<svg viewBox="0 0 256 256" width={glyph} height={glyph}>
		<path fill="currentColor" fill-rule="evenodd" d={GLYPHS[cat]} />
	</svg>
</span>
