# Bugfix Requirements — F-10: Audit Codebase & Perbaikan Integritas Data Finansial

## 1. Pendahuluan

Audit menyeluruh pada 13 Oktober 2026 terhadap `main` (sampai commit `8893911`, fitur Edit transaksi Kas Masuk/Keluar) menemukan bug yang **lolos dari seluruh quality gate**: `npm run lint` (tsc) bersih, `npm run test` 50/50 lulus, `npm run build` sukses. Semua defect di bawah ini adalah bug logika/runtime yang tidak tertangkap test, bukan error kompilasi.

Metode: tiga reviewer read-only menelusuri seluruh `src/` per area (data layer, dashboard dan filter, form dan ledger), lalu setiap temuan prioritas tinggi diverifikasi ulang langsung di kode. Sebagian dibuktikan dengan skrip repro di luar repo. Aplikasi belum dijalankan di browser karena login memakai akun dan data produksi, sehingga smoke test manual menjadi bagian gate (Task 30).

Konsep bisnis yang dijaga (dari Phase 8 F-09, US-9.35 s.d. US-9.39):
- Termin pembayaran customer **tidak dibatasi** (DP 1, DP 2, …, DP N). Nomor urut otomatis, label bebas dengan saran, target 70% hanya indikator SOP produksi, bukan batas jumlah termin.
- Sisa tagihan customer = Net Invoice − total termin tercatat. Pembayaran tidak boleh melebihi sisa.
- Pembayaran vendor selalu terikat ke satu pesanan dan memakai pola ledger yang sama.
- Pembukuan dimulai 1 Oktober 2026 (`FINANCE_START_DATE`). Data sebelum tanggal itu tidak dihitung.

Tingkat keparahan: **P0** merusak atau memalsukan data finansial, **P1** angka atau filter menyesatkan, **P2** UX/minor, **P3** kebersihan kode.

---

## 2. Keputusan Desain (hasil sesi grilling 13 Okt 2026)

| ID | Keputusan |
|---|---|
| K-1 | Metrik **kas** Dashboard (Dana Masuk, Dana Keluar, tren) memakai **cash basis**: dihitung berdasarkan tanggal pembayaran, sama dengan tab Kas Masuk/Keluar. Metrik **omzet/laba** tetap berbasis tanggal order. |
| K-2 | **Saldo Kas** = akumulasi seluruh arus kas sejak 1 Okt 2026 sampai akhir periode terpilih. Kartu Dana Masuk/Keluar tetap menampilkan angka periode saja. Saldo bank riil per 1 Okt diinput sekali sebagai kas masuk kategori `Saldo Awal`. Data sebelum 1 Okt tidak pernah dihitung. |
| K-3 | Logika hitung DP **tidak diubah**. Order dari VisualKainDB yang hanya punya `dpNominal`/`dpPersen` tanpa daftar termin diberi **penanda visual** "DP belum dirinci per termin". Arti bisnis `dpNominal` dari VisualKainDB dikonfirmasi ke klien (lihat Bagian 5). |
| K-4 | Saat Firestore masih menghubungkan atau gagal: skeleton → empty state → banner error dengan tombol "Coba lagi". Seed data **tidak** lagi menjadi state awal dan tidak ter-bundle ke client. |
| K-5 | "Lunas" = `sisaPiutangCustomer ≤ 0` saja. Perubahan hanya mempengaruhi **jumlah order** pada subtitle. Semua total Rupiah WAJIB identik sebelum dan sesudah perubahan. |
| K-6 | Field "DP Diserahkan ke Vendor" di `/orders/[id]/edit` menjadi read-only, diturunkan dari `vendorPembayaranList`, dengan tautan ke `/cash-out/new`. |
| K-7 | Security (allowlist/role user, fallback config Firebase produksi, `firestore.rules`) **di luar scope**. Dibuat spec terpisah F-11. |
| K-8 | Cleanup dead code dan dependency tak terpakai masuk batch terakhir (P3) setelah semua fix hijau. |
| K-10 | Pembayaran bertanggal ≥ 1 Okt untuk order bertanggal < 1 Okt **tetap tidak dihitung**, sesuai kesepakatan cutoff berbasis order. Batasan ini didokumentasikan. |

---

## 3. Root Cause Analysis

1. **Error Firestore ditelan (optimistic tanpa rollback).** `updateOrderFinance`, `updateKas` me-`return true` di blok `catch`. `addKas` menyisipkan transaksi `kas-local-*` ke state. `deleteKas` hanya me-log. Halaman pemanggil menampilkan `toast.success` tanpa memeriksa hasil. Snapshot berikutnya diam-diam mengembalikan data server, sehingga perubahan hilang padahal user sudah melihat konfirmasi sukses. (`useFirebaseFinance.ts:388`, `:421`, `:497`, `:509`)
2. **Inisialisasi form terikat ke identitas objek, bukan ke ID order.** Listener `onSnapshot` me-map ulang semua dokumen menjadi objek baru setiap ada perubahan di koleksi `orders`. Efek `useEffect(…, [currentOrder])` di halaman edit dan `[selectedOrder]` di `/cash-in/new` / `/cash-out/new` berjalan ulang dan me-reset state form serta `isDirty`. (`orders/[id]/edit/page.tsx:69`, `cash-in/new/page.tsx:117`, `cash-out/new/page.tsx:159`)
3. **Rumus net berbeda antara writer dan reader.** Halaman edit menghitung `net = gross − diskon`, sedangkan `calculateOrderTotals` memakai `gross − diskon + biayaTambahanCust`. Saat disimpan dengan `isManualFinanceOverride: true`, nilai `totalInvoice` yang lebih kecil dikunci permanen. (`edit/page.tsx:72-76`, `calculations.ts:187`)
4. **Data contoh dipakai sebagai default nilai produksi.** Hook memulai state dari `initialOrdersData`/`initialCashTransactions` (lolos filter cutoff karena bertanggal Okt 2026). Komponen memakai default parameter hardcoded (`defaultTrendData`, `mostUsedVendor = AMRIN`, `defaultCheapest`, `tanpaOrder`) yang aktif saat parent mengirim `undefined` untuk data kosong. Nomor WA `08123456789` dipakai sebagai fallback. (`useFirebaseFinance.ts:49`, `AnalyticsCharts.tsx:57`, `VendorPerformanceSection.tsx:168-174`, `MetricDetailDrawer.tsx:424`, `OrderInspectionDrawer.tsx:43`)
5. **Efek auto-open edit tidak idempoten (commit `8893911`).** Efek `initialEditId` di `PaymentLedgerPanel` berjalan setiap `entries` berubah. `resetForm()` mengembalikan `userTouchedDraft` ke `false`, jadi setelah Simpan baris, Batal, atau Hapus, form edit terbuka lagi. Setelah baris target dihapus, `findTargetEditRow` jatuh ke heuristik indeks (`-(\d+)$`, `rows[n]`/`rows[n-1]`, `rows[0]`) dan membuka **baris lain**.
6. **Dua definisi periode untuk metrik kas.** `calculateFinancialSummary` menerima order yang difilter berdasarkan `tanggalOrder` lalu menjumlahkan seluruh `totalUangMasukCustomer`/`totalDibayarKeVendor`. Tab Kas dan chart tren memfilter per tanggal pembayaran. `saldoAwal` di-hardcode `0`. (`page.tsx:80`, `:124-146`, `financial-calculator.ts:253-331`)
7. **Label termin dipersist.** Panel mengirim label hasil saran ("DP 2") sebagai `label`, dan hook mengisi fallback `Termin N`. `normalizeLedger` memperlakukan label yang tersimpan sebagai label kustom, sehingga setelah baris dihapus urutan nomor dan label tidak lagi cocok. (`payment-ledger.ts:71-75`, `useFirebaseFinance.ts:377`)

---

## 4. Defect Inventory & Expected Behavior

### Batch A — Integritas Data (P0)

* 1.1 **WHEN** penulisan Firestore gagal (permission denied, offline, token kedaluwarsa) pada simpan order, tambah/edit/hapus kas, **THEN** UI menampilkan toast sukses, state lokal berubah, lalu data kembali seperti semula tanpa pemberitahuan. `addKas` menambah transaksi `kas-local-*` yang ikut dihitung di saldo.
  * 2.1 **WHEN** penulisan Firestore gagal, **THEN** fungsi mutasi SHALL melempar error atau mengembalikan `false`, state optimistik SHALL di-rollback, tidak ada ID `kas-local-*` yang dibuat, dan halaman SHALL menampilkan `toast.error` serta tetap di halaman dengan input utuh.
* 1.2 **WHEN** user sedang mengisi `/orders/[id]/edit`, `/cash-in/new`, atau `/cash-out/new` (mode pesanan) dan ada dokumen order mana pun yang berubah di Firestore, **THEN** form dan ledger draft ter-reset serta badge "Belum Disimpan" hilang.
  * 2.2 **WHEN** snapshot order baru tiba, **THEN** form SHALL diinisialisasi **sekali per ID order** dan SHALL NOT menimpa input selama `isDirty === true`.
* 1.3 **WHEN** order memiliki `biayaTambahanCustomer > 0` dan disimpan dari halaman edit, **THEN** `totalInvoice` tersimpan berkurang sebesar biaya tambahan dan dikunci oleh `isManualFinanceOverride`.
  * 2.3 **WHEN** halaman edit menghitung dan menyimpan net invoice, **THEN** nilai SHALL sama dengan `calculateOrderTotals(order).netTotal` untuk input yang tidak diubah (`gross − diskon + biayaTambahanCustomer`).
* 1.4 **WHEN** Firestore masih menghubungkan, gagal, atau koleksi `kas` kosong, **THEN** dashboard menampilkan seed data (nama customer, nomor WA, nominal riil) sebagai data live. Seed ikut ter-bundle ke client JS.
  * 2.4 **WHEN** data belum tersedia, **THEN** hook SHALL memulai dengan array kosong dan state `connecting`. Saat live tapi kosong, hook SHALL mengembalikan array kosong (snapshot kosong mengosongkan state). Saat gagal, `syncState` SHALL menjadi `error` untuk ketiga listener. Modul `seed-data.ts` SHALL hanya diimpor oleh file test.
* 1.5 **WHEN** order tidak memiliki `noWaCustomer` dan user menekan "WA Tagih" di drawer metrik atau drawer inspeksi, **THEN** WhatsApp dibuka ke `628123456789` berisi detail tagihan customer.
  * 2.5 **WHEN** nomor WA kosong, **THEN** tombol kirim SHALL nonaktif dengan keterangan "Nomor WA belum diisi". Input nomor SHALL dimulai kosong. Normalisasi SHALL mengubah `0…`, `+62…`, `62…`, dan `8…` menjadi `62…`.
* 1.6 **WHEN** order tanpa vendor, atau dengan vendor yang tidak ada di koleksi `vendors`, disimpan dari halaman edit, **THEN** `vendorId` diisi string nama (misalnya `'Tanpa Vendor'`) atau tetap memakai ID vendor lama, sehingga muncul vendor hantu atau nama kembali ke vendor lama.
  * 2.6 **WHEN** menyimpan vendor, **THEN** `vendorId` SHALL diisi hanya jika nama cocok dengan dokumen `vendors`. Jika tidak cocok, `vendorId` SHALL dikosongkan dan `vendorName` disimpan apa adanya. Nama placeholder (`'Tanpa Vendor'`, `'Vendor Mitra'`) SHALL NOT disimpan sebagai nama maupun ID.

### Batch B — Ledger Termin & Fitur Edit Transaksi (P0/P1, commit `572bd33` & `8893911`)

* 1.7 **WHEN** user membuka Edit dari tabel Kas Masuk/Keluar lalu menyimpan baris, menekan Batal, atau menghapus baris di panel, **THEN** form edit terbuka kembali secara otomatis, dan user tidak bisa keluar dari mode edit untuk menambah termin baru.
  * 2.7 **WHEN** `initialEditId` diberikan, **THEN** panel SHALL membuka form edit **paling banyak sekali** per nilai `initialEditId`.
* 1.8 **WHEN** ID entry dari tabel tidak cocok persis dengan baris ledger (baris sudah dihapus/diubah di sesi lain, atau ID turunan), **THEN** `findTargetEditRow` memilih baris berdasarkan angka di akhir ID atau baris pertama, dan user mengedit **termin yang salah**.
  * 2.8 **WHEN** mencari target edit, **THEN** panel SHALL hanya menerima kecocokan ID persis atau alias deterministik yang terdokumentasi (`pay-{orderId}-single` ↔ `pay-{orderId}-init`, `vp-{orderId}` / `vp-rem-{orderId}` ↔ `vp-{orderId}-init`). Jika tidak ada yang cocok, panel SHALL menampilkan info "Transaksi tidak ditemukan, mungkin sudah diubah" dan SHALL NOT membuka baris lain.
* 1.9 **WHEN** user menekan Enter di input ledger (nominal, label, catatan) pada `/cash-in/new` atau `/cash-out/new`, **THEN** seluruh `<form>` halaman ter-submit, order tersimpan, dan halaman berpindah ke dashboard.
  * 2.9 **WHEN** Enter ditekan di input panel ledger, **THEN** sistem SHALL menjalankan aksi "Tambahkan/Simpan baris" panel (jika valid) dan SHALL NOT men-submit form halaman.
* 1.10 **WHEN** sebuah termin dihapus atau tanggalnya dimundurkan, **THEN** label lama tetap tersimpan (misalnya baris pertama berlabel "DP 2", atau "Pelunasan" tetap muncul padahal belum lunas). Hook juga menyimpan fallback `Termin N` yang bertentangan dengan saran `DP N`.
  * 2.10 **WHEN** label baris sama dengan label saran otomatis, **THEN** label SHALL NOT dipersist sebagai label kustom (disimpan kosong atau ditandai otomatis) dan SHALL dihitung ulang oleh `normalizeLedger`. Label yang diketik user (berbeda dari saran) SHALL tetap dipertahankan.
* 1.11 **WHEN** halaman dibuka dengan `?orderId=…`, **THEN** user tidak bisa mengosongkan atau mengganti pilihan pesanan karena efek memaksa nilai kembali ke parameter URL.
  * 2.11 **WHEN** parameter `orderId` ada, **THEN** nilai SHALL dipakai hanya sebagai nilai awal. Perubahan pilihan oleh user SHALL dihormati.
* 1.12 **WHEN** `/cash-in/new?editKasId=…` atau `/cash-out/new?editKasId=…` dibuka tetapi transaksi belum dimuat, tidak ditemukan, atau bertanggal sebelum cutoff, **THEN** form tampil dengan nilai default, dan "Simpan Perubahan" menimpa dokumen kas dengan nilai default tersebut.
  * 2.12 **WHEN** mode edit kas aktif, **THEN** form SHALL menampilkan state memuat sampai transaksi ditemukan, dan SHALL menampilkan "Transaksi tidak ditemukan" serta menonaktifkan Simpan bila tidak ditemukan setelah data live.

### Batch C — Dashboard, Periode & Filter (P1)

* 1.13 **WHEN** periode terpilih tidak memiliki data (misalnya Januari), **THEN** chart "Tren Arus Kas Riil" menampilkan data demo "1–7 Okt", kartu vendor menampilkan "AMRIN, 11 Order • 462 Pcs", dan daftar termurah serta "tanpa order" berisi data contoh.
  * 2.13 **WHEN** data periode kosong, **THEN** setiap komponen SHALL menampilkan empty state. Parent SHALL mengirim array kosong, bukan `undefined`. Default parameter berisi data contoh SHALL dihapus.
* 1.14 **WHEN** order bertanggal 20 Okt dibayar 30 jt pada 20 Okt dan 40 jt pada 5 Nov, **THEN** filter Oktober menampilkan Dana Masuk 70 jt di Dashboard tetapi 30 jt di tab Kas Masuk dan di chart tren. Filter November menampilkan 0 di Dashboard tetapi 40 jt di tab Kas Masuk.
  * 2.14 **WHEN** filter periode aktif, **THEN** Dana Masuk, Dana Keluar, chart tren, drawer saldo, dan tab Kas SHALL dihitung dari satu sumber entri kas (pembayaran customer, pembayaran vendor, biaya operasional order, transaksi `kas`) yang difilter berdasarkan tanggal entri (K-1).
* 1.15 **WHEN** filter bulan selain "Semua Bulan" dipilih, **THEN** "Dana Tersedia (Saldo Kas)" hanya berisi net periode itu dengan saldo awal 0, dan transaksi `Saldo Awal` bertanggal Oktober hilang dari tampilan November.
  * 2.15 **WHEN** periode dipilih, **THEN** Saldo Kas SHALL = Σ masuk − Σ keluar untuk seluruh entri kas bertanggal `FINANCE_START_DATE` s.d. akhir periode. Drawer saldo SHALL menampilkan "Saldo awal periode" (akumulasi sebelum awal periode, sejak 1 Okt) + masuk periode − keluar periode (K-2).
* 1.16 **WHEN** user berada di halaman 2/3 Data Table lalu mengklik baris, menutup drawer, menekan Ctrl+B, atau ada snapshot masuk, **THEN** tabel kembali ke halaman 1.
  * 2.16 **WHEN** parent re-render tanpa perubahan data atau filter, **THEN** halaman aktif SHALL dipertahankan (`masterRows` di-memo berdasarkan `filteredOrders`).
* 1.17 **WHEN** order berstatus `completed` baru dibayar sebagian, **THEN** order dihitung sekaligus "lunas" (subtitle omzet) dan "belum lunas" (kartu piutang).
  * 2.17 **WHEN** menghitung jumlah order lunas/berjalan, **THEN** sistem SHALL memakai `sisaPiutangCustomer ≤ 0` saja (K-5).
* 1.18 **WHEN** user membuat kas keluar kategori `Keuangan`, `Pajak/Retribusi`, `Logistik`, atau `Marketing`, **THEN** transaksi tersebut tidak bisa ditemukan lewat filter kategori, hanya lewat "Semua Kategori".
  * 2.18 **WHEN** filter kategori Outflow ditampilkan, **THEN** opsi SHALL mencakup seluruh kategori yang bisa dibuat di `/cash-out/new` beserta kategori tambahan yang muncul di data.
* 1.19 **WHEN** user menekan "Hapus" pada transaksi kas keluar manual, **THEN** transaksi langsung terhapus tanpa konfirmasi (satu ketukan di mobile).
  * 2.19 **WHEN** user menghapus transaksi kas (masuk maupun keluar), **THEN** sistem SHALL meminta konfirmasi terlebih dahulu.
* 1.20 **WHEN** Data Table difilter (search, status, utang vendor) lalu "Ekspor Excel" di header ditekan, **THEN** file berisi semua baris periode, bukan baris yang terlihat.
  * 2.20 **WHEN** ekspor dipicu dari tab Data Table, **THEN** isi file SHALL sama dengan baris hasil filter tabel, dan nama file SHALL menyebut filter yang aktif.
* 1.21 **WHEN** tab Kas menawarkan tahun yang berasal dari tanggal pembayaran tetapi tidak ada di opsi header, **THEN** memilih tahun itu membuat select header menampilkan "Pilih...".
  * 2.21 **WHEN** opsi tahun dibangun, **THEN** header dan semua tab SHALL memakai satu fungsi sumber yang mencakup tanggal order, tanggal pembayaran, dan tanggal kas.

### Batch D — Form, Cetak & Minor (P2)

* 1.22 **WHEN** "DP Diserahkan ke Vendor" diubah di halaman edit, **THEN** hanya `totalDibayarKeVendor` yang berubah dan tidak sinkron dengan `vendorPembayaranList`, sehingga muncul baris "DP / Pembayaran" hantu. Tidak ada validasi DP > HPP.
  * 2.22 **WHEN** halaman edit ditampilkan, **THEN** field SHALL read-only, bernilai Σ `vendorPembayaranList`, dengan tautan "Kelola di Dana Keluar" (K-6).
* 1.23 **WHEN** `riwayatPembayaran` berisi entri yang sengaja disaring reader (catatan mengandung "pinjaman") dan order disimpan dari aplikasi ini, **THEN** entri tersebut terhapus dari Firestore. *(likely, perlu cek data)*
  * 2.23 **WHEN** menulis `riwayatPembayaran`, **THEN** entri yang disaring reader SHALL dipertahankan apa adanya.
* 1.24 **WHEN** form kotor lalu user menekan back browser, refresh, atau menutup tab, **THEN** perubahan hilang tanpa peringatan.
  * 2.24 **WHEN** `isDirty === true`, **THEN** halaman SHALL memasang guard `beforeunload`.
* 1.25 **WHEN** laporan cetak `FinanceReportPaper` dibuat untuk order tanpa DP vendor, atau setelah semua termin dihapus, **THEN** muncul karakter `0` nyasar, "DP Konsumen" menampilkan DP rencana dari `dpPersen`, dan label persen memakai `dpPersen` yang basi.
  * 2.25 **WHEN** laporan dicetak, **THEN** baris DP vendor SHALL dirender kondisional dengan ternary. Nominal dan persen DP SHALL berasal dari total termin tercatat (`totalUangMasukCustomer`) dibagi net invoice.
* 1.26 **WHEN** form dibuka antara 00.00–07.00 WIB, **THEN** tanggal default berisi tanggal kemarin (`toISOString` UTC).
  * 2.26 **WHEN** tanggal default dibuat, **THEN** sistem SHALL memakai tanggal lokal `Asia/Jakarta`.
* 1.27 **WHEN** `/orders/[id]/edit` dibuka untuk order sebelum cutoff atau ID yang tidak ada, **THEN** halaman tertahan di "Memuat..." selamanya.
  * 2.27 **WHEN** data sudah live dan order tidak ditemukan, **THEN** halaman SHALL menampilkan state "Pesanan tidak ditemukan atau di luar periode pembukuan" dengan tombol kembali.
* 1.28 **WHEN** `formatCompactRupiah(999_999)` dipanggil, **THEN** hasilnya "Rp 1000 rb". `1_999_999` menghasilkan "Rp 2.0 jt".
  * 2.28 **WHEN** pembulatan melewati ambang satuan, **THEN** formatter SHALL naik ke satuan berikutnya ("Rp 1 jt") dan memakai desimal format `id-ID`.
* 1.29 **WHEN** order VisualKainDB hanya punya `dpNominal`/`dpPersen` tanpa daftar termin, **THEN** sistem menampilkan satu baris "DP Terkunci" sebagai uang diterima tanpa penanda apa pun.
  * 2.29 **WHEN** pembayaran berasal dari fallback legacy (ID `-dp-legacy`, atau baris `pay-*-init`/`vp-*-init` saat uang tercatat tanpa daftar termin; ID `-dp1`/`-dp2`/`-pelunasan` sudah dirinci per termin sehingga tidak ditandai), **THEN** tabel, kartu mobile, dan ledger SHALL menampilkan badge "DP belum dirinci per termin". Logika hitung SHALL NOT berubah (K-3).

### Batch E — Kebersihan Kode & Dokumen (P3)

* 1.30 **WHEN** codebase dibaca, **THEN** terdapat komponen mati (`EditFinanceModal`, `AddIncomeModal`, `EscrowLiquidityBar`, `TransactionLedgerTable`), state mati (`donutData`, `drawerVendorFilter`, drawer tambah di `CashOutflowSection`), dan dependency tak terpakai (`react-hook-form`, `zod`, `@hookform/resolvers`, `cmdk`, `@tanstack/react-virtual`, `date-fns`, `@phosphor-icons/react`, `@radix-ui/react-tabs`, `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`; `xlsx` hanya dipakai `TransactionLedgerTable`).
  * 2.30 **WHEN** cleanup selesai, **THEN** file dan dependency tersebut SHALL dihapus, dengan `npm run build` tetap lulus.
* 1.31 **WHEN** `docs/context/state.yaml` dan `docs/handoff/current.md` dibaca, **THEN** F-08/F-09 tidak tercatat dan handoff masih menyebut F-06. Selain itu `npm run context:validate` gagal dengan 7 error karena link absolut `file:///d:/…` di `.kiro/specs/F-09-client-feedback-refinements/design.md`.
  * 2.31 **WHEN** F-10 selesai, **THEN** `state.yaml` dan handoff SHALL mencerminkan status terkini, dan `npm run context:validate` SHALL lulus (link diubah menjadi relatif).

---

## 5. Perlu Verifikasi Data atau Konfirmasi Klien (tidak diubah di F-10)

- **V-1 Arti `dpNominal` dari VisualKainDB.** `OrderForm` di VisualKainDB mengisi `dpPersen: 70` secara default dan menyimpan `dpNominal = 70% × total`. Perlu dikonfirmasi ke klien: apakah angka itu DP yang **sudah diterima** atau hanya **rencana**? Jika rencana, piutang di aplikasi ini terlalu kecil. Keputusan menyusul, F-10 hanya menambah penanda (1.29).
- **V-2 Potensi double count pembayaran vendor.** Mapping `kas` membuang `orderId`/`refInvoice`, sehingga `isDuplicateOrderVendorTx` hanya mengandalkan heuristik teks. Perlu dicek secara read-only apakah ada dokumen `kas` kategori `Pembayaran Vendor` yang menggandakan `vendorPembayaranList`.
- **V-3 `biayaTambahanCustomer` pada dokumen tanpa rincian ukuran.** Repro menunjukkan VK260039 berpotensi menambah biaya tambahan dua kali di jalur non-override (`calculations.ts:144-156`). Tergantung cara dokumen ditulis.
- **V-4 Order sebelum cutoff dengan pembayaran setelah cutoff (K-10).** Tidak dihitung. Jika klien merasa saldo tidak cocok dengan rekening koran, ini kandidat penyebab pertama.

---

## 6. Preservation & Non-Regression Invariants

* 3.1 **Invariant arus kas:** `saldoKasRiil` SHALL CONTINUE TO memenuhi `saldoAwalPeriode + totalKasMasuk − totalKasKeluar` (AGENTS.md §4.1).
* 3.2 **Alokasi proporsional:** `calculateEscrowAllocation` SHALL CONTINUE TO menghasilkan alokasi vendor = nominal × HPP/Invoice dan margin = nominal × Margin/Invoice. Pembayaran vendor SHALL NOT mengurangi margin (AGENTS.md §4.2).
* 3.3 **Ledger termin fleksibel:** jumlah termin SHALL tetap tanpa batas. Nomor urut berdasarkan tanggal lalu `createdAt`. Guard kelebihan bayar dan isian cepat "Sisa penuh" / "Sisa menuju 70%" SHALL CONTINUE TO berfungsi. Field `jenis` (`dp`/`termin`/`pelunasan`) SHALL tetap diisi untuk kompatibilitas VisualKainDB.
* 3.4 **Ambang 70%** SHALL CONTINUE TO dihitung dari net invoice.
* 3.5 **Total Rupiah tidak berubah akibat K-5:** untuk dataset fixture yang sama, `omzetTotal`, `totalPiutang`, `totalKasMasuk`, `totalKasKeluar`, `saldoKasRiil`, dan `totalProfitRealtime` SHALL identik sebelum dan sesudah perubahan definisi lunas.
* 3.6 **Cutoff:** seluruh data dengan tanggal < `2026-10-01` SHALL CONTINUE TO dikecualikan.
* 3.7 **Sinkron filter:** filter bulan/tahun header ↔ tab Kas Masuk/Keluar SHALL CONTINUE TO sinkron dua arah, termasuk sentinel `'all'`.
* 3.8 **Kompatibilitas field Firestore:** penulisan SHALL CONTINUE TO mengisi `riwayatPembayaran`, `pembayaranList`, `dpNominal`, `totalUangMasukCustomer`, `dpNominalPO`, `totalDibayarKeVendor`, `vendorPembayaranList` dengan nama field yang sama, karena VisualKainDB membaca dokumen yang sama.
* 3.9 **Seluruh 50 test yang ada** SHALL tetap lulus (fixture boleh dipindah, assertion tidak dilemahkan).
* 3.10 **Tidak ada skrip** di `scripts/` yang dijalankan terhadap Firestore produksi selama pengerjaan F-10.

---

## 7. Di Luar Scope

- F-11 Security: allowlist/role pengguna (project Firebase dipakai bersama aplikasi operasional), penghapusan fallback config Firebase produksi di `src/lib/firebase.ts`, dan `firestore.rules` yang tidak ada di repo.
- Concurrency multi-user (last-write-wins pada array `pembayaranList`). Dicatat, tidak diperbaiki.
- Perubahan arti bisnis DP (menunggu V-1).
