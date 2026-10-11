'use client';

import React, { useState, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { formatRupiah } from '@/lib/utils';
import type { CashTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/shimmer';
import {
  Download,
  Printer,
  ArrowUpDown,
  Search,
  BookOpen,
} from 'lucide-react';

interface TransactionLedgerTableProps {
  transactions?: CashTransaction[];
  isLoading?: boolean;
}

export function TransactionLedgerTable({
  transactions = [],
  isLoading = false,
}: TransactionLedgerTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'tanggal', desc: true },
  ]);
  const [filterQuery, setFilterQuery] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Laporan_Buku_Kas_VisualKain_2026',
  });

  const handleExportExcel = () => {
    const dataToExport = transactions.map((t) => ({
      Tanggal: t.tanggal,
      Tipe: t.tipe.toUpperCase(),
      Kategori: t.kategori,
      Keterangan: t.keterangan,
      'Invoice/Ref': t.refInvoice || '-',
      'Nominal (Rp)': t.nominal,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Kas Riil');
    XLSX.writeFile(workbook, `Buku_Kas_VisualKain_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredData = React.useMemo(() => {
    if (!filterQuery) return transactions;
    const q = filterQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.keterangan.toLowerCase().includes(q) ||
        t.kategori.toLowerCase().includes(q) ||
        (t.refInvoice && t.refInvoice.toLowerCase().includes(q))
    );
  }, [transactions, filterQuery]);

  const columns = React.useMemo<ColumnDef<CashTransaction>[]>(
    () => [
      {
        accessorKey: 'tanggal',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tanggal
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-xs text-slate-600">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'tipe',
        header: 'Tipe',
        cell: (info) => {
          const tipe = info.getValue() as string;
          return tipe === 'masuk' ? (
            <Badge variant="emerald">Kas Masuk</Badge>
          ) : (
            <Badge variant="rose">Kas Keluar</Badge>
          );
        },
      },
      {
        accessorKey: 'kategori',
        header: 'Kategori',
        cell: (info) => (
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'keterangan',
        header: 'Keterangan',
        cell: (info) => (
          <span className="font-medium text-slate-800">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'refInvoice',
        header: 'Ref Invoice',
        cell: (info) => (
          <span className="font-mono text-xs text-slate-500">
            {(info.getValue() as string) || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'nominal',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nominal
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isMasuk = row.tipe === 'masuk';
          return (
            <span
              className={`font-mono text-xs font-semibold tabular-nums ${
                isMasuk ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isMasuk ? '+' : '-'} {formatRupiah(info.getValue() as number)}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card-double">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Buku Jurnal Kas Riil & Transaksi
            </h3>
            <p className="text-xs text-slate-400">
              Daftar mutasi kas masuk konsumen dan pembayaran beban operasional / vendor
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi / invoice..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="h-9 w-52 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-3.5 w-3.5" />
            Excel
          </Button>

          <Button variant="outline" size="sm" onClick={() => handlePrint && handlePrint()}>
            <Printer className="h-3.5 w-3.5" />
            Cetak
          </Button>
        </div>
      </div>

      {/* Printable Area */}
      <div ref={printRef} className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50/60">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-slate-600 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  Tidak ada transaksi yang sesuai.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 transition-colors duration-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div>
          Menampilkan{' '}
          <span className="font-semibold text-slate-700">
            {table.getRowModel().rows.length}
          </span>{' '}
          dari{' '}
          <span className="font-semibold text-slate-700">
            {filteredData.length}
          </span>{' '}
          transaksi
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Sebelumnya
          </Button>
          <span className="font-mono text-xs">
            Halaman {table.getState().pagination.pageIndex + 1} dari{' '}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
