## 1. Technical Architecture & Modifications Overview

```
+------------------------------------------------------------------------------------+
| BATCH 1 (COMPLETED & VERIFIED)                                                     |
| 1. FinanceReportPaper.tsx: Hapus baris `Keuntungan Real (Manual)`                  |
| 2. EditFinanceModal.tsx: Tambah aksi Edit baris pembayaran termin                  |
| 3. Period Sync: Sinkronisasi filter header dengan CashInflow & CashOutflow         |
| 4. Escrow Analytics: Agregasi dinamis `calculateEscrowAllocation` & audit badge    |
| 5 & 6. MasterFinanceTable.tsx: Standard search bar & paginasi 10 order per page    |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| BATCH 2 (ARCHITECTURAL REFINEMENTS & SSOT INTEGRATION)                             |
| 7. Bidirectional DP Mutation & Firestore Sync Engine (US-9.7)                      |
|    - Root cause: `onSnapshot` membaca `d.riwayatPembayaran` & field legacy         |
|    - Sinkronisasi: Update `riwayatPembayaran` format SSOT: `{ jumlah, tanggal, ...}`|
|    - Auto-recalculate: `totalUangMasukCustomer`, `statusPembayaran`, `sisaPelunasan`|
|    - Table reaktif: Master table langsung mengupdate angka tanpa reload            |
+------------------------------------------------------------------------------------+
| 8. Dedicated Page Architecture (US-9.8)                                            |
|    - Eliminasi Modal Floating: Cegah data hilang akibat terklik ESC / backdrop      |
|    - Resolusi Bug z-index: Fullscreen expand vs modal layer collision              |
|    - Routing: Rute dedicated `/orders/[id]/edit` atau tab-state view `/edit-order` |
|    - Breadcrumb aman: Tombol Simpan & Kembali ke Master Finansial                  |
+------------------------------------------------------------------------------------+
| 9. Dedicated Detail Kas Masuk View (US-9.9)                                        |
|    - Dual-Source Aggregation: Riwayat pembayaran konsumen + mutasi kas masuk      |
|    - Breakdown detail: No Inv, Customer, Project, Nominal, Kategori, Bank Rekening  |
|    - Filter & Search: Live filter jenis termin/kas masuk + periode                 |
|    - Mobile Ergonomics: Card list responsif dengan format tabular-nums             |
+------------------------------------------------------------------------------------+
| 10. 70% Production Threshold Flow Card (US-9.10)                                   |
|    - Standar VisualKainDB: Breakdown tagihan invoice bertahap                       |
|    - Step 1: DP 1 Booking (Awal)                                                   |
|    - Step 2: DP 2 Threshold 70% (Syarat Mutlak Vendor Mulai Jahit/Potong)          |
|      * Target 70% = 0.7 * Total Tagihan                                            |
|      * Sisa menuju 70% = max(0, Target 70% - Terbayar)                             |
|      * Alert visual: Status kuning jika belum cukup, hijau jika siap produksi      |
|    - Step 3: Sisa Pelunasan 30% Sebelum Pengiriman                                 |
+------------------------------------------------------------------------------------+
| 11. Complete Transaction Metric Card Layout (US-9.11)                              |
|    - Reference: VisualKainDB Tracking Profit (Realtime)                            |
|    - Data yang Ditampilkan: No Inv, Cust, Proj, Tgl, Revenue, HPP Vendor, OpEx,    |
|      Net Margin, Margin %, Status Order, Nama Vendor                               |
|    - ATURAN KHUSUS: Kolom "Profit Aktual" DITIADAKAN (Dilarang dimasukkan)        |
|    - Mobile Layout: 2-kolom metadata tile, text-[11px], anti-overflow              |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| BATCH 3 (DIRECT CLIENT AUDIT: SIDEBAR, SIMPLE CHART, WA, VENDOR, DEDICATED PAGES)   |
| 12. Sidebar Badge Removal (US-9.12): Hapus pill badge di item tab navigasi         |
| 13. Simplified Intuitive Chart (US-9.13): Ganti donut escrow dengan Bar Chart /     |
|     Progress Real: Kas Masuk vs Kas Keluar Periode Ini & Saldo Kas Riil            |
| 14. Persistent WhatsApp & Solid Header (US-9.14):                                  |
|     - Jangan hilangkan tombol WA saat DP >= 70%: adaptif Tagih 70% / Pelunasan     |
|     - Sediakan aksi WA di kartu mobile; ubah sticky header table ke warna solid    |
| 15. Dynamic Vendor Directory (US-9.15): Tarik seluruh vendor riil Firestore +      |
|     orders; pre-populate vendor aktif order; simpan vendorName & vendorId          |
| 16. Total Modal Elimination (US-9.16): Dedicate Page `/orders/[id]/edit`,          |
|     `/cash-in/new`, `/cash-out/new` menggantikan seluruh floating modal            |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| BATCH 4 (PRINT ENGINE, CONTEXTUAL EXPORT, 1-PAGE LIMIT, INFLOW CHART, FILTER & DATE)|
| 17. Print Table Color Exact (US-9.17): `print-color-adjust: exact` pulihkan header |
| 18. Contextual Export Filename (US-9.18): `[NO_INV] - [PROJECT].pdf` via doc.title |
| 19. Single-Page Print Limit (US-9.19): `display: none` background, eliminasi 4-8 p |
| 20. Inflow Chart Revamp (US-9.20): Ganti donut DP 97% dengan Rekening BCA/Mandiri  |
| 21. Universal Filter & Search Audit (US-9.21): Fix tipe keluar, search saldo kas   |
| 22. Unambiguous Date Format (US-9.22): Format `15 Sep` & badge rentang waktu jelas |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| BATCH 5 (ESCROW ELIMINATION, FILTER CLEANUP, FLUID FULL-WIDTH, EXCELJS INZTA)      |
| 23. Escrow Bar Elimination (US-9.23): Hapus `EscrowLiquidityBar`, clean defisit     |
| 24. Clean Vendor Filter (US-9.24): 3 opsi tegas (Semua, Hanya Utang, Vendor Lunas) |
| 25. Fluid Full-Width Container (US-9.25): `max-w-[1920px]` desktop & mobile aman   |
| 26. Dedicated DP & Edit Flow (US-9.26): Alur edit mandiri standar VisualKainDB     |
| 27. Copywriting Formal Indo (US-9.27): Audit total istilah asing -> Akuntansi Baku  |
| 28. Executive ExcelJS Export (US-9.28): Header Teal, format Rp, border, auto-width |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| BATCH 6 (MOBILE USABILITY: DEDICATED DATA TABLE TAB & SCROLL ELIMINATION)          |
| 29. Dedicated Data Table Tab (US-9.29): 5th tab on Mobile Nav & Sidebar,           |
|     pindahkan `MasterFinanceTable` dari Dashboard ke tab tersendiri, eliminasi     |
|     kebutuhan scrolling ribuan pixel di layar HP, dashboard murni KPI & Charts.    |
+------------------------------------------------------------------------------------+
```

---

## 2. In-Depth Technical Specifications (Batch 2)

### 2.1. Root Cause & Solution: Firestore DP Synchronization (`US-9.7`)
* **Root Cause**:
  Pada [`EditFinanceModal.tsx`](file:///d:/Projects/visualkain-financial-analytics/src/components/finance/EditFinanceModal.tsx), payload yang dikirim saat menyimpan termin adalah `pembayaranList`. Sedangkan listener realtime [`useFirebaseFinance.ts`](file:///d:/Projects/visualkain-financial-analytics/src/hooks/useFirebaseFinance.ts) memetakan pesanan dari field Firestore `d.riwayatPembayaran` (array of objects) atau `d.dp1Nominal`, `d.dp2Nominal`, `d.pelunasanNominal`. Karena field `riwayatPembayaran` tidak dimutasi sesuai format Firestore, listener realtime `onSnapshot` memuat ulang data usang, mengakibatkan perubahan hapus/edit DP tidak tampak di tabel utama.
* **Solusi Arsitektural**:
  Dalam fungsi `updateOrderFinance`:
  ```ts
  const riwayatPembayaranFirestore = pembayaranList.map((p) => ({
    jumlah: Number(p.nominal),
    tanggal: p.tanggal,
    catatan: p.keterangan || (p.jenis === 'dp' ? 'DP Pembayaran' : 'Pembayaran Termin'),
    jenis: p.jenis,
  }));

  const totalMasuk = pembayaranList.reduce((acc, p) => acc + Number(p.nominal), 0);
  const statusPembayaran = totalMasuk >= totalInvoice ? 'lunas' : totalMasuk > 0 ? 'parsial' : 'belum_bayar';

  await updateDoc(doc(db, 'orders', orderId), {
    riwayatPembayaran: riwayatPembayaranFirestore,
    pembayaranList: pembayaranList,
    totalUangMasukCustomer: totalMasuk,
    dpNominal: totalMasuk,
    statusPembayaran,
    updatedAt: serverTimestamp(),
  });
  ```
  Ini menjamin sinkronisasi instan dua arah pada state lokal React dan database Firestore tanpa reload.

---

### 2.2. Dedicated Page Architecture (`US-9.8`)
* **Masalah User & Z-Index Collision**:
  Saat tabel difullscreen-kan (`isExpanded`), container berada di layer `fixed inset-0 z-50`. Modal `EditFinanceModal` yang juga ber-`z-50` dapat muncul di belakang backdrop tabel. Lebih kritis lagi, klien mengeluhkan bahwa modal floating rawan tertutup secara tidak sengaja (misal menekan ESC atau menyentuh backdrop di mobile) sehingga input finance yang belum tersimpan hilang.
* **Desain Dedicated Page**:
  - Menyediakan rute Next.js `/orders/[id]/edit` atau dedicated view state `editingOrderId: string | null` yang merender halaman form layar penuh mandiri.
  - Halaman ini memiliki:
    1. Header Form Eksekutif dengan breadcrumb: `Master Finansial > Edit Finansial Order [NO_INV]`.
    2. Tombol "Kembali" yang memicu konfirmasi dialog jika ada perubahan yang belum disimpan (*dirty form guard*).
    3. Tombol "Simpan Perubahan Finansial" yang tegas dan selalu berada di viewport yang nyaman.
    4. Kontrol keyboard-friendly dan tap target mobile minimal 44x44px.

---

### 2.3. Dedicated Detail Kas Masuk & Search/Filter (`US-9.9`)
* **Kebutuhan**:
  Klien melihat angka `+Rp 121.047.500` pada rincian saldo kas, namun saat ini mutasi yang ditampilkan di bawahnya hanya mutasi kas keluar.
* **Spesifikasi Tampilan Detail Kas Masuk**:
  - Halaman / sub-view khusus yang menggabungkan seluruh transaksi kas masuk dari 2 sumber data:
    1. **Sumber A**: Cicilan/termin order konsumen (DP 1, DP 2, Pelunasan).
    2. **Sumber B**: Mutasi kas masuk langsung (kategori penerimaan non-order di Firestore `kas` dengan `tipe === 'masuk'`).
  - Fitur:
    - Search input real-time (No Inv, Customer, Keterangan).
    - Filter kategori: Semua, DP 1, DP 2, Pelunasan, Kas Masuk Non-Order.
    - Filter rekening/metode pembayaran.
    - Layout kartu mobile ramah jari dengan nominal format font mono tabular.

---

### 2.4. Flow Card Sisa DP & Threshold 70% Produksi (`US-9.10`)
* **Spesifikasi Logika Bisnis Garmen VisualKain**:
  ```
  +------------------------------------------------------------------------------------+
  | TOTAL TAGIHAN ORDER: Rp 10.000.000 (100%)                                         |
  +------------------------------------------------------------------------------------+
  | [Tahap 1: DP 1 Booking]                                                           |
  | Terbayar: Rp 2.000.000 (20%)                                                       |
  +------------------------------------------------------------------------------------+
  | [Tahap 2: Syarat DP 2 (70% Produksi Vendor)]                                       |
  | Target 70%: Rp 7.000.000                                                          |
  | Kekurangan Menuju 70%: Rp 5.000.000                                               |
  | STATUS: ⚠️ Kurang Rp 5.000.000 agar pesanan boleh masuk jadwal potong/jahit       |
  +------------------------------------------------------------------------------------+
  | [Tahap 3: Pelunasan 30% Sebelum Pengiriman]                                       |
  | Sisa Pelunasan: Rp 3.000.000                                                      |
  +------------------------------------------------------------------------------------+
  ```
* **Penerapan UI**:
  Kartu visual ini ditampilkan otomatis saat order dipilih pada form input pembayaran kas masuk maupun di halaman edit finansial order. Menghilangkan keraguan kasir mengenai jumlah nominal yang harus ditagihkan kepada konsumen.

---

### 2.5. Card Rincian Transaksi Pembentuk Metric Drawer (`US-9.11`)
* **Perbandingan Elemen VisualKainDB vs Current Card**:
  - `NO INV`: Ditampilkan (Badge Mono)
  - `CUSTOMER`: Ditampilkan (Font Bold)
  - `PROJECT`: Ditampilkan (Subtitle)
  - `TANGGAL`: **DITAMBAHKAN** (Format YYYY-MM-DD)
  - `REVENUE`: Ditampilkan (Total Invoice)
  - `TOTAL KE VENDOR`: Ditampilkan (HPP Pokok)
  - `BIAYA OPERASIONAL`: **DITAMBAHKAN** (Biaya Operasional Order)
  - `PROFIT`: Ditampilkan (Net Profit)
  - `MARGIN %`: Ditampilkan (Persentase Margin)
  - `STATUS ORDER`: **DITAMBAHKAN** (Badge Menunggu Pembayaran / Produksi / Selesai)
  - `MITRA VENDOR`: Ditampilkan (Nama Vendor)
  - **`PROFIT AKTUAL`**: **DIBUANG / TIDAK DITAMPILKAN** (Menegakkan instruksi user).
* **Mobile Ergonomics**:
  Menggunakan grid 2-kolom ringkas pada mobile dengan spacing `gap-1.5` dan padding `p-3`, border slate-200, dan hit target tombol "Detail" minimal 40px.

---

### 2.6. Pembersihan Badge Navigasi Sidebar (`US-9.12`)
* **Implementasi di [`Sidebar.tsx`](file:///d:/Projects/visualkain-financial-analytics/src/components/layout/Sidebar.tsx)**:
  - Hapus properti `badge: '...'` pada array definisi `tabs`.
  - Hapus elemen rendering badge:
    ```tsx
    // HAPUS elemen badge ini:
    {!isCollapsed && (
      <span className="relative z-10 rounded-full px-2 py-0.5 text-[10px] ...">
        {tab.badge}
      </span>
    )}
    ```
  - Item tab kini hanya menampilkan ikon Lucide dan label judul yang terpusat rapi dan lega.

---

### 2.7. Desain Penyederhanaan Grafik Finansial Dashboard (`US-9.13`)
* **Audit Masalah Grafik Escrow**:
  Klien (Head of Finance & Owner) bingung memahami Donut Chart "Alokasi Hak Dana (Escrow)" ("maksudnya apa"). Konsep akuntansi escrow proporsional HPP vs Laba terlalu teoretis dan tidak langsung menjawab pertanyaan operasional sehari-hari: *"Berapa uang yang kita terima bulan ini, berapa yang kita keluarkan, dan berapa sisa kas riil di bank?"*
* **Rekomendasi Desain Baru**:
  Ganti Donut Escrow dengan **Kartu Komparasi Arus Kas Riil & Saldo Bersih**:
  ```
  +------------------------------------------------------------------------------------+
  | RINGKASAN ARUS KAS PERIODE INI                                    [Okt 2026]       |
  | Pemasukan Kas vs Beban Pengeluaran Riil                                            |
  +------------------------------------------------------------------------------------+
  |                                                                                    |
  |   KAS MASUK RIIL       Rp 121.047.500  [======================== 72%] (Hijau)      |
  |   KAS KELUAR RIIL      Rp  46.850.000  [========= 28%] (Merah)                     |
  |                                                                                    |
  |   ------------------------------------------------------------------------------   |
  |   SURPLUS KAS BERSIH : +Rp 74.197.500 (Net Operating Cashflow)                     |
  |   SALDO KAS SAAT INI :  Rp 74.197.500 (Tersinkronisasi Rekening Bank BCA/Mandiri)  |
  +------------------------------------------------------------------------------------+
  ```
  - Format visual menggunakan bar progress komparatif dengan angka nominal besar font tabular monospaced.
  - Sangat mudah dipahami dalam 3 detik oleh klien tanpa perlu penjelasan formula akuntansi yang rumit.

---

### 2.8. Audit Tombol Follow-Up WhatsApp & Solid Sticky Header (`US-9.14`)
* **Root Cause 1: Mengapa Tombol WA "Ilang-ilangan"?**:
  1. Pada [`MasterFinanceTable.tsx`](file:///d:/Projects/visualkain-financial-analytics/src/components/finance/MasterFinanceTable.tsx) baris 487:
     `{row.dpPersenCustomer < 70 && (`
     Tombol di-hardcode hanya muncul saat DP $< 70\%$. Ketika customer telah membayar DP 70%, tombol WA seketika HILANG dari tabel. Padahal customer tersebut masih berutang sisa pelunasan 30% dan kasir perlu menagih pelunasan sebelum pesanan dikirim! Klien mengira ini bug tombol hilang-timbul.
  2. Tombol WA sama sekali tidak tersedia pada tampilan kartu mobile (`renderMobileCardContent`), sehingga kasir yang mengakses via smartphone tidak bisa menagih.
  3. Handler tombol WA hanya membuka drawer inspeksi, tidak langsung membuat tautan `https://wa.me/...`.
* **Solusi Tombol WA**:
  - Tombol WA dihadirkan secara persisten selama ada piutang atau kebutuhan follow-up order:
    * Jika DP $< 70\%$: Tombol hijau `Tagih DP 70%` (Pesan penagihan syarat produksi).
    * Jika DP $\ge 70\%$ & $< 100\%$: Tombol amber `Tagih 30%` (Pesan penagihan pelunasan order).
    * Jika Lunas ($100\%$): Tombol teal `Info WA` (Konfirmasi pelunasan dan info ekspedisi).
  - Tampilkan tombol WA pada tabel desktop dan kartu mobile dengan target sentuh $\ge 40\text{ px}$.
  - Klik langsung membuka WhatsApp dengan nomor internasional `62...` dan template pesan otomatis yang ramah.
* **Root Cause 2: Teks Header Kolom Bertumpuk**:
  - Pada baris 343: `<th colSpan={2} className="... bg-slate-100/70 ...">`. Opacity 70% membuat teks kolom non-sticky yang meluncur di bawahnya terlihat menembus (bleed-through).
  - Solusi: Ubah seluruh background sticky header menjadi solid `bg-slate-100` dan `bg-white` (tanpa alpha `/70` atau `/50`), serta kunci lebar kolom `min-w` dan `z-30`.

---

### 2.9. Master Mitra Vendor Dinamis & Pre-Population (`US-9.15`)
* **Root Cause**:
  1. [`src/lib/constants.ts`](file:///d:/Projects/visualkain-financial-analytics/src/lib/constants.ts) hanya mendefinisikan 5 vendor hardcoded (`AMRIN`, `CAHAYA BORDIR`, `FJ MERCHANDISE`, `CITITEX`, `VENDOR TOPI PK UCI`).
  2. Database Firestore memiliki vendor lain (seperti `Vendor Wisnu`, `LAJUWARNA`) yang tidak muncul di dropdown pilihan.
  3. State `vendorNama` di [`EditFinanceModal.tsx`](file:///d:/Projects/visualkain-financial-analytics/src/components/finance/EditFinanceModal.tsx) di-default ke `'AMRIN'` dan tidak pernah membaca `order.vendorName`.
  4. Saat menyimpan, field `vendorName` dan `vendorId` tidak dimasukkan ke dalam `updatedPayload`.
* **Solusi Arsitektur**:
  - Gabungkan seluruh vendor dari koleksi Firestore `vendors` dan nilai unik `vendorName` dari seluruh dokumen `orders`.
  - Teruskan daftar vendor lengkap ke formulir edit finansial.
  - Inisialisasi input vendor sesuai nilai `order.vendorName` pesanan aktif.
  - Simpan `vendorName` dan `vendorId` ke Firestore saat tombol simpan ditekan.

---

### 2.10. Arsitektur Dedicated Full-Page Transisi (`US-9.16`)
* **Menghilangkan Seluruh Modal Mengambang**:
  1. **`/orders/[id]/edit`**: Halaman mandiri edit finansial pesanan.
     - Breadcrumb: `Master Finansial > Edit Finansial [NO_INV]`.
     - Layout form 3-bagian: (1) Nilai Invoice & Diskon, (2) Riwayat Termin & Threshold 70%, (3) Mitra Vendor & HPP.
     - Sticky bottom bar: Tombol "Batal / Kembali" dan "Simpan Perubahan Finansial".
     - Dirty form guard: Peringatan jika meninggalkan halaman dengan perubahan yang belum disimpan.
  2. **`/cash-in/new`**: Halaman mandiri pencatatan kas masuk / termin order / penerimaan lain.
  3. **`/cash-out/new`**: Halaman mandiri pencatatan pengeluaran kas / bayar vendor / operasional.
  4. **`/cash-in/detail`**: Halaman rincian lengkap seluruh transaksi kas masuk konsumen & langsung.

---

### 2.11. Pemulihan Warna Hitam & Header Tabel Cetak (`US-9.17`)
* **Masalah**:
  Saat mencetak atau menyimpan invoice laporan finansial ke PDF, browser secara default mengaktifkan fitur penghemat tinta yang meniadakan warna latar belakang CSS (`background-color`). Akibatnya, header tabel `.invoice-items th` yang berwarna hitam pekat (`#0f172a`) menjadi putih/transparan, dan teks putih kontras di dalamnya memudar atau menjadi abu-abu tidak terbaca.
* **Solusi di [`src/app/globals.css`](file:///d:/Projects/visualkain-financial-analytics/src/app/globals.css)**:
  ```css
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .invoice-items th {
      background-color: #0f172a !important;
      color: #ffffff !important;
      border: 1px solid #0f172a !important;
    }
    .invoice-items td {
      border-bottom: 1px solid #cbd5e1 !important;
      color: #0f172a !important;
    }
    .tp-header, .tp-section {
      background-color: #ffffff !important;
      border-color: #cbd5e1 !important;
    }
  }
  ```

---

### 2.12. Kontekstual & Otomatisasi Nama File Export PDF/Excel (`US-9.18`)
* **Masalah**:
  Saat dialog "Save As" PDF muncul (Gambar 2), nama file secara default adalah `VisualKain Financial Data & Analytics.pdf`. Hal ini terjadi karena Chrome menggunakan `document.title` halaman sebagai default filename.
* **Solusi Cetak PDF**:
  Sebelum memanggil `window.print()` pada invoice, modifikasi sementara `document.title`:
  ```tsx
  const handlePrint = (order: Order) => {
    const prevTitle = document.title;
    const cleanProject = (order.namaProject || order.namaCustomer || 'Order')
      .replace(/[/\\?%*:|"<>]/g, '-');
    document.title = `${order.noInv} - ${cleanProject}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1200);
  };
  ```
  Dengan ini, file PDF yang disimpan otomatis bernama: `VK260039 - Seragam PDL Himpunan.pdf`.
* **Solusi Ekspor Excel**:
  Pada `page.tsx`, `CashInflowSection.tsx`, dan `CashOutflowSection.tsx`, namai file dengan periode:
  `VisualKain_Master_Finance_${periodeFormatted}_${tanggalHariIni}.xlsx`.

---

### 2.13. Pembatasan Cetak Single-Page Presisi (`US-9.19`)
* **Root Cause Pratinjau 4 hingga 8 Halaman**:
  Aturan `@media print` sebelumnya menggunakan `body * { visibility: hidden; }`. Pada spesifikasi CSS, `visibility: hidden` menyembunyikan tampilan elemen tetapi **tetap mempertahankan dimensi tata letak (layout flow)** di DOM. Karena dashboard memiliki tabel panjang ratusan baris dan drawer tersembunyi, Chrome mengkalkulasi tinggi halaman mencapai ribuan pixel dan membaginya ke dalam 4 s.d. 8 lembar halaman kosong.
* **Solusi Arsitektural**:
  1. Di CSS cetak, gunakan `display: none !important;` untuk seluruh elemen selain container cetak:
     ```css
     @media print {
       @page {
         size: A4 portrait;
         margin: 6mm 8mm;
       }
       body > *:not(#printContainer) {
         display: none !important;
       }
       #financeReportPaper {
         display: block !important;
         width: 100% !important;
         max-height: 282mm !important;
         page-break-inside: avoid !important;
         break-inside: avoid !important;
         overflow: hidden !important;
         font-size: 9.5pt !important;
       }
       .invoice-items {
         page-break-inside: avoid !important;
         margin-bottom: 0.5rem !important;
       }
       .tp-section {
         page-break-inside: avoid !important;
       }
     }
     ```
  2. Ini menjamin dokumen terkunci tepat dalam 1 lembar A4 portrait (*single-page fit*).

---

### 2.14. Revamp Grafik Komposisi Pemasukan (`US-9.20`)
* **Audit Donut Chart Eksisting (Gambar 3)**:
  Donut "Komposisi Jenis Pemasukan" sebelumnya menunjukkan Uang Muka DP 97.6% vs Termin Produksi 2.4%. Diagram ini hampir seluruhnya satu warna monoton dan tidak memberikan wawasan operasional.
* **Desain Pengganti (Perbandingan Termin Pembayaran Konsumen)**:
  Mengganti grafik dengan **Komposisi Termin Pembayaran Konsumen**:
  - **DP 1 Booking / Uang Muka Awal**: Nominal & Persentase (Warna Teal VisualKain `#0f766e`)
  - **DP 2 Termin 70% Syarat Produksi**: Nominal & Persentase (Warna Amber `#f59e0b`)
  - **Pelunasan Akhir 30% Sebelum Pengiriman**: Nominal & Persentase (Warna Emerald `#10b981`)
  - *Manfaat Nyata*: Kasir dan Head of Finance dapat melihat secara instan berapa banyak order yang sudah aman masuk lini produksi (mencapai target 70%) dan berapa porsi kas yang siap ditagihkan untuk pelunasan akhir.

---

### 2.15. Audit & Penyelarasan Menyeluruh Seluruh Filter & Search (`US-9.21`)
* **Daftar Perbaikan Filter per Komponen**:
  1. **`CashOutflowSection.tsx`**: Tambahkan kondisi `item.tipe === 'keluar'` pada `filteredEntries` agar penerimaan kas langsung tidak tercampur ke pengeluaran.
  2. **`MetricDetailDrawer.tsx`**: Pada tampilan metrik saldo kas, sambungkan `searchQuery` ke array transaksi kas sehingga filter pencarian berfungsi aktif.
  3. **`VendorPerformanceSection.tsx`**: Tambahkan komponen live search input box untuk menyaring nama mitra vendor.
  4. **`MasterFinanceTable.tsx`**: Reset `currentPage` ke 1 secara instan saat filter status atau `searchQuery` berubah untuk menghindari halaman kosong.
  5. **Header Global `page.tsx`**: Pastikan filter bulan dan tahun pada header mengontrol seluruh sub-tab secara serentak tanpa desinkronisasi.

---

### 2.16. Standarisasi Format Tanggal Anti-Ambiguitas & Header Rentang Waktu (`US-9.22`)
* **Audit Label Sumbu X (Gambar 5)**:
  Format `09-15`, `09-23`, `10-02` disalahartikan klien sebagai rentang tanggal "9 sampai 15".
* **Solusi**:
  1. Buat helper utilitas `formatDateTick(dateStr: string): string` yang mengonversi tanggal ISO ke format Indonesia yang tidak ambigu:
     - `2026-09-15` $\rightarrow$ `15 Sep`
     - `2026-09-23` $\rightarrow$ `23 Sep`
     - `2026-10-02` $\rightarrow$ `02 Okt`
  2. Pada kartu grafik, tampilkan header rentang waktu eksplisit:
     *"Rentang Waktu: 15 Sep 2026 – 12 Okt 2026 (9 Hari Transaksi)"*.
  3. Pada tooltip grafik, tampilkan tanggal lengkap formal bahasa Indonesia:
     *"Selasa, 15 September 2026 — Pengeluaran: Rp 4.000.000"*.

---

### 2.17. Arsitektur Eliminasi Total `EscrowLiquidityBar` & Penanganan Kas Defisit (`US-9.23`)
* **Akar Masalah**:
  Komponen `EscrowLiquidityBar` membagi saldo bank menjadi kantong dana aman dan kantong vendor escrow. Ketika saldo bank defisit (seperti `-Rp 224.500`), formula mengunci nilai `kasAmanDitarik: 0` dan `danaTerkunciVendor: 0` dengan `percentDefisit: 100%`, sehingga menampilkan bar 100% merah pekat dan badge Rp 0 yang tampak seperti bug sistem. Klien merasa sangat bingung dan terbebani secara kognitif.
* **Solusi Arsitektur**:
  1. Hapus pemanggilan `<EscrowLiquidityBar ... />` dari `src/app/page.tsx`.
  2. Dashboard utama langsung menampilkan kartu ringkasan KPI (`FinanceStatsGrid`).
  3. Tambahkan penanganan defensif kas defisit minimalis pada header:
     ```tsx
     {summary.saldoKasRiil < 0 && (
       <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-medium text-rose-800">
         <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
         <span>Perhatian: Saldo Kas Bank saat ini tercatat defisit ({formatRupiah(summary.saldoKasRiil)}).</span>
       </div>
     )}
     ```

---

### 2.18. Desain Filter Status Utang Vendor (`US-9.24`)
* **Audit Redundansi Opsi Eksisting**:
  Saat ini dropdown filter vendor menampilkan:
  - `Semua Utang Vendor` (value: `'all'`)
  - `Ada Sisa Utang Vendor [Utang]` (value: `'has_debt'`)
  - `Vendor Sudah Lunas` (value: `'settled'`)
  Kata "Semua Utang Vendor" dan "Ada Sisa Utang Vendor" membingungkan karena keduanya menggunakan frasa "Utang Vendor".
* **Solusi Standardisasi**:
  Ubah menjadi 3 opsi yang tegas dan tidak ambigu:
  ```ts
  options={[
    { value: 'all', label: 'Semua Status Vendor' },
    { value: 'has_debt', label: 'Hanya Utang Vendor' },
    { value: 'settled', label: 'Vendor Lunas' },
  ]}
  ```
  - Logic filter:
    * `'all'`: tampilkan semua baris order.
    * `'has_debt'`: `r.sisaPembayaranVendor > 0`
    * `'settled'`: `r.sisaPembayaranVendor === 0 && r.totalBiayaVendor > 0`

---

### 2.19. Arsitektur Fluid Full-Width Layout Container Desktop (`US-9.25`)
* **Akar Masalah**:
  Di `src/app/page.tsx#L612`, kontainer utama dibungkus kelas Tailwind `mx-auto max-w-7xl`. Pada monitor desktop PC beresolusi 1080p, 2K, atau 4K/Ultrawide, dashboard terhimpit di tengah dengan ruang kosong besar di margin kiri dan kanan.
* **Solusi**:
  1. Ganti kontainer `max-w-7xl` menjadi fluid:
     ```tsx
     <div className="w-full max-w-[1920px] mx-auto space-y-6">
     ```
  2. Proteksi Mobile (`/antislop-layoutmobile`):
     - Padding kontainer luar tetap `px-3.5 sm:px-8`.
     - Mobile card view di layar `< 768px` tetap menggunakan lebar penuh kartu (full-width per kartu) tanpa ada margin renggang aneh.
     - Mode desktop memanfaatkan lebar tambahan untuk memperluas kolom tabel transaksi tanpa kompresi visual.

---

### 2.20. Desain Dedicated Page Edit Finansial Order & Detail Termin DP (`US-9.26`)
* **Mengadopsi Standar VisualKainDB (`src/app/finance/edit/[id]/page.tsx`)**:
  - Routing: `/orders/[id]/edit`
  - Struktur Halaman Mandiri:
    1. **Top Header Bar**: Tombol Kembali ke Master Finansial (`<Button variant="back">`), Judul Halaman (`Edit Finansial: [NO_INV]`), dan status order.
    2. **Grid 2 Kolom (Desktop) / Vertikal Stack (Mobile)**:
       - **Kolom Kiri**: Data Order (Read-only: Customer, Project, Qty, Bahan, Tgl) + Status Order selector + Form Harga Jual (Pendek, Panjang, T.Lengan, Diskon, Biaya Operasional).
       - **Kolom Kanan**:
         * **Kartu Rincian Termin DP Customer**: Tabel riwayat termin dengan tombol Edit & Hapus, target 70% threshold produksi, dan kalkulator sisa tagihan.
         * **Kartu Biaya & DP Vendor**: Mitra vendor terisi otomatis, harga modal per item, DP vendor nominal/%, dan sisa utang vendor.
    3. **Sticky Action Bar di Bawah**: Tombol Batal dan Tombol Simpan Finansial (`Ctrl+Enter` / Enter support).
    4. **Dirty Form Guard**: Peringatan konfirmasi jika pengguna mencoba menutup atau pindah halaman saat formulir belum disimpan.

---

### 2.21. Kamus Standarisasi Istilah Copywriting Bahasa Indonesia Formal Akuntansi Konveksi (`US-9.27`)
* **Kamus Padanan Istilah Antarmuka**:
  | Istilah Lama / Campuran | Istilah Standar Baru (Bahasa Indonesia Baku) | Konteks Penggunaan |
  |---|---|---|
  | `Financial Dashboard` | **Ringkasan Finansial** | Tab menu sidebar & judul halaman utama |
  | `Cash Inflow` | **Arus Kas Masuk (Penerimaan Kas)** | Tab menu & laporan penerimaan |
  | `Cash Outflow` | **Arus Kas Keluar (Pengeluaran Kas)** | Tab menu & laporan beban kas |
  | `Vendor Performance` | **Kinerja Mitra Vendor** | Tab analisis vendor & efisiensi |
  | `Escrow Liquidity Bar` | *(Dihapus Total)* | Dashboard likuiditas |
  | `Donut Escrow` | **Komparasi Kas Masuk vs Kas Keluar** | Visualisasi analitik |
  | `Gross Jual` | **Nilai Tagihan Kotor (Subtotal)** | Form invoice & rincian order |
  | `OpEx` | **Biaya Operasional** | Beban tambahan pesanan |
  | `Outstanding Customer` | **Sisa Piutang Pelanggan** | Tagihan konsumen belum terbayar |
  | `Vendor Debt` | **Sisa Utang ke Vendor** | Kewajiban pokok vendor belum lunas |
  | `Real Revenue / Omzet` | **Estimasi Omzet** | Total nilai penjualan pesanan |
  | `Net Margin / Net Profit` | **Laba Bersih** | Keuntungan setelah HPP & operasional |

---

### 2.22. Mesin Ekspor Excel Berbasis ExcelJS Standar Inzta (`US-9.28`)
* **Arsitektur Ekspor**:
  Menggantikan `XLSX.utils.json_to_sheet` dengan generator berkas `ExcelJS` yang diadaptasi langsung dari implementasi `inztamoto-erp-dashboard`:
* **Spesifikasi Format Tabel**:
  1. **Metadata Header (Baris 1-6)**:
     - `A1`: `"LAPORAN KEUANGAN & MASTER FINANSIAL VISUALKAIN"` (Font Arial 14 Bold, Warna Dark Slate `#1E293B`).
     - `A3`: `"Periode Laporan"` | `B3`: `": [Periode Aktif]"`
     - `A4`: `"Tanggal Ekspor"` | `B4`: `": [Tanggal Hari Ini]"`
     - `A5`: `"Total Data"` | `B5`: `": [Jumlah Baris] Order"`
  2. **Ringkasan KPI (Baris 8-10)**:
     - Header ringkasan dengan fill `#E0E0E0` dan border tipis: Total Transaksi, Total Qty, Total Omzet, Total Laba Bersih.
     - Nilai ringkasan diformat `"Rp" #,##0` tebal.
  3. **Tabel Data Utama (Mulai Baris 12)**:
     - **Header Row**: Fill `#0F766E` (VisualKain Dark Teal), Font Arial 10 Bold Putih (`#FFFFFF`), Tinggi Baris 26 pt, Alignment Center Vertikal/Horizontal, Border tipis.
     - **Data Rows**:
       * No Inv, Tanggal, Status: Center.
       * Customer, Project, Vendor: Left.
       * Total Qty: Center (`#,##0`).
       * Omzet, HPP, Biaya Ops, DP, Sisa Pelunasan, Laba Bersih: Right (`"\"Rp\" #,##0"`).
       * Margin %: Center (`0.0%`).
       * Border tipis pada semua cell.
  4. **Dynamic Column Width**:
     - Auto-calculate panjang string terpanjang tiap kolom + 4 padding karakter (minimum width 12, maksimum 40).
  5. **Total Row di Bawah**:
     - Font tebal, border atas tipis, border bawah ganda (`double`), nilai sum akumulatif.

---

### 2.23. Arsitektur Pemisahan Master Data Table ke Tab Dedicated "Data Table" (`US-9.29`)
* **Akar Masalah (Analisis Tangkapan Layar Pengguna)**:
  Pada gambar tangkapan layar `media_1791818457952_11468b4f.png`, komponen `MasterFinanceTable` (kartu order & tabel data) diletakkan di bawah 6 KPI card dan 2 grafik besar pada tab `Dashboard`. Pengguna di perangkat mobile harus melakukan scroll vertikal yang sangat panjang (sekitar 1500–2000px) hanya untuk melihat atau mengedit pesanan.
* **Solusi Arsitektural**:
  1. **Ekspansi Kontrak Tipe Tab (`src/types/index.ts`)**:
     ```ts
     export type FinanceSubTab = 'dashboard' | 'datatable' | 'cashin' | 'cashout' | 'vendor' | 'manual';
     ```
  2. **Mobile Bottom Navigation Bar (`MobileBottomNav.tsx`)**:
     - Tambahkan tab ke-5 `"Data Table"` dengan ikon `Table2` (atau `FileSpreadsheet`):
       * `dashboard`: "Dashboard" (`LayoutDashboard`)
       * `datatable`: "Data Table" (`Table2`)
       * `cashin`: "Dana Masuk" (`Coins`)
       * `cashout`: "Dana Keluar" (`WalletCards`)
       * `vendor`: "Mitra Vendor" (`Award`)
     - Tata letak 5 tab di mobile: lebar tiap item 20%, touch target $\ge 48\text{ px}$, label font `text-[10px]` rapi tanpa wrap.
  3. **Sidebar Desktop (`Sidebar.tsx`)**:
     - Tambahkan item menu `"Data Table"` (Master Data Finansial Order) di antara Ringkasan Finansial dan Arus Kas Masuk.
  4. **Pemisahan Render di `src/app/page.tsx`**:
     - `tab === 'dashboard'`: Menampilkan Banner Defisit (jika ada), Banner Periode, `<FinanceStatsGrid />`, `<AnalyticsCharts />`, dan tombol pintasan *"Buka Master Data Order (Data Table) →"*.
     - `tab === 'datatable'`: Menampilkan `<MasterFinanceTable rows={masterRows} ... />` langsung di bagian paling atas viewport (pencarian, filter status DP, filter vendor, tampilan kartu & tabel).

---

## 3. Component Modification Inventory

| File | Tipe Perubahan | Deskripsi |
|---|---|---|
| `src/types/index.ts` | Type Definition (`US-9.29`) | Tambahkan `'datatable'` ke dalam union type `FinanceSubTab`. |
| `src/components/layout/MobileBottomNav.tsx` | UI & Navigation (`US-9.29`) | Tambahkan tab ke-5 `"Data Table"` di navigasi bawah mobile (5 tab layout). |
| `src/components/layout/Sidebar.tsx` | UI & Navigation (`US-9.12, 9.27, 9.29`) | Hapus seluruh badge navigasi, ubah nama tab ke Bahasa Indonesia Baku, tambahkan tab `"Data Table"`. |
| `src/app/page.tsx` | Layout & UI (`US-9.23, 9.25, 9.27, 9.28, 9.29`) | Pindahkan `MasterFinanceTable` ke `tab === 'datatable'`, hapus `EscrowLiquidityBar`, fluid full-width desktop `max-w-[1920px]`, integrasi `ExcelJS`. |
| `src/components/finance/MasterFinanceTable.tsx` | Filter & UI (`US-9.14, 9.24, 9.27`) | Simplifikasi 3 filter vendor, copywriting bahasa Indonesia formal, WA adaptif, solid sticky header. |
| `src/app/orders/[id]/edit/page.tsx` | Dedicated Page (`US-9.8, 9.16, 9.26`) | Dedicated Page edit finansial order mandiri lengkap dengan riwayat termin DP, threshold 70%, vendor pre-population. |
| `src/components/finance/EscrowLiquidityBar.tsx` | Deprecated / Dihapus (`US-9.23`) | Komponen dieliminasi total dari tampilan dashboard. |
| `src/components/analytics/AnalyticsCharts.tsx` | Chart & Copy (`US-9.13, 9.22, 9.27`) | Ganti Donut Escrow dengan Komparasi Kas Masuk vs Keluar, format tanggal `15 Sep`, copywriting formal. |
| `src/components/finance/CashInflowSection.tsx` | Chart & Copy (`US-9.20, 9.21, 9.27`) | Komposisi termin pembayaran (DP 1, 70% Produksi, 30% Pelunasan), sinkronisasi filter, copywriting formal. |
| `src/components/finance/CashOutflowSection.tsx` | Filter & Copy (`US-9.21, 9.22, 9.27`) | Filter `tipe === 'keluar'`, format `15 Sep`, copywriting formal. |
| `src/components/analytics/MetricDetailDrawer.tsx` | UI & Search (`US-9.11, 9.21, 9.27`) | Hubungkan live search saldo kas, metadata 2-kolom mobile, eksklusi profit aktual, copywriting formal. |
| `src/lib/excel-export.ts` (Baru) | Export Engine (`US-9.28`) | Modul generator ekspor spreadsheet profesional berbasis `ExcelJS` standar Inzta. |
| `src/app/globals.css` | Print Engine (`US-9.17, 9.19`) | `print-color-adjust: exact`, border hitam tabel cetak, `display: none` background, single-page fit. |
| `src/components/finance/InvoicePreviewModal.tsx` | Print & Export (`US-9.18, 9.19`) | Dinamisasi `document.title` untuk nama PDF kontekstual dan integrasi print single-page container. |
| `src/hooks/useFirebaseFinance.ts` | Data Layer (`US-9.7, 9.15, 9.26`) | Sinkronisasi dua arah `riwayatPembayaran`, recalculate total uang masuk, dan agregasi vendor lengkap. |
| `src/lib/utils.ts` | Helper Date & Format (`US-9.22, 9.27`) | Helper `formatDateTick` (`15 Sep`) dan format penamaan bahasa Indonesia formal. |





