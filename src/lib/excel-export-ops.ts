/**
 * Ekspor Excel modul operasional dengan gaya yang sama seperti `excel-export.ts` (metadata, KPI, header teal,
 * zebra, baris total, header beku, autofilter).
 */

import ExcelJS from 'exceljs';
import { STATUS_LABELS } from '@/lib/legacy/types';
import { formatDateTime } from '@/lib/legacy/formatters';
import { summarizeQty, type DataCustomerRow } from '@/lib/data-customer';

const THEME = {
  headerBg: '0F766E',
  headerFontColor: 'FFFFFF',
  kpiBg: 'F1F5F9',
  kpiBorder: 'CBD5E1',
  borderColor: 'E2E8F0',
  fontFamily: 'Segoe UI',
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function timestampLabel(now: Date): string {
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${d} ${MONTHS[now.getMonth()]} ${now.getFullYear()}, ${hh}:${mm} WIB`;
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

interface ColumnDef {
  header: string;
  width: number;
  align: 'left' | 'center' | 'right';
  numFmt?: string;
  value: (r: DataCustomerRow, idx: number) => ExcelJS.CellValue;
}

export const DATA_CUSTOMER_EXPORT_COLUMNS: ColumnDef[] = [
  { header: 'NO', width: 6, align: 'center', value: (_r, i) => i + 1 },
  { header: 'NO INV', width: 13, align: 'center', value: (r) => r.noInv },
  { header: 'NAMA CUSTOMER', width: 26, align: 'left', value: (r) => r.namaCustomer || '-' },
  { header: 'NAMA PROJECT', width: 28, align: 'left', value: (r) => r.namaProject || '-' },
  { header: 'DELIVERY DATE (DEADLINE)', width: 16, align: 'center', value: (r) => r.deadline || '-' },
  { header: 'JENIS METODE PRODUKSI', width: 20, align: 'left', value: (r) => r.jenisMetodeProduksi || '-' },
  { header: 'KATEGORI', width: 14, align: 'left', value: (r) => r.kategoriOrder || '-' },
  { header: 'JENIS BAHAN', width: 18, align: 'left', value: (r) => r.jenisBahan || '-' },
  { header: 'WARNA', width: 14, align: 'left', value: (r) => r.warna || '-' },
  { header: 'CREATED BY', width: 16, align: 'left', value: (r) => r.createdBy || '-' },
  {
    header: 'RAW ACC CUST',
    width: 14,
    align: 'center',
    value: (r) => (r.accCustUrl ? { text: 'Lihat ACC', hyperlink: r.accCustUrl } : '-'),
  },
  { header: 'TOTAL (QTY)', width: 11, align: 'center', numFmt: '#,##0', value: (r) => r.qtyTotal },
  { header: 'TOTAL TANPA LENGAN', width: 12, align: 'center', numFmt: '#,##0', value: (r) => r.qtyTanpaLengan },
  { header: 'TOTAL PENDEK', width: 11, align: 'center', numFmt: '#,##0', value: (r) => r.qtyPendek },
  { header: 'TOTAL 3/4 TANGAN', width: 12, align: 'center', numFmt: '#,##0', value: (r) => r.qtyTigaPerempat },
  { header: 'TOTAL PANJANG', width: 11, align: 'center', numFmt: '#,##0', value: (r) => r.qtyPanjang },
  { header: 'VENDOR', width: 20, align: 'left', value: (r) => r.vendorName || '-' },
  { header: 'DIBUAT', width: 22, align: 'center', value: (r) => (r.createdAt ? formatDateTime(r.createdAt) : '-') },
  { header: 'STATUS', width: 20, align: 'center', value: (r) => STATUS_LABELS[r.status] || r.status },
];

const TABLE_START_ROW = 11;

export function buildDataCustomerWorkbook(rows: DataCustomerRow[], filterLabel: string, now: Date = new Date()): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VisualKain Financial Analytics';
  workbook.created = now;
  const sheet = workbook.addWorksheet('Data Customer', {
    views: [{ state: 'frozen', ySplit: TABLE_START_ROW, showGridLines: true }],
  });
  const qty = summarizeQty(rows);

  sheet.getCell('A1').value = 'LAPORAN DATA CUSTOMER (ORDER PRODUKSI)';
  sheet.getCell('A1').font = { name: THEME.fontFamily, size: 14, bold: true, color: { argb: '0F172A' } };
  sheet.getCell('A2').value = 'Entitas: VisualKain Konveksi & Sablon Berkualitas';
  sheet.getCell('A2').font = { name: THEME.fontFamily, size: 10, italic: true, color: { argb: '475569' } };
  sheet.getCell('A3').value = `Filter: ${filterLabel}`;
  sheet.getCell('A3').font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '0F766E' } };
  sheet.getCell('A4').value = `Tanggal Unduh: ${timestampLabel(now)}`;
  sheet.getCell('A4').font = { name: THEME.fontFamily, size: 9, color: { argb: '64748B' } };
  sheet.getCell('A5').value = `Total Data: ${rows.length} Order`;
  sheet.getCell('A5').font = { name: THEME.fontFamily, size: 9, bold: true, color: { argb: '334155' } };

  const kpis = [
    { col: 'B', label: 'TOTAL ORDER', val: rows.length },
    { col: 'D', label: 'TOTAL QTY (PCS)', val: qty.total },
    { col: 'F', label: 'TANPA LENGAN', val: qty.tanpaLengan },
    { col: 'H', label: 'PENDEK', val: qty.pendek },
    { col: 'J', label: '3/4 TANGAN', val: qty.tigaPerempat },
    { col: 'L', label: 'PANJANG', val: qty.panjang },
  ];
  kpis.forEach((kpi) => {
    const head = sheet.getCell(`${kpi.col}7`);
    head.value = kpi.label;
    head.font = { name: THEME.fontFamily, size: 9, bold: true, color: { argb: '475569' } };
    head.alignment = { horizontal: 'center', vertical: 'middle' };
    head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.kpiBg } };
    head.border = {
      top: { style: 'thin', color: { argb: THEME.kpiBorder } },
      left: { style: 'thin', color: { argb: THEME.kpiBorder } },
      right: { style: 'thin', color: { argb: THEME.kpiBorder } },
    };
    const val = sheet.getCell(`${kpi.col}8`);
    val.value = kpi.val;
    val.numFmt = '#,##0';
    val.font = { name: THEME.fontFamily, size: 11, bold: true, color: { argb: '0F172A' } };
    val.alignment = { horizontal: 'center', vertical: 'middle' };
    val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.kpiBg } };
    val.border = {
      bottom: { style: 'thin', color: { argb: THEME.kpiBorder } },
      left: { style: 'thin', color: { argb: THEME.kpiBorder } },
      right: { style: 'thin', color: { argb: THEME.kpiBorder } },
    };
  });
  sheet.getRow(7).height = 18;
  sheet.getRow(8).height = 22;

  const columns = DATA_CUSTOMER_EXPORT_COLUMNS;
  const headerRow = sheet.getRow(TABLE_START_ROW);
  headerRow.height = 30;
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
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
    sheet.getColumn(idx + 1).width = col.width;
  });

  rows.forEach((r, idx) => {
    const row = sheet.getRow(TABLE_START_ROW + 1 + idx);
    columns.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      const value = col.value(r, idx);
      cell.value = value;
      const isLink = typeof value === 'object' && value !== null && 'hyperlink' in value;
      cell.font = { name: THEME.fontFamily, size: 9.5, color: { argb: isLink ? '0F766E' : '1E293B' }, underline: isLink };
      cell.alignment = { horizontal: col.align, vertical: 'top', wrapText: col.align === 'left' };
      if (col.numFmt) cell.numFmt = col.numFmt;
      cell.border = {
        top: { style: 'thin', color: { argb: THEME.borderColor } },
        bottom: { style: 'thin', color: { argb: THEME.borderColor } },
        left: { style: 'thin', color: { argb: THEME.borderColor } },
        right: { style: 'thin', color: { argb: THEME.borderColor } },
      };
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
    });
  });

  const totalRowIdx = TABLE_START_ROW + 1 + rows.length;
  const totalRow = sheet.getRow(totalRowIdx);
  totalRow.height = 24;
  const totals: Record<number, number> = { 12: qty.total, 13: qty.tanpaLengan, 14: qty.pendek, 15: qty.tigaPerempat, 16: qty.panjang };
  sheet.mergeCells(`A${totalRowIdx}:K${totalRowIdx}`);
  columns.forEach((col, idx) => {
    const cell = totalRow.getCell(idx + 1);
    if (idx === 0) cell.value = 'TOTAL AKUMULASI';
    if (totals[idx + 1] !== undefined) {
      cell.value = totals[idx + 1];
      cell.numFmt = '#,##0';
    }
    cell.font = { name: THEME.fontFamily, size: 10, bold: true, color: { argb: '0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    cell.alignment = { horizontal: idx === 0 ? 'center' : col.align, vertical: 'middle' };
    cell.border = {
      top: { style: 'medium', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };
  });

  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: TABLE_START_ROW, column: 1 },
      to: { row: TABLE_START_ROW + rows.length, column: columns.length },
    };
  }
  return workbook;
}

export async function exportDataCustomerToExcel(rows: DataCustomerRow[], filterLabel: string): Promise<void> {
  const now = new Date();
  const workbook = buildDataCustomerWorkbook(rows, filterLabel, now);
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  await downloadWorkbook(workbook, `VisualKain_Data_Customer_${stamp}.xlsx`);
}
