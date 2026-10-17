# Design — F-13: Merger VisualKainDB ke Financial Analytics

## 1. Arsitektur halaman

Modul finansial lama tetap di `/` dengan `?tab=` (tidak diubah). Modul baru memakai route App Router terpisah yang dibungkus `AppShell` (sidebar desktop, bottom nav HP, header halaman).

| Route | Isi | Fase |
|---|---|---|
| `/data-customer` | Daftar Data Customer | 1 |
| `/data-customer/new` | Form order baru | 1 |
| `/data-customer/[id]` | Detail order | 1 |
| `/data-customer/[id]/edit` | Form edit order | 1 |
| `/data-customer/[id]/techpack` | Techpack (3 kertas) | 1 |
| `/invoice` (`?order=`) | Invoice | 1 |
| `/size-chart` | Size Chart | 1 |
| `/kerjasama`, `/kerjasama/new`, `/kerjasama/[id]` | Daftar dan editor surat kerjasama | 2 |
| `/penawaran`, `/penawaran/new`, `/penawaran/[id]` | Daftar dan editor penawaran | 2 |
| `/purchase-order` (`?order=`) | Purchase Order | 2 |
| `/api/upload` | Unggah gambar ACC ke Cloudinary (butuh token login) | 1 |

Navigasi didefinisikan sekali di `src/lib/navigation.ts` dan dipakai `Sidebar` serta `MobileBottomNav`. Item finansial menaut ke `/?tab=…`; item aktif ditentukan dari `pathname` dan query `tab`.

## 2. Data

### 2.1 Hook
- `useOrdersMaster()` — `onSnapshot` seluruh koleksi `orders` tanpa cutoff, menyimpan dokumen mentah (`LegacyOrder`) supaya form dan kertas legacy membaca field asli. Cutoff Oktober dan arsip diterapkan di UI.
- `useSizeCharts()`, `useKategori()`, `useVendorsMaster()` — `onSnapshot` koleksi `sizecharts`, `cp_kategori`, `vendors`.
- `useFirebaseFinance()` tetap untuk modul finansial. Derivasi pembayaran customer dan vendor dipindah ke `src/lib/order-payments.ts` (tanpa perubahan perilaku) supaya invoice, detail order, dan guard hapus memakai fungsi yang sama.

### 2.2 Bentuk dokumen `orders` (kompatibel `visualkaindb`)
Field yang ditulis form Data Customer:
`tanggalInv, noInv, namaCustomer, noWaCustomer, namaProject, jenisMetodeProduksi, kategoriOrder, jenisBahan, warna, deadline, notes, accCustUrl|null, sizeChartId, prodDetail1..4, hargaPendek, hargaPanjang, hargaTanpaLengan, hargaTigaPerempat, diskonHarga, hargaVendorPendek, hargaVendorPanjang, hargaVendorTanpaLengan, hargaVendorTigaPerempat, vendorId, status`, qty `{pendek|panjang|tanpaLengan|tigaPerempat}{XS..5XL}`, `updatedAt`.

Hanya saat dibuat: `createdAt, createdBy, createdByEmail, dpPersen: 70, dpNominal: 0, dpPersenPO: 0, dpNominalPO: 0, biayaOperasional: 0, pembayaranList: []` (K-16).

Bila `isManualFinanceOverride === true` dan qty/harga/diskon berubah, tulis juga `grossTotal`, `totalInvoice`, `jumlahSemua`, `totalHpp`, `totalBiayaVendor`, `hppAktual` (lihat 3.3).

### 2.3 Koleksi baru (Fase 2)
- `document_counters/{PREFIX-YYYY}` → `{ prefix, year, last, updatedAt }`.
- `kerjasama/{id}` → `{ noSurat, tahun, urut, tanggal, lampiran, perihal, kepadaNama, kepadaJabatan, kepadaAlamat, kepadaTempat, paragrafPembuka, paragrafProfil, paragrafKeunggulan, paragrafPenutup, createdAt, createdBy, updatedAt }`.
- `penawaran/{id}` → `{ noPenawaran, tahun, urut, tanggal, perihal, namaPerusahaan, contactPerson, alamat, telepon, items[{desc, qty, satuan, harga, jumlah}], catatan, createdAt, createdBy, updatedAt }`.

Rules Firestore saat ini mengizinkan baca/tulis semua koleksi untuk user login (audit F-12), jadi tidak perlu perubahan rules.

### 2.4 Tracking publik
`tracking/{noInv}` disinkronkan saat tambah/edit (merge). Riwayat status diambil dari dokumen tracking yang ada lalu ditambah entri baru bila status berubah (memperbaiki bug riwayat yang selalu ter-reset). Total pcs memasukkan 3/4.

## 3. Rumus

### 3.1 Legacy (disalin dari `visualkaindb/src/lib/calculations.ts`)
- `CATEGORIES = ['pendek','panjang','tanpaLengan','tigaPerempat']`, `SIZES = XS..5XL`, tambahan ukuran besar sama untuk semua kategori.
- `calculateTotals`: `jual = Σ qty × (harga + extra)`, `modal = Σ qty × (hargaVendor + extra)`, `jumlahSemua = jual − diskonHarga`, `nominalDP = round(net × dp%)`, `sisa = net − nominalDP`, `profit = net − modal − biayaOperasional`.
- `getInvoiceItems`: satu baris per kategori × ukuran dengan qty > 0; label `"{kategoriOrder} {Pendek|Panjang|Tanpa Lengan|3/4 Tangan} ({size})"`.
- Order lama tanpa field 3/4 menghasilkan angka yang sama persis seperti sebelumnya (dibuktikan test pembanding).

### 3.2 Modul finansial
`calculateOrderTotals` (aplikasi ini) ikut memakai kategori `tigaPerempat` lewat konstanta `CATEGORIES`. Rumus lain tidak berubah.

### 3.3 Sinkron override finansial
Untuk order `isManualFinanceOverride`:
- `gross = calculateTotals(form).grossTotal`
- `biayaTambahanCustomer`, `biayaTambahanVendor` dari dokumen tersimpan
- `net = computeEditableNet(gross, diskonHarga, biayaTambahanCustomer)`
- `hpp = modal(form) + biayaTambahanVendor`
- tulis `grossTotal = gross`, `totalInvoice = jumlahSemua = net`, `totalHpp = totalBiayaVendor = hppAktual = hpp`, `diskon = diskonHarga`.

### 3.4 Pembayaran di invoice
`deriveOrderPayments(id, doc)` mengembalikan pembayaran customer persis seperti `useFirebaseFinance`. Untuk kertas:
- `pelunasan = Σ nominal jenis 'pelunasan'`; `dps` = sisanya sesuai urutan.
- `dp1 = dps[0]`, `dp2 = Σ dps[1..]`, `totalDp = dp1 + dp2`, `totalUangMasuk = totalDp + pelunasan`.
- Badge dan kotak sisa memakai rumus `InvoicePreview` asli dengan nilai di atas.
- Baris: DP ke-1 "DP 1 Diterima", ke-2 "DP 2 Diterima", berikutnya `"{label} Diterima"`, pelunasan "Pelunasan Diterima"; tanggal ditampilkan `formatDate` id-ID panjang.

### 3.5 Guard hapus
Diblokir bila `Σ deriveOrderPayments > 0` atau pembayaran vendor (`deriveOrderVendorPaid`) > 0.

## 4. Kertas legacy

- Komponen kertas disalin ke `src/components/legacy/` dengan markup dan inline style apa adanya; perubahan hanya pada import dan sumber data (3.4) serta grup 3/4.
- CSS kertas dihasilkan otomatis dari `visualkaindb/src/app/globals.css` ke `src/styles/legacy-papers.css`: hanya aturan yang menyentuh kelas/ID kertas, semua selector diberi prefix `.vk-legacy`, `:root/html/body` dipetakan ke `.vk-legacy`, media `max-width` (skala HP lama) dibuang, media `print` dipertahankan.
- `src/styles/legacy-base.css` memulihkan default browser yang direset Tailwind preflight di dalam `.vk-legacy` (ukuran h1–h6, bullet list, gambar inline, tabel `border-collapse: separate`) dan membatasi bobot 800 ke 700 karena `visualkaindb` hanya memuat Open Sans 300–700.
- Aturan kertas lama di `globals.css` aplikasi ini (dipakai `FinanceReportPaper`) diberi `:not(:where(.vk-legacy *))` supaya tidak bocor ke kertas legacy.
- Pratinjau layar: `PaperViewport` merender kertas pada lebar A4 asli lalu memakai CSS `zoom` agar muat lebar kontainer (HP).
- Cetak: `PrintPortal` merender salinan kertas ke `document.body` (di luar `main`, yang disembunyikan CSS print aplikasi ini) dan menyuntikkan `@page { size: A4 portrait; margin: 18mm 15mm }` milik `visualkaindb` selama halaman terbuka.

## 5. UI dan responsif

- Semua layar memakai primitive yang ada: `Card`, `Button`, `Badge`, `CustomSelect`, `EmptyState`, `Shimmer`, dialog Radix, `sonner`.
- Breakpoint: HP < 768 px (kartu, bottom nav, sheet), tablet 768–1023 px (sidebar ringkas), desktop ≥ 1024 px, monitor besar ≥ 1920 px (konten `max-w-[1920px]`).
- Tabel desktop: header lengket, NO INV lengket kiri, STATUS dan AKSI lengket kanan, kolom teks `whitespace-normal break-words` dengan lebar tetap, angka `tabular-nums whitespace-nowrap`.
- HP: kartu dengan teks `truncate`, target sentuh ≥ 44 px, aksi utama di bawah kartu.
- Warning minus: komponen `NegativeAwareValue` (sel) dan kelas strip baris `shadow-[inset_3px_0_0_0_#e11d48]`.

## 6. Kompatibilitas `visualkaindb`

- Patch kecil di `visualkaindb`: tambah `tigaPerempat` ke `CATEGORIES`, label, dan kunci harga di `calculations.ts`, serta hitung pcs tracking, supaya total order yang memakai 3/4 sama di kedua aplikasi. Tidak ada perubahan data.
- Field DP lama tetap ditulis bernilai aman untuk order baru (2.2), sehingga tabel `visualkaindb` tetap terbaca.

## 7. Keamanan
- `/api/upload` memverifikasi Firebase ID token lewat endpoint `accounts:lookup` (kunci API publik) sebelum mengunggah; ukuran ≤ 5 MB dan tipe `image/*`.
- Unggah memakai Cloudinary signed upload via REST dengan `crypto` Node (tanpa dependensi baru). Env yang dibutuhkan: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

## 8. Pengujian
- Test pembanding rumus legacy: order tanpa 3/4 menghasilkan angka identik dengan rumus asli; order dengan 3/4 menambah sesuai qty × (harga + extra).
- Test `deriveOrderPayments` (hasil sama dengan hook sebelum refactor), mapping baris invoice, guard hapus, generator nomor dokumen dan No. Invoice, sinkron override.
- Test komponen: sel minus, tabel Data Customer (kolom, arsip, filter), ekspor Excel (header dan KPI).
- Verifikasi manual di 360, 768, 1440, 1920 px.
