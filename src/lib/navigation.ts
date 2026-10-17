import {
  Award,
  Calculator,
  CalendarDays,
  ClipboardList,
  Coins,
  Factory,
  FileSignature,
  FileText,
  Handshake,
  LayoutDashboard,
  Ruler,
  Table2,
  Truck,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

export type NavGroupId = 'produksi' | 'dokumen' | 'finansial';

/** Dua section besar: Produksi (operasional + dokumen) dan Finansial, masing-masing punya Ringkasan sendiri. */
export type NavSectionId = 'produksi' | 'finansial';

export interface NavItem {
  id: string;
  label: string;
  /** Label pendek untuk sheet Menu HP. */
  shortLabel: string;
  /** Label bottom nav bila berbeda dari shortLabel (ruang per tab sempit). */
  tabLabel?: string;
  href: string;
  icon: LucideIcon;
  group: NavGroupId;
}

export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  produksi: 'Produksi',
  dokumen: 'Dokumen',
  finansial: 'Finansial',
};

export const NAV_SECTION_LABELS: Record<NavSectionId, string> = {
  produksi: 'Produksi',
  finansial: 'Finansial',
};

export const NAV_GROUP_ORDER: NavGroupId[] = ['produksi', 'dokumen', 'finansial'];

export function sectionOfGroup(group: NavGroupId): NavSectionId {
  return group === 'finansial' ? 'finansial' : 'produksi';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'produksi', label: 'Ringkasan Produksi', shortLabel: 'Ringkasan', href: '/produksi', icon: Factory, group: 'produksi' },
  { id: 'data-customer', label: 'Data Customer', shortLabel: 'Customer', href: '/data-customer', icon: Users, group: 'produksi' },
  { id: 'size-chart', label: 'Size Chart', shortLabel: 'Size Chart', href: '/size-chart', icon: Ruler, group: 'produksi' },
  { id: 'data-vendor', label: 'Data Vendor', shortLabel: 'Vendor', href: '/vendor', icon: Truck, group: 'produksi' },
  { id: 'kalender', label: 'Kalender Produksi', shortLabel: 'Kalender', href: '/kalender', icon: CalendarDays, group: 'produksi' },
  { id: 'cost-profit', label: 'Cost & Profit', shortLabel: 'Cost & Profit', tabLabel: 'Cost', href: '/cost-profit', icon: Calculator, group: 'produksi' },
  { id: 'invoice', label: 'Invoice', shortLabel: 'Invoice', href: '/invoice', icon: FileText, group: 'dokumen' },
  { id: 'purchase-order', label: 'Purchase Order', shortLabel: 'Purchase Order', tabLabel: 'PO', href: '/purchase-order', icon: ClipboardList, group: 'dokumen' },
  { id: 'penawaran', label: 'Penawaran Harga', shortLabel: 'Penawaran', href: '/penawaran', icon: FileSignature, group: 'dokumen' },
  { id: 'kerjasama', label: 'Pengajuan Kerjasama', shortLabel: 'Kerjasama', href: '/kerjasama', icon: Handshake, group: 'dokumen' },
  { id: 'dashboard', label: 'Ringkasan Finansial', shortLabel: 'Ringkasan', href: '/', icon: LayoutDashboard, group: 'finansial' },
  { id: 'datatable', label: 'Data Table (Master Order)', shortLabel: 'Data Table', href: '/?tab=datatable', icon: Table2, group: 'finansial' },
  { id: 'cashin', label: 'Arus Kas Masuk', shortLabel: 'Dana Masuk', href: '/?tab=cashin', icon: Coins, group: 'finansial' },
  { id: 'cashout', label: 'Arus Kas Keluar', shortLabel: 'Dana Keluar', href: '/?tab=cashout', icon: WalletCards, group: 'finansial' },
  { id: 'vendor', label: 'Kinerja Mitra Vendor', shortLabel: 'Mitra Vendor', href: '/?tab=vendor', icon: Award, group: 'finansial' },
];

/** Tiga tab tetap per section; slot ke-4 menampilkan halaman aktif bila bukan salah satunya, slot ke-5 tombol Menu. */
const MOBILE_SECTION_TABS: Record<NavSectionId, [string, string, string, string]> = {
  produksi: ['produksi', 'data-customer', 'invoice', 'size-chart'],
  finansial: ['dashboard', 'datatable', 'cashin', 'cashout'],
};

export function navItemById(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}

export function sectionOfNavId(id: string): NavSectionId {
  const item = navItemById(id);
  return item ? sectionOfGroup(item.group) : 'finansial';
}

/**
 * Tab bottom nav HP mengikuti section halaman aktif (K-26, K-27): memilih Ringkasan Finansial atau halaman
 * finansial menampilkan tab Finansial; Ringkasan Produksi, operasional, dan dokumen menampilkan tab Produksi.
 */
export function mobileNavItemsFor(activeId: string): NavItem[] {
  const ids = [...MOBILE_SECTION_TABS[sectionOfNavId(activeId)]];
  if (!ids.includes(activeId) && navItemById(activeId)) ids[3] = activeId;
  return ids.map((id) => navItemById(id)!);
}

const FINANCE_TABS = new Set(['datatable', 'cashin', 'cashout', 'vendor']);

/** Item navigasi yang aktif untuk pathname + query `tab` saat ini. */
export function resolveActiveNavId(pathname: string, tab: string | null): string {
  if (pathname === '/' || pathname === '') {
    return tab && FINANCE_TABS.has(tab) ? tab : 'dashboard';
  }
  if (pathname.startsWith('/cash-in')) return 'cashin';
  if (pathname.startsWith('/cash-out')) return 'cashout';
  if (pathname.startsWith('/orders/')) return 'datatable';
  if (pathname.startsWith('/finance/')) return 'datatable';
  const match = NAV_ITEMS.find((item) => item.href !== '/' && !item.href.startsWith('/?') && pathname.startsWith(item.href));
  return match ? match.id : 'dashboard';
}

export function groupedNavItems(): Array<{ group: NavGroupId; label: string; items: NavItem[] }> {
  return NAV_GROUP_ORDER.map((group) => ({
    group,
    label: NAV_GROUP_LABELS[group],
    items: NAV_ITEMS.filter((item) => item.group === group),
  }));
}
