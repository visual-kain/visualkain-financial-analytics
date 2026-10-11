# Technical Design — F-02: Executive Financial Dashboard, Liquidity Bar & Inspection Drawer

## 1. Liquidity & Safe-to-Spend Computation
```typescript
export interface LiquidityBarData {
  saldoBankRiil: number;
  danaTerkunciVendor: number;      // Hak vendor yang masih belum dibayarkan
  cadanganOperasional: number;     // Estimasi beban kas keluar bulanan
  kasAmanTarik: number;            // max(0, saldoBankRiil - danaTerkunciVendor - cadanganOperasional)
}
```

## 2. WhatsApp Follow-Up Generator
```typescript
export function generateWhatsAppFollowUpLink(
  noWa: string,
  customerName: string,
  noInv: string,
  projectName: string,
  nominalDp: number,
  sisaMenujuDp70: number
): string {
  const cleanPhone = noWa.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const message = `Halo Kak ${customerName}, salam dari VisualKain Management.\n\n` +
    `Terima kasih telah melakukan pembayaran awal untuk pesanan *${projectName}* (${noInv}) sebesar Rp ${nominalDp.toLocaleString('id-ID')}.\n\n` +
    `Mengingat SOP produksi kami memerlukan komitmen DP 70% agar bahan dapat langsung naik potong & jahit, saat ini tersisa *Rp ${sisaMenujuDp70.toLocaleString('id-ID')}* lagi untuk mencapai ambang batas produksi.\n\n` +
    `Bila ada kendala atau pertanyaan mengenai jadwal produksi, silakan kabari kami ya Kak. Terima kasih banyak 🙏`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
```

## 3. Slide-Over Inspection Drawer Topology
```
src/components/finance/
├── EscrowLiquidityBar.tsx      # Baris visualisasi likuiditas kas aman ditarik
├── OrderInspectionDrawer.tsx   # Slide-over drawer inspeksi timeline cicilan & WA FU
└── MasterFinanceTable.tsx      # Tabel master dengan grouped headers
```
