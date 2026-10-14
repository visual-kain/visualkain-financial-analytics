/**
 * Mesin Ekspor Excel Eksekutif Mengadopsi Standar Inzta & VisualKain 2026
 * Ditenagai oleh ExcelJS (US-9.28)
 */

import ExcelJS from 'exceljs';
import type { MasterFinanceRow, CashInflowEntry, CashTransaction, CashOutflowEntry } from '@/types';
import { getPeriodFilenameSuffix } from '@/lib/utils';

// Helper Format Tanggal Formal Indonesia untuk Metadata
function getFormattedTimestamp(): string {
  const now = new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const d = String(now.getDate()).padStart(2, '0');
  const m = months[now.getMonth()];
  const y = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${d} ${m} ${y}, ${hh}:${mm} WIB`;
}

// Helper trigger download file di browser
async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// Style Constants VisualKain Executive Inzta Theme
const THEME = {
  headerBg: '0F766E', // Dark Teal VisualKain (#0F766E)
  headerFontColor: 'FFFFFF',
  kpiBg: 'F1F5F9', // Slate-100 lembut
  kpiBorder: 'CBD5E1',
  kpiFontColor: '0F172A',
  totalBg: 'F8FAFC',
  borderColor: 'E2E8F0',
  fontFamily: 'Segoe UI',
};

/**
 * 1. Ekspor Master Finansial ke Excel Eksekutif (Standar Inzta)
 */
export async function exportMasterFinanceToExcel(
  rows: MasterFinanceRow[],
  selectedPeriod: string = 'Semua Periode'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VisualKain Financial Analytics';
  workbook.lastModifiedBy = 'Glora Sawita';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Master Finansial', {
    views: [{ showGridLines: true }],
  });

  // Kalkulasi Akumulasi KPI
  const totalOrders = rows.length;
  const totalQty = rows.reduce((acc, r) => acc + (r.totalQty || 0), 0);
  const totalOmzet = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);
  const totalDpCustomer = rows.reduce((acc, r) => acc + (r.nominalDpCustomer || 0), 0);
  const totalPiutang = rows.reduce((acc, r) => acc + (r.sisaPelunasanCustomer || 0), 0);
  const totalBiayaVendor = rows.reduce((acc, r) => acc + (r.totalBiayaVendor || 0), 0);
  const totalDpVendor = rows.reduce((acc, r) => acc + (r.dpVendor || 0), 0);
  const totalUtangVendor = rows.reduce((acc, r) => acc + (r.sisaPembayaranVendor || 0), 0);
  const totalBiayaOperasional = rows.reduce((acc, r) => acc + (r.biayaOperasional || 0), 0);
  const totalProfit = rows.reduce((acc, r) => acc + (r.profitBersih || 0), 0);

  // --- 1. BLOK HEADER METADATA (Baris 1 - 6) ---
  sheet.getCell('A1').value = 'LAPORAN MASTER DATA FINANSIAL ORDER';
  sheet.getCell('A1').font = { name: THEME.fontFamily, size: 14, bold: true, color: { argb: '0F172A' } };

  sheet.getCell('A2').value = 'Entitas: VisualKain Konveksi & Sablon Berkualitas';
  sheet.getCell('A2').font = { name: THEME.fontFamily, size: 10, italic: true, color: { argb: '475569' } };

  sheet.getCell('A3').value = `Periode: ${selectedPeriod}`;
  sheet.getCell('A3').font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '0F766E' } };

  sheet.getCell('A4').value = `Tanggal Unduh: ${getFormattedTimestamp()}`;
  sheet.getCell('A4').font = { name: THEME.fontFamily, size: 9, color: { argb: '64748B' } };

  sheet.getCell('A5').value = `Total Data: ${totalOrders} Pesanan Transaksi`;
  sheet.getCell('A5').font = { name: THEME.fontFamily, size: 9, bold: true, color: { argb: '334155' } };

  // --- 2. KARTU RINGKASAN KPI (Baris 7 - 9) ---
  const kpiHeaders = [
    { col: 'B', label: 'TOTAL ORDER', val: totalOrders, numFmt: '#,##0' },
    { col: 'D', label: 'TOTAL QTY (PCS)', val: totalQty, numFmt: '#,##0' },
    { col: 'F', label: 'TOTAL OMZET', val: totalOmzet, numFmt: '"Rp" #,##0' },
    { col: 'H', label: 'TERIMA DP KONSUMEN', val: totalDpCustomer, numFmt: '"Rp" #,##0' },
    { col: 'J', label: 'SISA PIUTANG', val: totalPiutang, numFmt: '"Rp" #,##0' },
    { col: 'L', label: 'MODAL VENDOR (HPP)', val: totalBiayaVendor, numFmt: '"Rp" #,##0' },
    { col: 'N', label: 'SISA UTANG VENDOR', val: totalUtangVendor, numFmt: '"Rp" #,##0' },
    { col: 'P', label: 'LABA KOTOR (ORDER)', val: totalProfit, numFmt: '"Rp" #,##0' },
  ];

  kpiHeaders.forEach((kpi) => {
    // Header KPI
    const cellHead = sheet.getCell(`${kpi.col}7`);
    cellHead.value = kpi.label;
    cellHead.font = { name: THEME.fontFamily, size: 9, bold: true, color: { argb: '475569' } };
    cellHead.alignment = { horizontal: 'center', vertical: 'middle' };
    cellHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.kpiBg } };
    cellHead.border = {
      top: { style: 'thin', color: { argb: THEME.kpiBorder } },
      left: { style: 'thin', color: { argb: THEME.kpiBorder } },
      right: { style: 'thin', color: { argb: THEME.kpiBorder } },
    };

    // Value KPI
    const cellVal = sheet.getCell(`${kpi.col}8`);
    cellVal.value = kpi.val;
    cellVal.numFmt = kpi.numFmt;
    cellVal.font = { name: THEME.fontFamily, size: 11, bold: true, color: { argb: '0F172A' } };
    cellVal.alignment = { horizontal: 'center', vertical: 'middle' };
    cellVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.kpiBg } };
    cellVal.border = {
      bottom: { style: 'thin', color: { argb: THEME.kpiBorder } },
      left: { style: 'thin', color: { argb: THEME.kpiBorder } },
      right: { style: 'thin', color: { argb: THEME.kpiBorder } },
    };
  });

  sheet.getRow(7).height = 18;
  sheet.getRow(8).height = 22;

  // --- 3. TABEL DATA TRANSAKSI (Mulai Baris 11) ---
  const tableStartRow = 11;
  const columns = [
    { key: 'no', header: 'NO', width: 6, align: 'center' },
    { key: 'noInv', header: 'NO. INVOICE', width: 14, align: 'center' },
    { key: 'tanggal', header: 'TANGGAL', width: 14, align: 'center' },
    { key: 'customer', header: 'NAMA PELANGGAN', width: 26, align: 'left' },
    { key: 'project', header: 'NAMA PROJECT', width: 28, align: 'left' },
    { key: 'qty', header: 'QTY (PCS)', width: 12, align: 'center', numFmt: '#,##0' },
    { key: 'totalOmzet', header: 'TOTAL OMZET', width: 18, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'dpPersen', header: 'DP (%)', width: 10, align: 'center', numFmt: '0.0"%"' },
    { key: 'dpNominal', header: 'DP DITERIMA', width: 18, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'sisaPiutang', header: 'SISA PIUTANG', width: 18, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'biayaVendor', header: 'TOTAL BIAYA VENDOR', width: 20, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'dpVendor', header: 'PEMBAYARAN VENDOR', width: 16, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'sisaVendor', header: 'SISA UTANG VENDOR', width: 18, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'biayaOpex', header: 'BIAYA OPERASIONAL', width: 18, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'diskon', header: 'DISKON', width: 14, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'profit', header: 'LABA BERSIH (PROFIT)', width: 20, align: 'right', numFmt: '"Rp" #,##0' },
    { key: 'margin', header: 'MARGIN (%)', width: 12, align: 'center', numFmt: '0.0"%"' },
    { key: 'status', header: 'STATUS ORDER', width: 16, align: 'center' },
  ];

  const headerRow = sheet.getRow(tableStartRow);
  headerRow.height = 26;

  columns.forEach((col, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = col.header;
    cell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: THEME.headerFontColor } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '0B5A53' } },
      bottom: { style: 'medium', color: { argb: '0B5A53' } },
      left: { style: 'thin', color: { argb: '14B8A6' } },
      right: { style: 'thin', color: { argb: '14B8A6' } },
    };
  });

  // Isi Data Baris per Baris
  let currentRowIdx = tableStartRow + 1;
  rows.forEach((r, idx) => {
    const row = sheet.getRow(currentRowIdx);
    row.height = 20;

    const values = [
      idx + 1,
      r.noInv,
      r.tanggalInv || '-',
      r.namaCustomer || '-',
      r.namaProject || '-',
      r.totalQty || 0,
      r.totalJumlah || 0,
      r.dpPersenCustomer || 0,
      r.nominalDpCustomer || 0,
      r.sisaPelunasanCustomer || 0,
      r.totalBiayaVendor || 0,
      r.dpVendor || 0,
      r.sisaPembayaranVendor || 0,
      r.biayaOperasional || 0,
      r.diskon || 0,
      r.profitBersih || 0,
      r.profitPercent || 0,
      (r.statusOrder || 'PRODUKSI').toUpperCase(),
    ];

    values.forEach((val, cIdx) => {
      const colDef = columns[cIdx];
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: THEME.fontFamily, size: 9.5, color: { argb: '1E293B' } };
      cell.alignment = {
        horizontal: colDef.align as ExcelJS.Alignment['horizontal'],
        vertical: 'middle',
      };
      if (colDef.numFmt) {
        cell.numFmt = colDef.numFmt;
      }
      cell.border = {
        top: { style: 'thin', color: { argb: THEME.borderColor } },
        bottom: { style: 'thin', color: { argb: THEME.borderColor } },
        left: { style: 'thin', color: { argb: THEME.borderColor } },
        right: { style: 'thin', color: { argb: THEME.borderColor } },
      };

      // Zebra striping lembut
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
    });

    currentRowIdx++;
  });

  // --- 4. BARIS TOTAL / SUMMARY (Double-Line Bottom Border) ---
  const summaryRow = sheet.getRow(currentRowIdx);
  summaryRow.height = 24;

  const summaryValues: Record<number, { val: any; numFmt?: string }> = {
    1: { val: 'TOTAL AKUMULASI' },
    6: { val: totalQty, numFmt: '#,##0' },
    7: { val: totalOmzet, numFmt: '"Rp" #,##0' },
    9: { val: totalDpCustomer, numFmt: '"Rp" #,##0' },
    10: { val: totalPiutang, numFmt: '"Rp" #,##0' },
    11: { val: totalBiayaVendor, numFmt: '"Rp" #,##0' },
    12: { val: totalDpVendor, numFmt: '"Rp" #,##0' },
    13: { val: totalUtangVendor, numFmt: '"Rp" #,##0' },
    14: { val: totalBiayaOperasional, numFmt: '"Rp" #,##0' },
    16: { val: totalProfit, numFmt: '"Rp" #,##0' },
    17: { val: totalOmzet > 0 ? (totalProfit / totalOmzet) * 100 : 0, numFmt: '0.0"%"' },
  };

  // Merge A s.d E untuk label TOTAL AKUMULASI
  sheet.mergeCells(`A${currentRowIdx}:E${currentRowIdx}`);

  columns.forEach((col, idx) => {
    const cell = summaryRow.getCell(idx + 1);
    const sumDef = summaryValues[idx + 1];

    if (sumDef) {
      cell.value = sumDef.val;
      if (sumDef.numFmt) cell.numFmt = sumDef.numFmt;
    }

    cell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    cell.alignment = {
      horizontal: idx === 0 ? 'center' : (col.align as ExcelJS.Alignment['horizontal']),
      vertical: 'middle',
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: '0F172A' } }, // Double-line bottom border khas akuntansi
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };
  });

  // --- 5. AUTO-WIDTH KOLOM (Panjang Max + 4 Karakter Padding) ---
  columns.forEach((col, idx) => {
    const colNumber = idx + 1;
    let maxLen = col.header.length;

    rows.forEach((r) => {
      let valStr = '';
      switch (col.key) {
        case 'noInv': valStr = r.noInv || ''; break;
        case 'tanggal': valStr = r.tanggalInv || ''; break;
        case 'customer': valStr = r.namaCustomer || ''; break;
        case 'project': valStr = r.namaProject || ''; break;
        case 'totalOmzet': valStr = 'Rp 999,999,999'; break;
        case 'profit': valStr = 'Rp 999,999,999'; break;
        default: valStr = String((r as any)[col.key] || ''); break;
      }
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });

    sheet.getColumn(colNumber).width = Math.max(col.width, maxLen + 4);
  });

  const filename = `VisualKain_Master_Finance_${getPeriodFilenameSuffix(selectedPeriod)}.xlsx`;
  await downloadWorkbook(workbook, filename);
}

/**
 * 2. Ekspor Arus Kas Masuk (Penerimaan Kas) ke Excel Eksekutif
 */
export async function exportCashInflowToExcel(
  entries: CashInflowEntry[],
  selectedPeriod: string = 'Semua Periode'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VisualKain Financial Analytics';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Arus Kas Masuk', {
    views: [{ showGridLines: true }],
  });

  const totalMasuk = entries.reduce((acc, e) => acc + (e.nominal || 0), 0);

  // Metadata
  sheet.getCell('A1').value = 'LAPORAN ARUS KAS MASUK (PENERIMAAN KAS)';
  sheet.getCell('A1').font = { name: THEME.fontFamily, size: 14, bold: true, color: { argb: '0F172A' } };

  sheet.getCell('A2').value = 'Entitas: VisualKain Konveksi & Sablon Berkualitas';
  sheet.getCell('A2').font = { name: THEME.fontFamily, size: 10, italic: true, color: { argb: '475569' } };

  sheet.getCell('A3').value = `Periode: ${selectedPeriod}`;
  sheet.getCell('A3').font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '0F766E' } };

  sheet.getCell('A4').value = `Tanggal Unduh: ${getFormattedTimestamp()}`;
  sheet.getCell('A4').font = { name: THEME.fontFamily, size: 9, color: { argb: '64748B' } };

  sheet.getCell('A5').value = `Total Kas Masuk: ${entries.length} Mutasi | Rp ${totalMasuk.toLocaleString('id-ID')}`;
  sheet.getCell('A5').font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '047857' } };

  const columns = [
    { header: 'NO', width: 6, align: 'center' },
    { header: 'TANGGAL', width: 14, align: 'center' },
    { header: 'NO. INVOICE', width: 16, align: 'center' },
    { header: 'NAMA KONSUMEN / SUMBER DANA', width: 28, align: 'left' },
    { header: 'NAMA PROJECT', width: 28, align: 'left' },
    { header: 'KATEGORI PENERIMAAN', width: 20, align: 'center' },
    { header: 'KETERANGAN / REKENING', width: 32, align: 'left' },
    { header: 'NOMINAL MASUK (RP)', width: 22, align: 'right', numFmt: '"Rp" #,##0' },
  ];

  const headerRow = sheet.getRow(7);
  headerRow.height = 26;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: THEME.headerFontColor } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: '0B5A53' } },
      bottom: { style: 'medium', color: { argb: '0B5A53' } },
      left: { style: 'thin', color: { argb: '14B8A6' } },
      right: { style: 'thin', color: { argb: '14B8A6' } },
    };
  });

  let rowIdx = 8;
  entries.forEach((e, idx) => {
    const row = sheet.getRow(rowIdx);
    row.height = 20;

    const values = [
      idx + 1,
      e.tanggal || '-',
      e.noInv || '-',
      e.customerName || '-',
      e.projectName || '-',
      e.jenis.toUpperCase(),
      e.keterangan || '-',
      e.nominal || 0,
    ];

    values.forEach((v, cIdx) => {
      const col = columns[cIdx];
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: THEME.fontFamily, size: 9.5 };
      cell.alignment = { horizontal: col.align as ExcelJS.Alignment['horizontal'], vertical: 'middle' };
      if (col.numFmt) cell.numFmt = col.numFmt;
      cell.border = {
        top: { style: 'thin', color: { argb: THEME.borderColor } },
        bottom: { style: 'thin', color: { argb: THEME.borderColor } },
        left: { style: 'thin', color: { argb: THEME.borderColor } },
        right: { style: 'thin', color: { argb: THEME.borderColor } },
      };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
    });

    rowIdx++;
  });

  // Summary Row
  const summaryRow = sheet.getRow(rowIdx);
  summaryRow.height = 24;
  sheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
  const labelCell = summaryRow.getCell(1);
  labelCell.value = 'TOTAL PENERIMAAN KAS MASUK';
  labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
  labelCell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '0F172A' } };

  const valCell = summaryRow.getCell(8);
  valCell.value = totalMasuk;
  valCell.numFmt = '"Rp" #,##0';
  valCell.alignment = { horizontal: 'right', vertical: 'middle' };
  valCell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '047857' } };

  for (let c = 1; c <= 8; c++) {
    const cell = summaryRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    cell.border = {
      top: { style: 'medium', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };
  }

  columns.forEach((col, idx) => {
    sheet.getColumn(idx + 1).width = col.width;
  });

  const filename = `VisualKain_Arus_Kas_Masuk_${getPeriodFilenameSuffix(selectedPeriod)}.xlsx`;
  await downloadWorkbook(workbook, filename);
}

/**
 * 3. Ekspor Arus Kas Keluar (Pengeluaran Kas & Vendor) ke Excel Eksekutif
 */
export async function exportCashOutflowToExcel(
  transactions: Array<CashTransaction | CashOutflowEntry>,
  selectedPeriod: string = 'Mulai Oktober 2026'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VisualKain Financial Analytics';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Arus Kas Keluar', {
    views: [{ showGridLines: true }],
  });

  const totalKeluar = transactions.reduce((acc, t) => acc + (t.nominal || 0), 0);

  sheet.getCell('A1').value = 'LAPORAN ARUS DANA KELUAR (PEMBAYARAN VENDOR & OPERASIONAL KAS)';
  sheet.getCell('A1').font = { name: THEME.fontFamily, size: 14, bold: true, color: { argb: '0F172A' } };

  sheet.getCell('A2').value = 'Entitas: VisualKain Konveksi & Sablon Berkualitas';
  sheet.getCell('A2').font = { name: THEME.fontFamily, size: 10, italic: true, color: { argb: '475569' } };

  sheet.getCell('A3').value = `Periode: ${selectedPeriod}`;
  sheet.getCell('A3').font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '0F766E' } };

  sheet.getCell('A4').value = `Tanggal Unduh: ${getFormattedTimestamp()}`;
  sheet.getCell('A4').font = { name: THEME.fontFamily, size: 9, color: { argb: '64748B' } };

  sheet.getCell('A5').value = `Total Dana Keluar: ${transactions.length} Mutasi | Rp ${totalKeluar.toLocaleString('id-ID')}`;
  sheet.getCell('A5').font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: 'B91C1C' } };

  const columns = [
    { header: 'NO', width: 6, align: 'center' },
    { header: 'TANGGAL', width: 14, align: 'center' },
    { header: 'NO. INVOICE / REF', width: 18, align: 'center' },
    { header: 'MITRA VENDOR / TUJUAN', width: 24, align: 'left' },
    { header: 'KATEGORI BEBAN', width: 24, align: 'left' },
    { header: 'KETERANGAN BIAYA', width: 40, align: 'left' },
    { header: 'SUMBER PENGELUARAN', width: 20, align: 'center' },
    { header: 'NOMINAL DANA KELUAR (RP)', width: 24, align: 'right', numFmt: '"Rp" #,##0' },
  ];

  const headerRow = sheet.getRow(7);
  headerRow.height = 26;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: THEME.headerFontColor } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: '0B5A53' } },
      bottom: { style: 'medium', color: { argb: '0B5A53' } },
      left: { style: 'thin', color: { argb: '14B8A6' } },
      right: { style: 'thin', color: { argb: '14B8A6' } },
    };
  });

  let rowIdx = 8;
  transactions.forEach((t, idx) => {
    const row = sheet.getRow(rowIdx);
    row.height = 20;

    const isUnified = 'sumber' in t;
    const noInv = isUnified ? (t.noInv || 'KAS-KELUAR') : (t.refInvoice || 'KAS-KELUAR');
    const vendorTarget = isUnified ? (t.vendorOrTargetName || 'Kas Operasional') : 'Kas Operasional';
    const sumberLabel = isUnified
      ? t.sumber === 'order'
        ? 'Order / Vendor'
        : 'Kas Operasional'
      : t.akun || 'Kas Operasional';

    const values = [
      idx + 1,
      t.tanggal || '-',
      noInv,
      vendorTarget,
      t.kategori || 'Operasional',
      t.keterangan || '-',
      sumberLabel,
      t.nominal || 0,
    ];

    values.forEach((v, cIdx) => {
      const col = columns[cIdx];
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: THEME.fontFamily, size: 9.5 };
      cell.alignment = { horizontal: col.align as ExcelJS.Alignment['horizontal'], vertical: 'middle' };
      if (col.numFmt) cell.numFmt = col.numFmt;
      cell.border = {
        top: { style: 'thin', color: { argb: THEME.borderColor } },
        bottom: { style: 'thin', color: { argb: THEME.borderColor } },
        left: { style: 'thin', color: { argb: THEME.borderColor } },
        right: { style: 'thin', color: { argb: THEME.borderColor } },
      };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
    });

    rowIdx++;
  });

  const summaryRow = sheet.getRow(rowIdx);
  summaryRow.height = 24;
  sheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
  const labelCell = summaryRow.getCell(1);
  labelCell.value = 'TOTAL DANA KELUAR (VENDOR & KAS OPERASIONAL)';
  labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
  labelCell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '0F172A' } };

  const valCell = summaryRow.getCell(8);
  valCell.value = totalKeluar;
  valCell.numFmt = '"Rp" #,##0';
  valCell.alignment = { horizontal: 'right', vertical: 'middle' };
  valCell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: 'B91C1C' } };

  for (let c = 1; c <= 8; c++) {
    const cell = summaryRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    cell.border = {
      top: { style: 'medium', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };
  }

  columns.forEach((col, idx) => {
    sheet.getColumn(idx + 1).width = col.width;
  });

  const filename = `VisualKain_Arus_Dana_Keluar_${getPeriodFilenameSuffix(selectedPeriod)}.xlsx`;
  await downloadWorkbook(workbook, filename);
}
