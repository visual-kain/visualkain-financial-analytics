// Nama pengganti yang dibuat useFirebaseFinance saat order tidak punya vendor; bukan nama vendor sungguhan.
const PLACEHOLDER_VENDOR_NAMES = new Set(['tanpa vendor', 'vendor mitra', 'mitra produksi', '-', '']);

export function isPlaceholderVendorName(name: string | null | undefined): boolean {
  return PLACEHOLDER_VENDOR_NAMES.has((name || '').trim().toLowerCase());
}

/** `vendorId` hanya diisi bila nama cocok dengan dokumen `vendors`; nama tanpa dokumen disimpan apa adanya. */
export function resolveVendorRef(
  vendorNama: string,
  vendors: ReadonlyArray<{ id: string; nama: string }>
): { vendorId: string; vendorName: string } {
  const name = (vendorNama || '').trim();
  if (isPlaceholderVendorName(name)) return { vendorId: '', vendorName: '' };

  const match = vendors.find((v) => v.nama.trim().toLowerCase() === name.toLowerCase() || v.id === name);
  return match ? { vendorId: match.id, vendorName: match.nama } : { vendorId: '', vendorName: name };
}
