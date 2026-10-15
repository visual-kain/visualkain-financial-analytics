/**
 * Satu sumber entri kas (cash basis) untuk Dashboard, chart tren, drawer, dan tab Kas Masuk/Keluar.
 * Entri difilter berdasarkan tanggal pembayaran/transaksi, bukan tanggal order.
 */
import type { CashInflowEntry, CashTransaction, InflowCategoryType, Order } from '@/types';
import { FINANCE_START_DATE } from './constants';
import { buildCashOutflowEntries } from './financial-calculator';
import { isInvestorInflow, KATEGORI_INVESTOR } from './investor-ledger';

export interface CashEntry {
  id: string;
  tanggal: string;
  arah: 'masuk' | 'keluar';
  nominal: number;
  sumber: 'order_customer' | 'order_vendor' | 'order_opex' | 'kas' | 'investor_masuk' | 'investor_keluar';
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
  masukInvestor: number;
  keluarInvestor: number;
  /** Σ dana investor masuk − Σ pengembalian pokok, kumulatif sampai akhir periode. */
  kewajibanInvestor: number;
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
    if (isInvestorInflow(tx)) {
      list.push({
        id: tx.id,
        tanggal: tx.tanggal,
        sumber: 'manual',
        jenis: 'investor',
        noInv: tx.refInvoice || '-',
        customerName: tx.investorNama?.trim() || 'Investor',
        projectName: '-',
        keterangan: tx.keterangan || 'Dana Investor',
        nominal: tx.nominal,
      });
      return;
    }
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
    sumber: e.sumber === 'order' ? 'order_customer' : e.jenis === 'investor' ? 'investor_masuk' : 'kas',
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
        e.sumber === 'manual'
          ? e.kategori === KATEGORI_INVESTOR.pengembalian
            ? 'investor_keluar'
            : 'kas'
          : e.kategori === 'Biaya Operasional Order'
          ? 'order_opex'
          : 'order_vendor',
      kategori: e.kategori,
      orderId: e.rawOrder?.id,
    }));

  return [...inflows, ...outflows];
}

// Batas akhir periode sebagai string ISO; '-31' aman untuk semua bulan karena perbandingannya leksikografis.
export function periodEnd({ bulan, tahun }: CashPeriod): string | null {
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
    masukInvestor: 0,
    keluarInvestor: 0,
    kewajibanInvestor: 0,
  };
  const end = periodEnd(period);

  for (const e of entries) {
    if (e.tanggal < FINANCE_START_DATE) continue;
    const signed = e.arah === 'masuk' ? e.nominal : -e.nominal;
    if (!end || e.tanggal <= end) {
      summary.saldoKas += signed;
      if (e.sumber === 'investor_masuk') summary.kewajibanInvestor += e.nominal;
      if (e.sumber === 'investor_keluar') summary.kewajibanInvestor -= e.nominal;
    }
    if (!matchPeriod(e.tanggal, period.bulan, period.tahun)) continue;

    if (e.arah === 'masuk') {
      summary.masukPeriode += e.nominal;
      if (e.sumber === 'order_customer') summary.masukOrder += e.nominal;
      else if (e.sumber === 'investor_masuk') summary.masukInvestor += e.nominal;
      else summary.masukNonOrder += e.nominal;
    } else {
      summary.keluarPeriode += e.nominal;
      summary.keluarCount += 1;
      if (isBebanKasEntry(e)) {
        summary.keluarKas += e.nominal;
      } else if (e.sumber === 'order_opex') {
        summary.keluarOpexOrder += e.nominal;
      } else if (e.sumber === 'investor_keluar') {
        summary.keluarInvestor += e.nominal;
      } else {
        summary.keluarVendor += e.nominal;
      }
    }
  }

  summary.saldoAwalPeriode = summary.saldoKas - (summary.masukPeriode - summary.keluarPeriode);
  return summary;
}

// Beban kas = kas keluar non-order selain pembayaran vendor (sudah di HPP) dan pengembalian pokok investor (pelunasan utang).
function isBebanKasEntry(e: CashEntry): boolean {
  return e.arah === 'keluar' && e.sumber === 'kas' && e.kategori !== 'Pembayaran Vendor';
}

export interface CashCoverageProjection {
  saldoKas: number;
  /** Sisa tagihan customer per akhir periode: uang yang masih akan masuk. */
  piutangCustomer: number;
  /** Sisa HPP yang belum dibayar ke vendor per akhir periode. */
  utangVendor: number;
  kewajibanInvestor: number;
  danaTersedia: number;
  totalKewajiban: number;
  /** Sisa dana bila semua pelunasan customer masuk lalu vendor dan pokok investor dilunasi. */
  proyeksiSisa: number;
  /** Sisa dana bila kewajiban dilunasi sekarang, tanpa menunggu pelunasan customer. */
  sisaTanpaPelunasan: number;
}

/**
 * Proyeksi kecukupan dana per akhir periode (US-12.14). Piutang dan utang dihitung dari semua order sampai akhir
 * periode dan pembayaran yang tanggalnya sampai akhir periode, sehingga sebanding dengan saldo kas yang kumulatif;
 * memakai order bulan terpilih saja akan menghilangkan utang order bulan lalu yang kasnya sudah terpakai.
 */
export function projectCashCoverage(
  orders: Order[],
  entries: CashEntry[],
  cash: Pick<CashPeriodSummary, 'saldoKas' | 'kewajibanInvestor'>,
  period: CashPeriod
): CashCoverageProjection {
  const end = periodEnd(period);
  const paidCustomer = new Map<string, number>();
  const paidVendor = new Map<string, number>();
  for (const e of entries) {
    if (!e.orderId || e.tanggal < FINANCE_START_DATE || (end && e.tanggal > end)) continue;
    const target = e.sumber === 'order_customer' ? paidCustomer : e.sumber === 'order_vendor' ? paidVendor : null;
    target?.set(e.orderId, (target.get(e.orderId) ?? 0) + e.nominal);
  }

  let piutangCustomer = 0;
  let utangVendor = 0;
  for (const order of orders) {
    const tanggal = order.tanggalOrder;
    if (!tanggal || tanggal < FINANCE_START_DATE || (end && tanggal > end)) continue;
    piutangCustomer += Math.max(0, (order.totalInvoice || 0) - (paidCustomer.get(order.id) ?? 0));
    utangVendor += Math.max(0, (order.totalHpp || 0) - (paidVendor.get(order.id) ?? 0));
  }

  const danaTersedia = cash.saldoKas + piutangCustomer;
  const totalKewajiban = utangVendor + cash.kewajibanInvestor;
  return {
    saldoKas: cash.saldoKas,
    piutangCustomer,
    utangVendor,
    kewajibanInvestor: cash.kewajibanInvestor,
    danaTersedia,
    totalKewajiban,
    proyeksiSisa: danaTersedia - totalKewajiban,
    sisaTanpaPelunasan: cash.saldoKas - totalKewajiban,
  };
}

export interface BebanKasGroup {
  kategori: string;
  total: number;
  count: number;
}

/** Rincian beban kas per kategori; jumlahnya identik dengan `keluarKas` pada periode yang sama. */
export function groupBebanKasByKategori(entries: CashEntry[], period: CashPeriod): BebanKasGroup[] {
  const map = new Map<string, BebanKasGroup>();
  for (const e of entries) {
    if (!isBebanKasEntry(e) || !matchPeriod(e.tanggal, period.bulan, period.tahun)) continue;
    const g = map.get(e.kategori) ?? { kategori: e.kategori, total: 0, count: 0 };
    g.total += e.nominal;
    g.count += 1;
    map.set(e.kategori, g);
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.kategori.localeCompare(b.kategori));
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
