import {
  LayoutDashboard,
  Users,
  Ruler,
  FileText,
  ClipboardList,
  FileSignature,
  Handshake,
  Table2,
  Coins,
  WalletCards,
  Award,
  type LucideIcon,
} from 'lucide-react';

export type NavGroupId = 'ringkasan' | 'operasional' | 'dokumen' | 'finansial';

export interface NavItem {
  id: string;
  label: string;
  /** Label pendek untuk bottom nav HP. */
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  group: NavGroupId;
}

export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  ringkasan: 'Ringkasan',
  operasional: 'Operasional',
  dokumen: 'Dokumen',
  finansial: 'Finansial',
};

export const NAV_GROUP_ORDER: NavGroupId[] = ['ringkasan', 'operasional', 'dokumen', 'finansial'];

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Ringkasan Finansial', shortLabel: 'Ringkasan', href: '/', icon: LayoutDashboard, group: 'ringkasan' },
  { id: 'data-customer', label: 'Data Customer', shortLabel: 'Customer', href: '/data-customer', icon: Users, group: 'operasional' },
  { id: 'size-chart', label: 'Size Chart', shortLabel: 'Size Chart', href: '/size-chart', icon: Ruler, group: 'operasional' },
  { id: 'invoice', label: 'Invoice', shortLabel: 'Invoice', href: '/invoice', icon: FileText, group: 'dokumen' },
  { id: 'purchase-order', label: 'Purchase Order', shortLabel: 'Purchase Order', href: '/purchase-order', icon: ClipboardList, group: 'dokumen' },
  { id: 'penawaran', label: 'Penawaran Harga', shortLabel: 'Penawaran', href: '/penawaran', icon: FileSignature, group: 'dokumen' },
  { id: 'kerjasama', label: 'Pengajuan Kerjasama', shortLabel: 'Kerjasama', href: '/kerjasama', icon: Handshake, group: 'dokumen' },
  { id: 'datatable', label: 'Data Table (Master Order)', shortLabel: 'Data Table', href: '/?tab=datatable', icon: Table2, group: 'finansial' },
  { id: 'cashin', label: 'Arus Kas Masuk', shortLabel: 'Dana Masuk', href: '/?tab=cashin', icon: Coins, group: 'finansial' },
  { id: 'cashout', label: 'Arus Kas Keluar', shortLabel: 'Dana Keluar', href: '/?tab=cashout', icon: WalletCards, group: 'finansial' },
  { id: 'vendor', label: 'Kinerja Mitra Vendor', shortLabel: 'Mitra Vendor', href: '/?tab=vendor', icon: Award, group: 'finansial' },
];

/** Empat slot utama bottom nav HP; slot kelima adalah tombol Menu (K-4). */
export const MOBILE_PRIMARY_IDS = ['dashboard', 'data-customer', 'invoice', 'size-chart'] as const;

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
