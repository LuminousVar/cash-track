// Menu utama, dipakai sidebar (desktop) dan tab bar (HP).
export const NAV = [
	{ label: 'Ringkasan', href: '/', icon: 'home' },
	{ label: 'Transaksi', href: '/pengeluaran', icon: 'list' },
	{ label: 'Laporan', href: '/laporan', icon: 'chart' },
	{ label: 'Anggaran', href: '/anggaran', icon: 'wallet' },
	{ label: 'Pengaturan', href: '/pengaturan', icon: 'settings' }
];

/**
 * @param {string} pathname
 * @param {string} href
 */
export const isActive = (pathname, href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
