// Daftar merek untuk ikon transaksi. Nama merchant dicocokkan ke alias di sini; kalau
// ketemu, ikon memakai logo merek, kalau tidak, ikon kategori (lihat MerchantIcon).
// Logo diunduh sekali dengan `bun scripts/fetch-brand-logos.js` ke static/brands/.
//
// Aturan alias:
// - Ditulis bebas (huruf besar, spasi, tanda baca diabaikan saat dicocokkan).
// - Dicocokkan per kata utuh, jadi "ovo" tidak cocok dengan "Novotel".
// - `exact`: alias yang juga kata umum (mis. "dana" di "Reksa Dana", "mandiri" di
//   "Toko Mandiri") hanya cocok kalau nama merchant persis alias itu.
// - `si`: slug Simple Icons kalau mereknya ada di sana (logo vektor, CC0).
// - `app`: cari ikon aplikasinya di App Store; `match` wajib ada di nama aplikasi atau
//   penjualnya, supaya tidak salah ambil aplikasi lain. Dipakai kalau situs resminya
//   tidak menyediakan ikon yang cukup besar.
// - `wiki`: file logo di Wikimedia Commons, untuk merek yang ikon aplikasinya berganti
//   gambar promo.
// - `nologo`: sumber yang ada hanya menghasilkan logo terpotong; tampilkan inisial saja.

/**
 * @typedef {{
 *   slug: string, name: string, domain: string, aliases: string[], exact?: string[],
 *   si?: string, app?: { term: string, match: string }, wiki?: string, nologo?: boolean
 * }} Brand
 */

/** @type {Brand[]} */
export const BRANDS = [
	// Minimarket, supermarket, ritel
	{ slug: 'indomaret', name: 'Indomaret', domain: 'indomaret.co.id', aliases: ['indomaret', 'indomaret point', 'indogrosir', 'klik indomaret'], exact: ['idm'], app: { term: 'Klik Indomaret', match: 'klik indomaret perkasa' } },
	{ slug: 'alfamart', name: 'Alfamart', domain: 'alfamart.co.id', aliases: ['alfamart', 'alfa mart', 'sumber alfaria trijaya', 'alfagift', 'alfaexpress'] },
	{ slug: 'alfamidi', name: 'Alfamidi', domain: 'alfamidi.co.id', aliases: ['alfamidi', 'alfa midi', 'midi utama indonesia', 'midi utama'], wiki: 'File:Alfamidi 2015.svg' },
	{ slug: 'lawson', name: 'Lawson', domain: 'lawson.co.id', aliases: ['lawson'], app: { term: 'My LAWSON', match: 'lawson' } },
	{ slug: 'familymart', name: 'FamilyMart', domain: 'familymart.co.id', aliases: ['familymart', 'family mart'], app: { term: 'FamiGO FamilyMart', match: 'fajar mitra' } },
	{ slug: 'circlek', name: 'Circle K', domain: 'circlek.com', aliases: ['circle k', 'circlek'] },
	{ slug: 'superindo', name: 'Superindo', domain: 'superindo.co.id', aliases: ['superindo', 'super indo', 'lion super indo'] },
	{ slug: 'hypermart', name: 'Hypermart', domain: 'hypermart.co.id', aliases: ['hypermart', 'foodmart', 'matahari putra prima'] },
	{ slug: 'transmart', name: 'Transmart', domain: 'transmart.co.id', aliases: ['transmart', 'trans mart', 'carrefour'] },
	{ slug: 'lottemart', name: 'Lotte Mart', domain: 'lottemart.co.id', aliases: ['lotte mart', 'lottemart', 'lotte grosir'] },
	{ slug: 'ranchmarket', name: 'Ranch Market', domain: 'ranchmarket.co.id', aliases: ['ranch market', 'farmers market'], app: { term: 'RANCH Loyalty App', match: 'supra mandiri' } },
	{ slug: 'matahari', name: 'Matahari', domain: 'matahari.com', aliases: ['matahari department store', 'matahari dept store'], app: { term: 'Matahari App', match: 'matahari department' } },
	{ slug: 'acehardware', name: 'ACE Hardware', domain: 'acehardware.co.id', aliases: ['ace hardware', 'azko'], nologo: true },
	{ slug: 'informa', name: 'Informa', domain: 'informa.co.id', aliases: ['informa', 'informa furnishings'], app: { term: 'INFORMA', match: 'home center' } },
	{ slug: 'ikea', name: 'IKEA', domain: 'ikea.co.id', aliases: ['ikea'], si: 'ikea' },
	{ slug: 'gramedia', name: 'Gramedia', domain: 'gramedia.com', aliases: ['gramedia'] },
	{ slug: 'miniso', name: 'Miniso', domain: 'miniso.com', aliases: ['miniso'] },
	{ slug: 'sociolla', name: 'Sociolla', domain: 'sociolla.com', aliases: ['sociolla'], app: { term: 'Sociolla', match: 'social bella' } },
	{ slug: 'erafone', name: 'Erafone', domain: 'erafone.com', aliases: ['erafone', 'erajaya'], app: { term: 'erafone', match: 'erajaya' } },
	{ slug: 'ibox', name: 'iBox', domain: 'ibox.co.id', aliases: ['ibox'] },
	{ slug: 'uniqlo', name: 'Uniqlo', domain: 'uniqlo.com', aliases: ['uniqlo'], si: 'uniqlo' },
	{ slug: 'hm', name: 'H&M', domain: 'hm.com', aliases: ['h&m', 'h and m', 'hennes mauritz'], si: 'handm' },
	{ slug: 'zara', name: 'Zara', domain: 'zara.com', aliases: ['zara'], si: 'zara' },
	{ slug: 'nike', name: 'Nike', domain: 'nike.com', aliases: ['nike'], si: 'nike' },
	{ slug: 'adidas', name: 'Adidas', domain: 'adidas.co.id', aliases: ['adidas'], si: 'adidas' },
	{ slug: 'eiger', name: 'Eiger', domain: 'eigeradventure.com', aliases: ['eiger', 'eiger adventure'] },
	{ slug: 'samsung', name: 'Samsung', domain: 'samsung.com', aliases: ['samsung'], si: 'samsung' },
	{ slug: 'xiaomi', name: 'Xiaomi', domain: 'mi.co.id', aliases: ['xiaomi', 'mi store'], si: 'xiaomi' },

	// Belanja online
	{ slug: 'tokopedia', name: 'Tokopedia', domain: 'tokopedia.com', aliases: ['tokopedia', 'tokped'] },
	{ slug: 'shopee', name: 'Shopee', domain: 'shopee.co.id', aliases: ['shopee', 'shopee food', 'shopeefood', 'shopeepay', 'shopee pay', 'shopee international indonesia'], si: 'shopee' },
	{ slug: 'lazada', name: 'Lazada', domain: 'lazada.co.id', aliases: ['lazada'] },
	{ slug: 'blibli', name: 'Blibli', domain: 'blibli.com', aliases: ['blibli'], si: 'blibli' },
	{ slug: 'bukalapak', name: 'Bukalapak', domain: 'bukalapak.com', aliases: ['bukalapak'], si: 'bukalapak' },
	{ slug: 'tiktok', name: 'TikTok', domain: 'tiktok.com', aliases: ['tiktok', 'tik tok', 'tiktok shop'], si: 'tiktok' },
	{ slug: 'zalora', name: 'Zalora', domain: 'zalora.co.id', aliases: ['zalora'] },
	{ slug: 'amazon', name: 'Amazon', domain: 'amazon.com', aliases: ['amazon', 'amazon com', 'amzn'] },
	{ slug: 'aliexpress', name: 'AliExpress', domain: 'aliexpress.com', aliases: ['aliexpress'], si: 'aliexpress' },

	// Transportasi dan perjalanan
	{ slug: 'gojek', name: 'Gojek', domain: 'gojek.com', aliases: ['gojek', 'go jek', 'gofood', 'go food', 'goride', 'go ride', 'gocar', 'go car', 'gosend', 'go send', 'gomart', 'goto gojek tokopedia'], si: 'gojek' },
	{ slug: 'grab', name: 'Grab', domain: 'grab.com', aliases: ['grab', 'grabfood', 'grab food', 'grabcar', 'grabbike', 'grabmart', 'grabexpress', 'grabpay'], si: 'grab' },
	{ slug: 'maxim', name: 'Maxim', domain: 'maxim.co.id', aliases: ['maxim', 'taxi maxim'] },
	{ slug: 'bluebird', name: 'Bluebird', domain: 'bluebirdgroup.com', aliases: ['bluebird', 'blue bird', 'mybluebird', 'silver bird'] },
	{ slug: 'indrive', name: 'inDrive', domain: 'indrive.com', aliases: ['indrive', 'indriver'] },
	{ slug: 'uber', name: 'Uber', domain: 'uber.com', aliases: ['uber', 'uber eats'], si: 'uber' },
	{ slug: 'kai', name: 'KAI', domain: 'kai.id', aliases: ['kereta api indonesia', 'kai access', 'access by kai'], exact: ['kai'] },
	{ slug: 'krl', name: 'KRL Commuter Line', domain: 'commuterline.id', aliases: ['krl', 'commuter line', 'kai commuter', 'kci'], app: { term: 'C-Access', match: 'kai commuter' } },
	{ slug: 'mrtjakarta', name: 'MRT Jakarta', domain: 'jakartamrt.co.id', aliases: ['mrt jakarta', 'jakarta mrt'], exact: ['mrt'] },
	{ slug: 'transjakarta', name: 'Transjakarta', domain: 'transjakarta.co.id', aliases: ['transjakarta', 'trans jakarta', 'tije'], app: { term: 'TJ Transjakarta', match: 'transportasi jakarta' } },
	{ slug: 'whoosh', name: 'Whoosh', domain: 'kcic.co.id', aliases: ['whoosh', 'kcic', 'kereta cepat'] },
	{ slug: 'garuda', name: 'Garuda Indonesia', domain: 'garuda-indonesia.com', aliases: ['garuda indonesia', 'garuda airlines'] },
	{ slug: 'lionair', name: 'Lion Air', domain: 'lionair.co.id', aliases: ['lion air', 'lionair'] },
	{ slug: 'citilink', name: 'Citilink', domain: 'citilink.co.id', aliases: ['citilink'], app: { term: 'Citilink', match: 'citilink indonesia' } },
	{ slug: 'batikair', name: 'Batik Air', domain: 'batikair.com', aliases: ['batik air', 'batikair'] },
	{ slug: 'airasia', name: 'AirAsia', domain: 'airasia.com', aliases: ['airasia', 'air asia'], si: 'airasia' },
	{ slug: 'traveloka', name: 'Traveloka', domain: 'traveloka.com', aliases: ['traveloka'] },
	{ slug: 'tiketcom', name: 'tiket.com', domain: 'tiket.com', aliases: ['tiket com', 'tiketcom', 'global tiket network'], wiki: 'File:Tiket.com (2017).svg' },
	{ slug: 'pertamina', name: 'Pertamina', domain: 'pertamina.com', aliases: ['pertamina', 'spbu pertamina', 'mypertamina', 'pertamax', 'pertalite'] },
	{ slug: 'shell', name: 'Shell', domain: 'shell.co.id', aliases: ['shell', 'spbu shell'], si: 'shell' },
	{ slug: 'bp', name: 'BP', domain: 'bp.com', aliases: ['bp akr', 'spbu bp'] },
	{ slug: 'jasamarga', name: 'Jasa Marga', domain: 'jasamarga.com', aliases: ['jasa marga', 'jasamarga'] },

	// Makanan dan minuman
	{ slug: 'starbucks', name: 'Starbucks', domain: 'starbucks.co.id', aliases: ['starbucks', 'sbux'], si: 'starbucks' },
	{ slug: 'kopikenangan', name: 'Kopi Kenangan', domain: 'kopikenangan.com', aliases: ['kopi kenangan', 'kenangan coffee', 'kenangan heritage'] },
	{ slug: 'janjijiwa', name: 'Janji Jiwa', domain: 'jiwagroup.com', aliases: ['janji jiwa', 'kopi janji jiwa', 'jiwa toast'], app: { term: 'JIWA+ by Kopi Janji Jiwa', match: 'jiwa tri boga' } },
	{ slug: 'fore', name: 'Fore Coffee', domain: 'fore.coffee', aliases: ['fore coffee'] },
	{ slug: 'tomoro', name: 'Tomoro Coffee', domain: 'tomorocoffee.com', aliases: ['tomoro', 'tomoro coffee'], app: { term: 'TOMORO COFFEE', match: 'kopi bintang' } },
	{ slug: 'pointcoffee', name: 'Point Coffee', domain: 'pointcoffee.id', aliases: ['point coffee'] },
	{ slug: 'chatime', name: 'Chatime', domain: 'chatime.com', aliases: ['chatime'] },
	{ slug: 'mixue', name: 'Mixue', domain: 'mixue.co.id', aliases: ['mixue'] },
	{ slug: 'mcdonalds', name: "McDonald's", domain: 'mcdonalds.co.id', aliases: ['mcdonalds', 'mcdonald', 'mc donalds', 'mc donald', 'mcd'], si: 'mcdonalds' },
	{ slug: 'kfc', name: 'KFC', domain: 'kfcku.com', aliases: ['kfc', 'kentucky fried chicken', 'fast food indonesia'], si: 'kfc' },
	{ slug: 'burgerking', name: 'Burger King', domain: 'burgerking.co.id', aliases: ['burger king', 'burgerking'], si: 'burgerking' },
	{ slug: 'pizzahut', name: 'Pizza Hut', domain: 'pizzahut.co.id', aliases: ['pizza hut', 'pizzahut', 'phd'] },
	{ slug: 'dominos', name: "Domino's", domain: 'dominos.co.id', aliases: ['dominos', 'domino s', 'dominos pizza'] },
	{ slug: 'hokben', name: 'HokBen', domain: 'hokben.co.id', aliases: ['hokben', 'hoka hoka bento'], app: { term: 'HOKBENAJA', match: 'eka bogainti' } },
	{ slug: 'solaria', name: 'Solaria', domain: 'solaria.co.id', aliases: ['solaria'] },
	{ slug: 'richeese', name: 'Richeese Factory', domain: 'richeesefactory.com', aliases: ['richeese', 'richeese factory'] },
	{ slug: 'miegacoan', name: 'Mie Gacoan', domain: 'miegacoan.co.id', aliases: ['mie gacoan', 'gacoan'] },
	{ slug: 'marugame', name: 'Marugame Udon', domain: 'marugameudon.co.id', aliases: ['marugame', 'marugame udon'] },
	{ slug: 'yoshinoya', name: 'Yoshinoya', domain: 'yoshinoya.co.id', aliases: ['yoshinoya'] },
	{ slug: 'jco', name: 'J.CO', domain: 'jcodonuts.com', aliases: ['j co', 'jco', 'jco donuts'] },
	{ slug: 'dunkin', name: "Dunkin'", domain: 'dunkindonuts.com', aliases: ['dunkin', 'dunkin donuts'] },
	{ slug: 'haidilao', name: 'Haidilao', domain: 'haidilao.com', aliases: ['haidilao', 'hai di lao'] },
	{ slug: 'rotio', name: "Roti'O", domain: 'rotio.id', aliases: ['roti o', 'rotio'] },
	{ slug: 'hollandbakery', name: 'Holland Bakery', domain: 'hollandbakery.co.id', aliases: ['holland bakery'], app: { term: 'Holland Bakery', match: 'mustika citra' } },
	{ slug: 'breadtalk', name: 'BreadTalk', domain: 'breadtalk.com', aliases: ['breadtalk', 'bread talk'], app: { term: 'BreadTalk Group Rewards', match: 'breadtalk pte' } },

	// Kesehatan
	{ slug: 'kimiafarma', name: 'Kimia Farma', domain: 'kimiafarma.co.id', aliases: ['kimia farma', 'kimiafarma'], app: { term: 'Kimia Farma Mobile', match: 'kimia farma' } },
	{ slug: 'k24', name: 'Apotek K24', domain: 'k24klik.com', aliases: ['k24', 'apotek k24', 'k24klik'] },
	{ slug: 'guardian', name: 'Guardian', domain: 'guardianindonesia.co.id', aliases: ['guardian'] },
	{ slug: 'watsons', name: 'Watsons', domain: 'watsons.co.id', aliases: ['watsons'] },
	{ slug: 'century', name: 'Century', domain: 'century.co.id', aliases: ['apotek century', 'century healthcare'] },
	{ slug: 'halodoc', name: 'Halodoc', domain: 'halodoc.com', aliases: ['halodoc'], app: { term: 'Halodoc', match: 'media dokter' } },
	{ slug: 'alodokter', name: 'Alodokter', domain: 'alodokter.com', aliases: ['alodokter'] },
	{ slug: 'bpjs', name: 'BPJS Kesehatan', domain: 'bpjs-kesehatan.go.id', aliases: ['bpjs', 'bpjs kesehatan'] },
	{ slug: 'siloam', name: 'Siloam Hospitals', domain: 'siloamhospitals.com', aliases: ['siloam', 'siloam hospitals', 'rs siloam'] },
	{ slug: 'mitrakeluarga', name: 'Mitra Keluarga', domain: 'mitrakeluarga.com', aliases: ['mitra keluarga', 'rs mitra keluarga'] },

	// Tagihan: listrik, telko, internet
	{ slug: 'pln', name: 'PLN', domain: 'pln.co.id', aliases: ['pln', 'token listrik', 'pln mobile', 'perusahaan listrik negara'], app: { term: 'PLN Mobile', match: 'pln' } },
	{ slug: 'telkomsel', name: 'Telkomsel', domain: 'telkomsel.com', aliases: ['telkomsel', 'simpati', 'kartu as', 'mytelkomsel'] },
	{ slug: 'byu', name: 'by.U', domain: 'byu.id', aliases: ['by u', 'byu'] },
	{ slug: 'indosat', name: 'Indosat', domain: 'ioh.co.id', aliases: ['indosat', 'im3', 'indosat ooredoo', 'myim3'] },
	{ slug: 'xl', name: 'XL', domain: 'xl.co.id', aliases: ['xl axiata', 'myxl'], exact: ['xl'] },
	{ slug: 'axis', name: 'AXIS', domain: 'axis.co.id', aliases: ['axisnet'], exact: ['axis'] },
	{ slug: 'smartfren', name: 'Smartfren', domain: 'smartfren.com', aliases: ['smartfren'] },
	{ slug: 'tri', name: 'Tri', domain: 'tri.co.id', aliases: ['tri indonesia', 'bima tri', 'bimaplus'] },
	{ slug: 'indihome', name: 'IndiHome', domain: 'indihome.co.id', aliases: ['indihome', 'telkom indonesia', 'myindihome'] },
	{ slug: 'biznet', name: 'Biznet', domain: 'biznetnetworks.com', aliases: ['biznet', 'biznet home'] },
	{ slug: 'firstmedia', name: 'First Media', domain: 'firstmedia.com', aliases: ['first media', 'firstmedia'], app: { term: 'My FirstMedia', match: 'first media' } },
	{ slug: 'myrepublic', name: 'MyRepublic', domain: 'myrepublic.co.id', aliases: ['myrepublic', 'my republic'] },
	{ slug: 'iconnet', name: 'ICONNET', domain: 'iconnet.id', aliases: ['iconnet', 'icon plus'] },

	// Bank, dompet digital, pembayaran
	{ slug: 'bca', name: 'BCA', domain: 'bca.co.id', aliases: ['bca', 'bank central asia', 'klikbca', 'mybca', 'bca mobile'], app: { term: 'BCA mobile', match: 'bank central asia' } },
	{ slug: 'mandiri', name: 'Bank Mandiri', domain: 'bankmandiri.co.id', aliases: ['bank mandiri', 'livin by mandiri', 'livin mandiri', 'mandiri e money'] },
	{ slug: 'bri', name: 'BRI', domain: 'bri.co.id', aliases: ['bri', 'bank rakyat indonesia', 'brimo'] },
	{ slug: 'bni', name: 'BNI', domain: 'bni.co.id', aliases: ['bni', 'bank negara indonesia', 'wondr'] },
	{ slug: 'cimbniaga', name: 'CIMB Niaga', domain: 'cimbniaga.co.id', aliases: ['cimb niaga', 'cimb', 'octo mobile'], app: { term: 'OCTO by CIMB Niaga', match: 'cimb niaga' } },
	{ slug: 'jago', name: 'Bank Jago', domain: 'jago.com', aliases: ['bank jago'] },
	{ slug: 'seabank', name: 'SeaBank', domain: 'seabank.co.id', aliases: ['seabank', 'sea bank'] },
	{ slug: 'jenius', name: 'Jenius', domain: 'jenius.com', aliases: ['jenius'] },
	{ slug: 'dana', name: 'DANA', domain: 'dana.id', aliases: ['dana indonesia', 'top up dana', 'dana id', 'espay debit indonesia'], exact: ['dana'] },
	{ slug: 'ovo', name: 'OVO', domain: 'ovo.id', aliases: ['ovo', 'top up ovo'], app: { term: 'OVO', match: 'visionet' } },
	{ slug: 'linkaja', name: 'LinkAja', domain: 'linkaja.id', aliases: ['linkaja', 'link aja'], app: { term: 'LinkAja', match: 'fintek karya' } },
	{ slug: 'gopay', name: 'GoPay', domain: 'gopay.co.id', aliases: ['gopay', 'go pay', 'top up gopay'] },
	{ slug: 'flip', name: 'Flip', domain: 'flip.id', aliases: ['flip id'], exact: ['flip'] },
	{ slug: 'kredivo', name: 'Kredivo', domain: 'kredivo.com', aliases: ['kredivo'], app: { term: 'Kredivo', match: 'kredivo finance' } },
	{ slug: 'akulaku', name: 'Akulaku', domain: 'akulaku.com', aliases: ['akulaku'], app: { term: 'Akulaku', match: 'akulaku' } },
	{ slug: 'paypal', name: 'PayPal', domain: 'paypal.com', aliases: ['paypal'], si: 'paypal' },
	{ slug: 'wise', name: 'Wise', domain: 'wise.com', aliases: ['wise payments', 'transferwise'], si: 'wise' },

	// Investasi
	{ slug: 'bibit', name: 'Bibit', domain: 'bibit.id', aliases: ['bibit', 'bibit tumbuh bersama'] },
	{ slug: 'bareksa', name: 'Bareksa', domain: 'www.bareksa.com', aliases: ['bareksa'] },
	{ slug: 'ajaib', name: 'Ajaib', domain: 'ajaib.co.id', aliases: ['ajaib', 'ajaib sekuritas'] },
	{ slug: 'stockbit', name: 'Stockbit', domain: 'stockbit.com', aliases: ['stockbit', 'stockbit sekuritas'] },
	{ slug: 'pluang', name: 'Pluang', domain: 'pluang.com', aliases: ['pluang'] },
	{ slug: 'pintu', name: 'Pintu', domain: 'pintu.co.id', aliases: ['pintu kemana saja', 'pintu crypto'], exact: ['pintu'] },
	{ slug: 'indodax', name: 'Indodax', domain: 'indodax.com', aliases: ['indodax'] },
	{ slug: 'tokocrypto', name: 'Tokocrypto', domain: 'tokocrypto.com', aliases: ['tokocrypto'] },
	{ slug: 'binance', name: 'Binance', domain: 'binance.com', aliases: ['binance'], si: 'binance' },
	{ slug: 'pegadaian', name: 'Pegadaian', domain: 'pegadaian.co.id', aliases: ['pegadaian', 'tabungan emas pegadaian'], wiki: 'File:Pegadaian logo (2013).svg' },
	{ slug: 'antam', name: 'Antam Logam Mulia', domain: 'logammulia.com', aliases: ['antam', 'logam mulia'] },

	// Hiburan dan langganan
	{ slug: 'netflix', name: 'Netflix', domain: 'netflix.com', aliases: ['netflix'], si: 'netflix' },
	{ slug: 'spotify', name: 'Spotify', domain: 'spotify.com', aliases: ['spotify'], si: 'spotify' },
	{ slug: 'youtube', name: 'YouTube', domain: 'youtube.com', aliases: ['youtube', 'youtube premium', 'youtube music'], si: 'youtube' },
	{ slug: 'disneyplus', name: 'Disney+ Hotstar', domain: 'hotstar.com', aliases: ['disney', 'disney hotstar', 'disneyplus', 'hotstar'] },
	{ slug: 'primevideo', name: 'Prime Video', domain: 'primevideo.com', aliases: ['prime video', 'primevideo', 'amazon prime'] },
	{ slug: 'vidio', name: 'Vidio', domain: 'vidio.com', aliases: ['vidio', 'vidio premier'] },
	{ slug: 'viu', name: 'Viu', domain: 'viu.com', aliases: ['viu', 'viu premium'] },
	{ slug: 'wetv', name: 'WeTV', domain: 'wetv.vip', aliases: ['wetv', 'we tv'], app: { term: 'WeTV', match: 'image future' } },
	{ slug: 'cinemaxxi', name: 'Cinema XXI', domain: '21cineplex.com', aliases: ['cinema xxi', 'xxi', 'cinema 21', 'm tix', 'mtix', 'nusantara sejahtera raya'], app: { term: 'm.tix XXI', match: 'nusantara sejahtera raya' } },
	{ slug: 'cgv', name: 'CGV', domain: 'cgv.id', aliases: ['cgv', 'cgv cinemas'] },
	{ slug: 'cinepolis', name: 'Cinépolis', domain: 'cinepolis.co.id', aliases: ['cinepolis'] },
	{ slug: 'steam', name: 'Steam', domain: 'store.steampowered.com', aliases: ['steampowered', 'steam games', 'steam store', 'valve'], exact: ['steam'], si: 'steam' },
	{ slug: 'playstation', name: 'PlayStation', domain: 'playstation.com', aliases: ['playstation', 'psn', 'playstation network', 'sony interactive'], si: 'playstation' },
	{ slug: 'nintendo', name: 'Nintendo', domain: 'nintendo.com', aliases: ['nintendo', 'nintendo eshop'] },
	{ slug: 'xbox', name: 'Xbox', domain: 'xbox.com', aliases: ['xbox', 'xbox game pass'] },
	{ slug: 'epicgames', name: 'Epic Games', domain: 'epicgames.com', aliases: ['epic games', 'epicgames'], si: 'epicgames' },
	{ slug: 'duolingo', name: 'Duolingo', domain: 'duolingo.com', aliases: ['duolingo'], si: 'duolingo' },

	// Teknologi, AI, software
	{ slug: 'apple', name: 'Apple', domain: 'apple.com', aliases: ['apple', 'apple com bill', 'itunes', 'icloud', 'app store', 'apple music', 'apple one'], si: 'apple' },
	{ slug: 'googleplay', name: 'Google Play', domain: 'play.google.com', aliases: ['google play', 'googleplay'], si: 'googleplay' },
	{ slug: 'google', name: 'Google', domain: 'google.com', aliases: ['google', 'google one', 'google workspace', 'gemini'], si: 'google' },
	{ slug: 'googlecloud', name: 'Google Cloud', domain: 'cloud.google.com', aliases: ['google cloud', 'gcp'], si: 'googlecloud' },
	{ slug: 'anthropic', name: 'Anthropic', domain: 'anthropic.com', aliases: ['anthropic', 'anthropic pbc'], si: 'anthropic' },
	{ slug: 'claude', name: 'Claude', domain: 'claude.ai', aliases: ['claude', 'claude ai', 'claude pro', 'claude max'], si: 'claude' },
	{ slug: 'openai', name: 'OpenAI', domain: 'openai.com', aliases: ['openai', 'open ai', 'chatgpt', 'chat gpt'] },
	{ slug: 'perplexity', name: 'Perplexity', domain: 'perplexity.ai', aliases: ['perplexity', 'perplexity ai'], si: 'perplexity' },
	{ slug: 'cursor', name: 'Cursor', domain: 'cursor.com', aliases: ['cursor', 'anysphere'], si: 'cursor' },
	{ slug: 'github', name: 'GitHub', domain: 'github.com', aliases: ['github', 'github copilot'], si: 'github' },
	{ slug: 'vercel', name: 'Vercel', domain: 'vercel.com', aliases: ['vercel'], si: 'vercel' },
	{ slug: 'cloudflare', name: 'Cloudflare', domain: 'cloudflare.com', aliases: ['cloudflare'], si: 'cloudflare' },
	{ slug: 'digitalocean', name: 'DigitalOcean', domain: 'digitalocean.com', aliases: ['digitalocean', 'digital ocean'], si: 'digitalocean' },
	{ slug: 'aws', name: 'Amazon Web Services', domain: 'aws.amazon.com', aliases: ['aws', 'amazon web services'] },
	{ slug: 'microsoft', name: 'Microsoft', domain: 'microsoft.com', aliases: ['microsoft', 'microsoft 365', 'office 365', 'msft'] },
	{ slug: 'adobe', name: 'Adobe', domain: 'adobe.com', aliases: ['adobe', 'adobe creative cloud'] },
	{ slug: 'canva', name: 'Canva', domain: 'canva.com', aliases: ['canva', 'canva pro'] },
	{ slug: 'figma', name: 'Figma', domain: 'figma.com', aliases: ['figma'], si: 'figma' },
	{ slug: 'notion', name: 'Notion', domain: 'notion.so', aliases: ['notion', 'notion labs'], si: 'notion' },
	{ slug: 'jetbrains', name: 'JetBrains', domain: 'jetbrains.com', aliases: ['jetbrains'], si: 'jetbrains' },
	{ slug: 'zoom', name: 'Zoom', domain: 'zoom.us', aliases: ['zoom', 'zoom us', 'zoom video'], si: 'zoom' },
	{ slug: 'dropbox', name: 'Dropbox', domain: 'dropbox.com', aliases: ['dropbox'], si: 'dropbox' }
];

// Kata badan usaha dan pelengkap yang tidak membantu mengenali merek.
const NOISE = new Set(['pt', 'tbk', 'cv', 'persero', 'ltd', 'inc', 'pbc', 'llc', 'corp', 'the']);

/**
 * Pecah teks jadi kata: huruf kecil, tanpa aksen dan tanda baca, tanpa kata badan usaha.
 * @param {unknown} s
 */
function words(s) {
	return String(s ?? '')
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.split(' ')
		.filter((w) => w && !NOISE.has(w));
}

// Indeks alias dalam bentuk rapat ("alfa midi" dan "alfamidi" jadi "alfamidi").
/** @type {Map<string, Brand>} */
const INDEX = new Map();
/** @type {Map<string, Brand>} */
const EXACT = new Map();
for (const b of BRANDS) {
	for (const a of b.aliases) INDEX.set(words(a).join(''), b);
	for (const a of b.exact ?? []) EXACT.set(words(a).join(''), b);
}
// Alias satu kata yang cukup panjang juga dicocokkan sebagai awalan kata,
// supaya "Shopeepay" atau "Tokopediacom" tetap dikenali.
const PREFIXES = [...INDEX].filter(([a]) => a.length >= 6);

/** @type {Map<string, Brand | null>} */
const cache = new Map();

/**
 * Merek untuk sebuah nama merchant, atau null. Alias terpanjang yang cocok menang,
 * jadi "Shopee Food" tidak kalah oleh "Shopee", dan "Google Play" oleh "Google".
 * @param {string | undefined} merchant
 * @returns {Brand | null}
 */
export function detectBrand(merchant) {
	const key = String(merchant ?? '');
	if (cache.has(key)) return cache.get(key) ?? null;

	const w = words(key);
	/** @type {Brand | null} */
	let best = EXACT.get(w.join('')) ?? null;
	let bestLen = best ? Infinity : 0;
	for (let i = 0; i < w.length && bestLen !== Infinity; i++) {
		let joined = '';
		// Gabungan 1-4 kata berurutan, cukup untuk alias terpanjang di daftar.
		for (let j = i; j < Math.min(w.length, i + 4); j++) {
			joined += w[j];
			const b = INDEX.get(joined);
			if (b && joined.length > bestLen) [best, bestLen] = [b, joined.length];
		}
		for (const [alias, b] of PREFIXES) {
			if (alias.length > bestLen && w[i].startsWith(alias)) [best, bestLen] = [b, alias.length];
		}
	}

	if (cache.size > 2000) cache.clear();
	cache.set(key, best);
	return best;
}
