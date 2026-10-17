'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { AccImageUpload } from '@/components/ops/AccImageUpload';
import { AddKategoriModal, VendorPriceModal, VendorUnpaidDialog } from '@/components/ops/data-customer/OrderFormDialogs';
import { ConfirmDialog } from '@/components/ui/modal';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAuth } from '@/context/AuthContext';
import { useOpsData } from '@/context/OpsDataContext';
import { useBeforeUnloadGuard } from '@/hooks/useBeforeUnloadGuard';
import { useDirtyNavigationGuard } from '@/hooks/useDirtyNavigationGuard';
import { FINANCE_START_DATE, todayInJakarta } from '@/lib/constants';
import { CATEGORY_DISPLAY_ORDER, CATEGORY_LABELS, SIZES, qtyKey, type CategoryType } from '@/lib/legacy/calculations';
import { generateInvoiceNumber } from '@/lib/legacy/formatters';
import { STATUS_LABELS, STATUS_ORDER, type LegacyOrder, type OrderStatus } from '@/lib/legacy/types';
import { createOrder, resolveUniqueInvoiceNumber, updateOrder } from '@/lib/firestore/orders-repo';
import {
  buildCreateExtras,
  buildOverrideSync,
  createEmptyOrderForm,
  formToOrderFields,
  invoiceDateError,
  orderToForm,
  paidExceedsTotalError,
  vendorNameUpdate,
  summarizeForm,
  vendorOutstanding,
  type OrderFormState,
} from '@/lib/order-form';
import { cn, formatRupiah } from '@/lib/utils';

const LABEL = 'mb-1.5 block text-xs font-bold text-slate-700';
const FIELD =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-800 sm:text-xs placeholder-slate-400 placeholder:font-normal focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10';
const CARD = 'rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double sm:p-5';

function invoiceDate(tanggal: string): Date {
  return tanggal ? new Date(`${tanggal}T00:00:00`) : new Date();
}

interface OrderFormProps {
  mode: 'create' | 'edit';
  order?: LegacyOrder;
}

export function OrderForm({ mode, order }: OrderFormProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const { orders, kategoriList, sizeCharts, vendors, getVendorName } = useOpsData();
  const knownInvs = useMemo(() => orders.map((o) => o.noInv), [orders]);

  const initial = useMemo<OrderFormState>(() => {
    if (mode === 'edit' && order) return orderToForm(order);
    const today = todayInJakarta();
    return createEmptyOrderForm(today, generateInvoiceNumber(invoiceDate(today), knownInvs));
    // Form awal dibentuk sekali; nomor invoice baru diperbarui lewat efek di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, order?.id]);

  const [form, setForm] = useState<OrderFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'namaCustomer' | 'kategoriOrder' | 'tanggalInv', string>>>({});
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
  const [vendorUnpaid, setVendorUnpaid] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const initialSnapshot = useRef(JSON.stringify(initial));
  const isDirty = JSON.stringify(form) !== initialSnapshot.current;
  useBeforeUnloadGuard(isDirty && !saving);
  const { dialog: leaveDialog } = useDirtyNavigationGuard(isDirty && !saving);

  // Nomor invoice order baru dihitung ulang saat tanggal berubah atau data order selesai dimuat; mode edit tidak pernah mengganti nomor.
  useEffect(() => {
    if (mode !== 'create') return;
    setForm((prev) => {
      const noInv = generateInvoiceNumber(invoiceDate(prev.tanggalInv), knownInvs);
      return prev.noInv === noInv ? prev : { ...prev, noInv };
    });
  }, [mode, knownInvs, form.tanggalInv]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => {
      if (o.namaCustomer && !map.has(o.namaCustomer)) map.set(o.namaCustomer, String(o.noWaCustomer || ''));
    });
    return Array.from(map, ([nama, wa]) => ({ nama, wa }));
  }, [orders]);

  const suggestions = useMemo(() => {
    const q = form.namaCustomer.trim().toLowerCase();
    if (!q) return [];
    return uniqueCustomers.filter((c) => c.nama.toLowerCase().includes(q) && c.nama !== form.namaCustomer).slice(0, 8);
  }, [uniqueCustomers, form.namaCustomer]);

  const biayaOperasional = Number(order?.biayaOperasional || 0);
  const summary = summarizeForm(form, biayaOperasional);
  const profitTone = summary.profit < 0 ? 'text-rose-600' : summary.jumlahSemua > 0 && summary.profitPercent < 30 ? 'text-amber-600' : 'text-emerald-600';

  const set = <K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const setHarga = (cat: CategoryType, value: number) => setForm((prev) => ({ ...prev, harga: { ...prev.harga, [cat]: value } }));
  const setQty = (key: string, value: number) => setForm((prev) => ({ ...prev, qty: { ...prev.qty, [key]: value } }));

  const kategoriOptions = useMemo(() => {
    const names = kategoriList.map((k) => k.nama);
    if (form.kategoriOrder && !names.includes(form.kategoriOrder)) names.unshift(form.kategoriOrder);
    return names;
  }, [kategoriList, form.kategoriOrder]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.namaCustomer.trim()) next.namaCustomer = 'Nama customer wajib diisi';
    if (!form.kategoriOrder) next.kategoriOrder = 'Kategori order wajib dipilih';
    const dateError = invoiceDateError(form.tanggalInv);
    if (dateError) next.tanggalInv = dateError;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) {
      toast.error('Lengkapi data yang wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'create') {
        const noInv = await resolveUniqueInvoiceNumber(form.tanggalInv, knownInvs);
        const fields = { ...formToOrderFields({ ...form, noInv }), ...vendorNameUpdate('', form.vendorId, vendors) };
        const extras = buildCreateExtras({ name: profile?.name || 'Pengguna VisualKain', email: profile?.email || '' });
        if (form.status === 'completed') {
          const outstanding = vendorOutstanding({ ...fields, ...extras });
          if (outstanding > 0) {
            setVendorUnpaid(outstanding);
            return;
          }
        }
        const id = await createOrder({ ...fields, ...extras });
        initialSnapshot.current = JSON.stringify(form);
        toast.success(`Order ${noInv} tersimpan`);
        router.push(`/data-customer/${id}`);
      } else if (order) {
        const fields = { ...formToOrderFields({ ...form, noInv: order.noInv }), ...vendorNameUpdate(order.vendorId, form.vendorId, vendors) };
        const sync = buildOverrideSync(order, fields);
        const paidError = paidExceedsTotalError(order, { ...fields, ...sync });
        if (paidError) {
          toast.error(paidError, { duration: 8000 });
          return;
        }
        // Gerbang pelunasan vendor hanya saat status berubah ke Selesai, supaya order yang sudah Selesai tetap bisa dikoreksi.
        if (form.status === 'completed' && order.status !== 'completed') {
          const outstanding = vendorOutstanding({ ...order, ...fields, ...sync });
          if (outstanding > 0) {
            setVendorUnpaid(outstanding);
            return;
          }
        }
        await updateOrder(order, { ...fields, ...sync });
        initialSnapshot.current = JSON.stringify(form);
        toast.success(`Order ${order.noInv} diperbarui`);
        router.push(`/data-customer/${order.id}`);
      }
    } catch (err) {
      console.error('[order-form] Gagal menyimpan order:', err);
      toast.error(err instanceof Error && err.message.includes('No. Invoice') ? err.message : 'Gagal menyimpan order. Periksa koneksi lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const cancelTarget = mode === 'edit' && order ? `/data-customer/${order.id}` : '/data-customer';
  const handleCancel = () => (isDirty ? setConfirmLeave(true) : router.push(cancelTarget));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-6">
      <PageHeader
        backHref={cancelTarget}
        backLabel={mode === 'edit' ? 'Detail Order' : 'Data Customer'}
        eyebrow={<EyebrowBadge>{form.noInv || 'VK—'}</EyebrowBadge>}
        title={mode === 'edit' ? `Edit Order ${order?.noInv ?? ''}` : 'Order Baru'}
        subtitle={
          mode === 'edit'
            ? 'Ubah data customer, produksi, harga, dan qty. Pembayaran, biaya tambahan, dan biaya operasional diubah lewat Edit Finansial.'
            : 'No. Invoice dibuat otomatis dari tanggal invoice dan dicek ulang saat disimpan. Pembayaran DP dicatat di Dana Masuk setelah order tersimpan.'
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="min-w-0 space-y-4 lg:space-y-6">
          <section className={CARD}>
            <h2 className="mb-4 text-sm font-bold text-slate-900">Informasi Customer &amp; Project</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="tanggalInv" className={LABEL}>
                  Tanggal Invoice
                </label>
                <input
                  id="tanggalInv"
                  type="date"
                  min={FINANCE_START_DATE}
                  value={form.tanggalInv}
                  onChange={(e) => set('tanggalInv', e.target.value)}
                  aria-invalid={!!errors.tanggalInv}
                  className={cn(FIELD, errors.tanggalInv && 'border-rose-300 ring-2 ring-rose-100')}
                />
                {errors.tanggalInv && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.tanggalInv}</p>}
              </div>
              <div>
                <span className={LABEL}>No. Invoice</span>
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold tracking-wide text-teal-800 sm:h-10">
                  {form.noInv}
                  {mode === 'create' && <span className="ml-auto text-[10px] font-semibold text-slate-400">otomatis</span>}
                </div>
              </div>
              <div ref={customerRef} className="relative sm:col-span-2">
                <label htmlFor="namaCustomer" className={LABEL}>
                  Nama Customer <span className="text-rose-500">*</span>
                </label>
                <input
                  id="namaCustomer"
                  autoComplete="off"
                  value={form.namaCustomer}
                  onChange={(e) => {
                    set('namaCustomer', e.target.value.toUpperCase());
                    setSuggestOpen(true);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  aria-invalid={!!errors.namaCustomer}
                  placeholder="NAMA CUSTOMER"
                  className={cn(FIELD, errors.namaCustomer && 'border-rose-300 ring-2 ring-rose-100')}
                />
                {errors.namaCustomer && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.namaCustomer}</p>}
                {suggestOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
                    {suggestions.map((c) => (
                      <button
                        key={c.nama}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, namaCustomer: c.nama, noWaCustomer: c.wa || prev.noWaCustomer }));
                          setSuggestOpen(false);
                        }}
                        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-teal-50"
                      >
                        <span className="truncate font-bold text-slate-800">{c.nama}</span>
                        {c.wa && <span className="shrink-0 text-[11px] text-slate-500">{c.wa}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="noWaCustomer" className={LABEL}>
                  No. WhatsApp Customer
                </label>
                <input id="noWaCustomer" inputMode="tel" value={form.noWaCustomer} onChange={(e) => set('noWaCustomer', e.target.value)} placeholder="08xxxxxxxxxx" className={FIELD} />
              </div>
              <div>
                <label htmlFor="namaProject" className={LABEL}>
                  Nama Project
                </label>
                <input id="namaProject" value={form.namaProject} onChange={(e) => set('namaProject', e.target.value)} className={FIELD} />
              </div>
              <div>
                <label htmlFor="jenisMetodeProduksi" className={LABEL}>
                  Jenis Metode Produksi
                </label>
                <input
                  id="jenisMetodeProduksi"
                  value={form.jenisMetodeProduksi}
                  onChange={(e) => set('jenisMetodeProduksi', e.target.value)}
                  placeholder="Bordir, Sablon, Printing"
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor="kategoriOrder" className={LABEL}>
                  Kategori Order <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    id="kategoriOrder"
                    value={form.kategoriOrder}
                    onChange={(e) => set('kategoriOrder', e.target.value)}
                    aria-invalid={!!errors.kategoriOrder}
                    className={cn(FIELD, errors.kategoriOrder && 'border-rose-300 ring-2 ring-rose-100')}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {kategoriOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setKategoriModalOpen(true)}
                    aria-label="Tambah kategori"
                    className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 sm:h-10 sm:w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {errors.kategoriOrder && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.kategoriOrder}</p>}
              </div>
              <div>
                <label htmlFor="jenisBahan" className={LABEL}>
                  Jenis Bahan
                </label>
                <input id="jenisBahan" value={form.jenisBahan} onChange={(e) => set('jenisBahan', e.target.value.toUpperCase())} className={FIELD} />
              </div>
              <div>
                <label htmlFor="warna" className={LABEL}>
                  Warna
                </label>
                <input id="warna" value={form.warna} onChange={(e) => set('warna', e.target.value)} className={FIELD} />
              </div>
              <div>
                <label htmlFor="deadline" className={LABEL}>
                  Deadline Pengiriman
                </label>
                <input id="deadline" type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} className={FIELD} />
              </div>
              <div>
                <label htmlFor="sizeChartId" className={LABEL}>
                  Size Chart (opsional)
                </label>
                <select id="sizeChartId" value={form.sizeChartId} onChange={(e) => set('sizeChartId', e.target.value)} className={FIELD}>
                  <option value="">-- Tanpa Size Chart --</option>
                  {sizeCharts.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="notes" className={LABEL}>
                  Catatan Tambahan
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-medium text-slate-800 sm:text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <span className={LABEL}>ACC Customer (Gambar)</span>
                <AccImageUpload value={form.accCustUrl} onChange={(url) => set('accCustUrl', url)} label={`${form.noInv} - ${form.namaCustomer}`} />
              </div>
            </div>
          </section>

          <section className={CARD}>
            <h2 className="mb-4 text-sm font-bold text-slate-900">Detail Produksi (Metode)</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['prodDetail1', 'prodDetail2', 'prodDetail3', 'prodDetail4'] as const).map((key, i) => (
                <div key={key}>
                  <label htmlFor={key} className={LABEL}>
                    Detail {i + 1}
                  </label>
                  <input id={key} value={form[key]} onChange={(e) => set(key, e.target.value)} className={FIELD} />
                </div>
              ))}
            </div>
          </section>

          <section className={CARD}>
            <h2 className="mb-1 text-sm font-bold text-slate-900">Harga &amp; Status</h2>
            <p className="mb-4 text-[11px] text-slate-500">Harga jual per pcs sebelum tambahan ukuran besar. DP dan biaya operasional dikelola di modul finansial.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CATEGORY_DISPLAY_ORDER.map((cat) => (
                <div key={cat}>
                  <label htmlFor={`harga-${cat}`} className={LABEL}>
                    Harga Jual {CATEGORY_LABELS[cat]}
                  </label>
                  <CurrencyInput id={`harga-${cat}`} value={form.harga[cat] || ''} onValueChange={(v) => setHarga(cat, v)} className="h-11 text-base sm:h-10 sm:text-xs" />
                </div>
              ))}
              <div>
                <label htmlFor="diskonHarga" className={LABEL}>
                  Diskon (Rp)
                </label>
                <CurrencyInput id="diskonHarga" value={form.diskonHarga || ''} onValueChange={(v) => set('diskonHarga', v)} className="h-11 text-base sm:h-10 sm:text-xs" />
              </div>
              <div>
                <label htmlFor="status" className={LABEL}>
                  Status Order
                </label>
                <select id="status" value={form.status} onChange={(e) => set('status', e.target.value as OrderStatus)} className={FIELD}>
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-[11px] leading-relaxed text-slate-600">
                {form.vendorId ? (
                  <>
                    Vendor: <strong className="text-slate-900">{getVendorName(form.vendorId)}</strong>. Modal:{' '}
                    {CATEGORY_DISPLAY_ORDER.map((cat) => `${CATEGORY_LABELS[cat]} ${formatRupiah(form.hargaVendor[cat] || 0)}`).join(', ')}
                  </>
                ) : (
                  'Harga modal vendor belum diset.'
                )}
              </div>
              <button
                type="button"
                onClick={() => setVendorModalOpen(true)}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 text-xs font-bold text-teal-800 hover:bg-teal-50 sm:h-10"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Atur Harga Modal Vendor
              </button>
            </div>
          </section>
        </div>

        <section className={cn(CARD, 'h-fit min-w-0 space-y-4')}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Qty per Jenis Lengan</h2>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-teal-800">{summary.totalPesanan} pcs</span>
          </div>
          {CATEGORY_DISPLAY_ORDER.map((cat) => (
            <div key={cat} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">Qty {CATEGORY_LABELS[cat]}</h3>
                <span className="text-[11px] font-bold tabular-nums text-slate-500">Jumlah: {summary.qtyPerKategori[cat]} pcs</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-9">
                {SIZES.map((s) => {
                  const key = qtyKey(cat, s);
                  return (
                    <label key={key} className="flex flex-col items-center gap-1">
                      <span className="text-[10.5px] font-bold text-slate-500">{s}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={form.qty[key] || ''}
                        placeholder="0"
                        onChange={(e) => setQty(key, Math.max(0, parseInt(e.target.value, 10) || 0))}
                        aria-label={`Qty ${CATEGORY_LABELS[cat]} ${s}`}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-1 text-center text-sm font-bold tabular-nums text-slate-900 placeholder-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-20 -mx-1 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur-md md:bottom-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-[10.5px] text-slate-500">Total Pesanan</dt>
              <dd className="font-extrabold tabular-nums text-slate-900">{summary.totalPesanan} pcs</dd>
            </div>
            <div>
              <dt className="text-[10.5px] text-slate-500">Total Jumlah</dt>
              <dd className="font-extrabold tabular-nums text-teal-700">{formatRupiah(summary.jumlahSemua)}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] text-slate-500">Total Modal Vendor</dt>
              <dd className="font-bold tabular-nums text-slate-600">{formatRupiah(summary.modalVendor)}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] text-slate-500">Profit{biayaOperasional > 0 ? ' (setelah biaya operasional)' : ''}</dt>
              <dd className={cn('font-extrabold tabular-nums', profitTone)}>
                {formatRupiah(summary.profit)}
                {summary.jumlahSemua > 0 && <span className="ml-1 text-[10.5px] font-bold">({summary.profitPercent.toFixed(1)}%)</span>}
              </dd>
            </div>
          </dl>
          <div className="grid grid-cols-2 gap-2 xl:flex">
            <button type="button" onClick={handleCancel} className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs text-slate-700 hover:bg-slate-50 shadow-btn-secondary font-medium">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 text-xs text-white hover:bg-teal-700 disabled:opacity-60 border border-teal-700 shadow-btn-primary font-medium"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Order'}
            </button>
          </div>
        </div>
      </div>

      <VendorPriceModal
        open={vendorModalOpen}
        vendors={vendors}
        vendorId={form.vendorId}
        prices={form.hargaVendor}
        onClose={() => setVendorModalOpen(false)}
        onSave={(vendorId, prices) => setForm((prev) => ({ ...prev, vendorId, hargaVendor: prices }))}
      />
      {leaveDialog}
      <AddKategoriModal open={kategoriModalOpen} onClose={() => setKategoriModalOpen(false)} onAdded={(nama) => set('kategoriOrder', nama)} />
      <VendorUnpaidDialog open={vendorUnpaid !== null} outstanding={vendorUnpaid ?? 0} onClose={() => setVendorUnpaid(null)} />
      <ConfirmDialog
        open={confirmLeave}
        title="Buang perubahan?"
        description="Perubahan pada form ini belum disimpan dan akan hilang."
        confirmLabel="Buang perubahan"
        onConfirm={() => {
          setConfirmLeave(false);
          initialSnapshot.current = JSON.stringify(form);
          router.push(cancelTarget);
        }}
        onClose={() => setConfirmLeave(false)}
      />
    </form>
  );
}
