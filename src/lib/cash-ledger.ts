/**
 * Satu sumber entri kas (cash basis) untuk Dashboard, chart tren, drawer, dan tab Kas Masuk/Keluar.
 * Entri difilter berdasarkan tanggal pembayaran/transaksi, bukan tanggal order.
 */
import type { CashInflowEntry, CashTransaction, InflowCategoryType, Order } from '@/types';
import { FINANCE_START_DATE } from './constants';
import { buildCashOutflowEntries } from './financial-calculator';

export interface CashEntry {
  id: string;
  tanggal: string;
  arah: 'masuk' | 'keluar';
  nominal: number;
  sumber: 'order_customer' | 'order_vendor' | 'order_opex' | 'kas';
  kategori: string;
  orderId?: string;
}

export interface CashPeriod {
  bulan: string;
  tahun: string;
}

export interface CashPeriodSummary {
  saldoAwalPeriode: number;
  masukPeriode: number;
  keluarPeriode: number;
  saldoKas: number;
  masukOrder: number;
  masukNonOrder: number;
  keluarVendor: number;
  keluarOpexOrder: number;
  keluarKas: number;
  keluarCount: number;
}

export function matchPeriod(tanggal: string | undefined, bulan: string, tahun: string): boolean {
  if (!tanggal || tanggal < FINANCE_START_DATE) return false;
  if (tahun !== 'all' && !tanggal.startsWith(tahun)) return false;
  if (bulan !== 'all' && tanggal.slice(5, 7) !== bulan) return false;
  return true;
}

export function buildCashInflowEntries(orders: Order[], transactions: CashTransaction[]): CashInflowEntry[] {
  const list: CashInflowEntry[] = [];

  orders.forEach((order) => {
    if (order.tanggalOrder && order.tanggalOrder < FINANCE_START_DATE) return;
    const customerName = order.customerName || order.namaCustomer || 'Customer';
    const projectName = order.projectName || order.namaProject || '-';

    if (Array.isArray(order.pembayaranList) && order.pembayaranList.length > 0) {
      order.pembayaranList.forEach((p, idx) => {
        const tgl = p.tanggal || order.tanggalOrder || FINANCE_START_DATE;
        if (!(p.nominal > 0) || tgl < FINANCE_START_DATE) return;
        let jenis: InflowCategoryType = 'termin';
        if (p.jenis === 'dp' || idx === 0) jenis = 'dp';
        if (p.jenis === 'pelunasan') jenis = 'pelunasan';

        list.push({
          id: p.id || `pay-${order.id}-${idx}`,
          tanggal: tgl,
          sumber: 'order',
          jenis,
          noInv: order.noInv,
          orderId: order.id,
          customerName,
          projectName,
          keterangan:
            p.keterangan || (jenis === 'dp' ? 'Pembayaran DP 1' : jenis === 'pelunasan' ? 'Pelunasan Order' : 'Pembayaran Termin'),
          nominal: p.nominal,
          rawOrder: order,
        });
      });
    } else if (order.totalUangMasukCustomer > 0) {
      const totalTagihan = order.totalInvoice || order.totalJumlah || 0;
      const isLunas =
        order.statusPembayaran === 'lunas' || (totalTagihan > 0 && order.totalUangMasukCustomer >= totalTagihan);
      const dpPersen =
        totalTagihan > 0 ? (order.totalUangMasukCustomer / totalTagihan) * 100 : order.dpPersenCustomer || 0;
      const jenis: InflowCategoryType = isLunas ? 'pelunasan' : dpPersen >= 70 ? 'termin' : 'dp';

      list.push({
        id: `pay-${order.id}-single`,
        tanggal: order.tanggalOrder || FINANCE_START_DATE,
        sumber: 'order',
        jenis,
        noInv: order.noInv,
        orderId: order.id,
        customerName,
        projectName,
        keterangan: `Pembayaran ${
          jenis === 'pelunasan' ? 'Pelunasan 30%' : jenis === 'termin' ? 'Termin 70% Produksi' : 'DP 1 Booking'
        } Konsumen`,
        nominal: order.totalUangMasukCustomer,
        rawOrder: order,
      });
    }
  });

  transactions.forEach((tx) => {
    if (tx.tipe !== 'masuk' || tx.kategori === 'Penerimaan Konsumen') return;
    if (tx.tanggal && tx.tanggal < FINANCE_START_DATE) return;
    list.push({
      id: tx.id,
      tanggal: tx.tanggal,
      sumber: 'manual',
      jenis: 'kas_masuk',
      noInv: tx.refInvoice || '-',
      orderId: tx.orderId,
      customerName: tx.kategori || 'Penerimaan Kas',
      projectName: '-',
      keterangan: tx.keterangan || 'Kas Masuk Non-Order',
      nominal: tx.nominal,
    });
  });

  return list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

export function buildCashEntries(orders: Order[], transactions: CashTransaction[]): CashEntry[] {
  const inflows: CashEntry[] = buildCashInflowEntries(orders, transactions).map((e) => ({
    id: e.id,
    tanggal: e.tanggal,
    arah: 'masuk',
    nominal: e.nominal,
    sumber: e.sumber === 'order' ? 'order_customer' : 'kas',
    kategori: e.jenis,
    orderId: e.orderId,
  }));

  const outflows: CashEntry[] = buildCashOutflowEntries(orders, transactions)
    .filter((e) => e.tanggal >= FINANCE_START_DATE)
    .map((e) => ({
      id: e.id,
      tanggal: e.tanggal,
      arah: 'keluar',
      nominal: e.nominal,
      sumber:
        e.sumber === 'manual' ? 'kas' : e.kategori === 'Biaya Operasional Order' ? 'order_opex' : 'order_vendor',
      kategori: e.kategori,
      orderId: e.rawOrder?.id,
    }));

  return [...inflows, ...outflows];
}

// Batas akhir periode sebagai string ISO; '-31' aman untuk semua bulan karena perbandingannya leksikografis.
function periodEnd({ bulan, tahun }: CashPeriod): string | null {
  if (tahun === 'all') return null;
  return bulan === 'all' ? `${tahun}-12-31` : `${tahun}-${bulan}-31`;
}

export function summarizeCashPeriod(entries: CashEntry[], period: CashPeriod): CashPeriodSummary {
  const summary: CashPeriodSummary = {
    saldoAwalPeriode: 0,
    masukPeriode: 0,
    keluarPeriode: 0,
    saldoKas: 0,
    masukOrder: 0,
    masukNonOrder: 0,
    keluarVendor: 0,
    keluarOpexOrder: 0,
    keluarKas: 0,
    keluarCount: 0,
  };
  const end = periodEnd(period);

  for (const e of entries) {
    if (e.tanggal < FINANCE_START_DATE) continue;
    const signed = e.arah === 'masuk' ? e.nominal : -e.nominal;
    if (!end || e.tanggal <= end) summary.saldoKas += signed;
    if (!matchPeriod(e.tanggal, period.bulan, period.tahun)) continue;

    if (e.arah === 'masuk') {
      summary.masukPeriode += e.nominal;
      if (e.sumber === 'order_customer') summary.masukOrder += e.nominal;
      else summary.masukNonOrder += e.nominal;
    } else {
      summary.keluarPeriode += e.nominal;
      summary.keluarCount += 1;
      if (e.sumber === 'order_vendor' || (e.sumber === 'kas' && e.kategori === 'Pembayaran Vendor')) {
        summary.keluarVendor += e.nominal;
      } else if (e.sumber === 'order_opex') {
        summary.keluarOpexOrder += e.nominal;
      } else {
        summary.keluarKas += e.nominal;
      }
    }
  }

  summary.saldoAwalPeriode = summary.saldoKas - (summary.masukPeriode - summary.keluarPeriode);
  return summary;
}

export function collectYearOptions(orders: Order[], transactions: CashTransaction[]): string[] {
  const years = new Set<string>([FINANCE_START_DATE.slice(0, 4)]);
  const add = (tanggal?: string) => {
    if (tanggal && tanggal >= FINANCE_START_DATE) years.add(tanggal.slice(0, 4));
  };

  orders.forEach((o) => {
    add(o.tanggalOrder);
    o.pembayaranList?.forEach((p) => add(p.tanggal));
    o.vendorPembayaranList?.forEach((vp) => add(vp.tanggal));
  });
  transactions.forEach((t) => add(t.tanggal));

  return [...years].sort().reverse();
}
