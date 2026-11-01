// Menu utama, dipakai sidebar (desktop) dan tab bar (HP). `tab`: tampil langsung di tab
// bar HP; sisanya masuk lembar "Lainnya" supaya tab bar cukup lima dan labelnya terbaca.
export const NAV = [
	{ label: 'Ringkasan', href: '/', icon: 'home', tab: true },
	{ label: 'Transaksi', href: '/pengeluaran', icon: 'list', tab: true },
	{ label: 'Laporan', href: '/laporan', icon: 'chart', tab: true },
	{ label: 'Goals', href: '/goals', icon: 'target', tab: true },
	{ label: 'Anggaran', href: '/anggaran', icon: 'wallet', tab: false },
	{ label: 'Pengaturan', href: '/pengaturan', icon: 'settings', tab: false }
];

/**
 * @param {string} pathname
 * @param {string} href
 */
export const isActive = (pathname, href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
