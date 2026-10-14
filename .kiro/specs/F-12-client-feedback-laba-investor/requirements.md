# Requirements Specification — F-12: Feedback Klien 14 Okt 2026 (Laba Bersih, Biaya Tambahan, Master Vendor & Rekening, Dana Investor)

## 1. Konteks

Klien (Head of Finance & Accounting) memberi 10 poin feedback pada 14 Okt 2026 disertai 9 tangkapan layar. Spec ini menggabungkan semuanya dalam satu feature spec. Nomor F-11 tetap direservasi untuk spec security (keputusan K-7 di F-10), sehingga spec ini memakai F-12.

Sumber: pesan klien yang diteruskan Sehan, screenshot 1–9 (kartu "Profit & Omzet", kolom biaya tambahan di tabel master, section 1 halaman edit order, header "Komitmen Vendor (HPP)", drawer utang vendor dengan filter "Vendor Wisnu", section 3 HPP vendor, badge "Live Firestore", field "Nomor Voucher / Ref Bukti", dan form termin yang dicoret).

## 2. Glossary

| Istilah | Definisi |
|---|---|
| Laba Kotor | Σ per order (Net Invoice − HPP Vendor − Biaya Operasional Order). Nilai yang sebelumnya tampil sebagai "Profit & Omzet". Basis order (tanggal order). |
| Beban Operasional Kas | Kas keluar non-order pada periode (tanggal transaksi), **kecuali** kategori `Pembayaran Vendor` (sudah tercakup HPP) dan `Pengembalian Dana Investor` (pelunasan kewajiban, bukan beban). |
| Laba Bersih (Profit Riil) | Laba Kotor − Beban Operasional Kas. |
| Margin Bersih | Laba Bersih ÷ Omzet × 100%. |
| Pemasukan Usaha | Dana masuk dari pembayaran customer + kas masuk non-order biasa (bukan investor). |
| Dana Investor | Kas masuk kategori `Dana Investor`. Menambah saldo kas, **bukan** pendapatan, dan menimbulkan kewajiban kembali. |
| Pengembalian Dana Investor | Kas keluar kategori `Pengembalian Dana Investor`. Mengurangi saldo kas dan kewajiban investor, bukan beban. |
| Bagi Hasil Investor | Kas keluar kategori `Bagi Hasil Investor`. Beban (mengurangi Laba Bersih), tidak mengurangi kewajiban pokok. |
| Kewajiban Investor | Σ Dana Investor − Σ Pengembalian Dana Investor, kumulatif sejak 1 Okt 2026 sampai akhir periode. |
| Biaya Tambahan | Rincian item biaya tambahan per order dengan sumber `customer` (ditagihkan ke customer, menambah net invoice), `vendor` (tagihan tambahan vendor, menambah HPP), atau `lainnya` (biaya internal, menambah biaya operasional order). |
| Master Rekening | Daftar rekening bank/kas yang dapat ditambah dan diedit. Default dari `DEFAULT_PAYMENT_CHANNELS`, override dan tambahan disimpan di koleksi Firestore `finance_rekening`. |

## 3. User Stories & Acceptance Criteria

### US-12.1 Kartu Laba Bersih (Profit Riil) — feedback #1
Sebagai Head of Finance, saya ingin melihat laba bersih setelah dipotong dana vendor dan dana keluar operasional, karena angka "Profit & Omzet" saat ini sebenarnya laba kotor.

1. THE dashboard SHALL menampilkan kartu "Laba Bersih (Profit Riil)" dengan nilai `labaBersih = labaKotor − bebanOperasionalKas` untuk periode aktif.
2. THE kartu "Profit & Omzet" SHALL diganti nama menjadi "Laba Kotor & Omzet" tanpa mengubah rumus nilainya.
3. THE kartu Laba Bersih SHALL menampilkan badge "Margin X%" dengan `X = labaBersih / omzet × 100` (0 bila omzet 0).
4. WHEN nilai Laba Bersih negatif THEN kartu SHALL memakai warna peringatan rose seperti kartu lain yang negatif.
5. WHEN kartu Laba Bersih diklik THEN drawer detail SHALL menampilkan komponen: Omzet, − HPP Vendor, − Biaya Operasional Order, = Laba Kotor, − Beban Operasional Kas per kategori, = Laba Bersih.
6. THE jumlah Beban Operasional Kas per kategori di drawer SHALL sama persis dengan `bebanOperasionalKas` pada summary.
7. THE perhitungan Beban Operasional Kas SHALL NOT menyertakan `Pembayaran Vendor` dan `Pengembalian Dana Investor`, dan SHALL menyertakan `Bagi Hasil Investor`.

### US-12.2 Rincian Biaya Tambahan — feedback #2
Sebagai finance, saya ingin biaya tambahan dirinci per item beserta asalnya (customer, vendor, atau lainnya).

1. THE halaman Edit Finansial SHALL menyediakan section "2. Rincian Biaya Tambahan" untuk menambah, mengedit, dan menghapus item `{keterangan, nominal, sumber}`.
2. THE section SHALL menampilkan kartu ringkasan total per sumber: Customer, Vendor, Lainnya.
3. WHEN item sumber `customer` berubah THEN Net Invoice SHALL = Gross − Diskon + Σ customer.
4. WHEN item sumber `vendor` berubah THEN Total Biaya HPP Vendor SHALL = HPP Dasar + Σ vendor.
5. WHEN item sumber `lainnya` berubah THEN biaya operasional order total SHALL = Biaya Operasional Dasar + Σ lainnya.
6. WHEN disimpan THEN dokumen order SHALL menyimpan `biayaTambahanList`, `biayaTambahanCustomer` dan `biayaTambahanCust` (Σ customer), `biayaTambahanVendor` dan `biayaLainnya` (Σ vendor), `biayaOperasional` (dasar + Σ lainnya), dan `biayaOperasionalDasar`.
7. IF order belum punya `biayaTambahanList` atau Σ per sumber di list tidak cocok dengan field skalar THEN sistem SHALL membentuk item dari field skalar (`biayaTambahanCustomer`, `biayaTambahanVendor`) sehingga total awal tidak berubah.
8. THE drawer Inspeksi Order SHALL menampilkan kartu "Rincian Biaya Tambahan" berisi item dan total per sumber bila ada biaya tambahan.
9. THE nominal item SHALL > 0 dan keterangan SHALL tidak kosong sebelum item dapat ditambahkan.

### US-12.3 Rename "DP Vendor" menjadi "Pembayaran Vendor" — feedback #3
1. THE kolom tabel master "DP VENDOR" SHALL bernama "PEMBAYARAN VENDOR", termasuk header ekspor Excel.
2. THE label "DP Vendor Disetor" di drawer Inspeksi Order SHALL menjadi "Pembayaran Vendor".
3. THE nilai kolom SHALL tetap total yang sudah dibayar ke vendor (`totalDibayarKeVendor`).

### US-12.4 Total gabungan per vendor saat difilter — feedback #4
1. WHEN drawer Utang Vendor difilter ke satu vendor THEN drawer SHALL menampilkan kartu agregat "Total {vendor} ({n} pesanan)" berisi Σ Total Nilai Invoice, Σ HPP Vendor, Σ Sudah Diserahkan, Σ Sisa Utang, dan Σ Net Profit dari pesanan yang tampil.
2. WHEN filter "Semua Vendor" THEN kartu agregat SHALL NOT tampil.
3. THE agregat SHALL mengikuti pencarian teks yang aktif (hanya pesanan yang tampil).

### US-12.5 HPP Vendor terkunci (preview) — feedback #5
1. THE field "Total Biaya HPP Vendor" di halaman edit SHALL read-only dan menampilkan HPP Dasar + Σ biaya tambahan vendor.
2. THE helper text SHALL menjelaskan bahwa HPP berasal dari data order dan berubah hanya lewat biaya tambahan sumber vendor.
3. THE HPP Dasar SHALL = max(0, totalHpp tersimpan − biayaTambahanVendor tersimpan), sehingga total HPP saat halaman dibuka sama dengan nilai tersimpan.

### US-12.6 Tambah & edit vendor dan rekening — feedback #6 dan #10
1. THE pilihan "Mitra Vendor Konveksi" SHALL memiliki aksi "Tambah" dan "Edit".
2. WHEN vendor baru ditambah THEN sistem SHALL membuat dokumen di koleksi `vendors` `{nama, pic, createdAt}` dan memilih vendor itu di form.
3. WHEN vendor yang punya dokumen `vendors` diedit THEN sistem SHALL memperbarui `nama` dokumen itu. WHEN vendor tanpa dokumen diedit THEN sistem SHALL membuat dokumen baru dengan nama hasil edit.
4. IF nama vendor kosong atau sama (tanpa beda huruf besar/kecil) dengan vendor lain THEN sistem SHALL menolak dengan pesan galat.
5. THE pilihan rekening (Rekening Tujuan / Sumber Rekening) di semua form kas SHALL memiliki aksi "Tambah" dan "Edit".
6. THE data rekening SHALL berisi `kode` (tetap, dipakai sebagai prefix keterangan transaksi), `namaBank`, `nomor`, `atasNama`.
7. WHEN rekening default diedit THEN sistem SHALL menyimpan override ke `finance_rekening` dengan `kode` yang sama, sehingga transaksi lama tetap terbaca rekeningnya.
8. IF listener `finance_rekening` gagal THEN form SHALL tetap memakai daftar default dan SHALL NOT mengubah status sinkron global dashboard.

### US-12.7 Hapus badge "Live Firestore" — feedback #7
1. THE header dashboard SHALL NOT menampilkan badge "Live Firestore" maupun jumlah order saat status sinkron `live`.
2. THE tombol "Gagal sinkron, coba lagi" dan banner error SHALL tetap ada (keputusan F-10).

### US-12.8 Hapus field voucher di Kas Keluar — feedback #8
1. THE form Kas Keluar mode operasional SHALL NOT menampilkan field "Nomor Voucher / Ref Bukti" dan baris "No. Voucher" di ringkasan.
2. WHEN transaksi lama berprefix `[Voucher: X]` diedit THEN teks voucher SHALL tetap dipertahankan di keterangan (tidak hilang).

### US-12.9 Dana Investor terpisah dari pemasukan usaha — feedback #9
1. THE form Dana Masuk SHALL punya mode ketiga "Dana Investor" dengan field: tanggal, nominal, nama investor, rekening penerima, target tanggal pengembalian (opsional), catatan.
2. THE form Dana Keluar SHALL punya mode "Investor" dengan jenis "Pengembalian Pokok" atau "Bagi Hasil", nama investor (pilih dari investor yang tercatat), tanggal, nominal, rekening, catatan.
3. IF jenis Pengembalian Pokok dan nominal > sisa kewajiban investor terpilih THEN simpan SHALL ditolak.
4. THE Saldo Kas SHALL = saldo awal + pemasukan usaha + dana investor − seluruh kas keluar (termasuk pengembalian investor).
5. THE kartu "Dana Masuk" SHALL menampilkan Pemasukan Usaha saja (tanpa dana investor).
6. THE dashboard SHALL menampilkan kartu "Dana Investor" bernilai Kewajiban Investor per akhir periode, dengan keterangan dana investor masuk dan dikembalikan pada periode.
7. WHEN kartu Dana Investor diklik THEN drawer SHALL menampilkan per investor: total masuk, total dikembalikan, bagi hasil, sisa kewajiban, target pengembalian terdekat.
8. THE tab Kas Masuk SHALL memisahkan Pemasukan Usaha dan Dana Investor (kartu KPI dan filter jenis "Dana Investor").
9. THE Laba Kotor dan Laba Bersih SHALL NOT terpengaruh dana investor masuk maupun pengembalian pokok.
10. WHEN transaksi investor diedit dari tab Kas Masuk/Kas Keluar THEN form SHALL terbuka di mode investor, dan mode lain SHALL dinonaktifkan (transaksi tidak boleh berpindah antara `kas` dan `finance_investor`).
11. IF dana investor masuk diedit (nominal/nama), diubah menjadi kas masuk biasa, atau dihapus sehingga total pengembalian investor itu melebihi total dana masuknya THEN perubahan SHALL ditolak.

### US-12.10 Perbaikan form termin (screenshot coretan) — feedback #10
1. THE judul form termin customer SHALL "Tambah Status Pembayaran" (bukan "Termin ke-N"); saat edit SHALL "Edit status pembayaran ke-N".
2. THE judul form vendor SHALL "Tambah Pembayaran Vendor"; saat edit "Edit pembayaran vendor ke-N".
3. THE label "Nama termin" / "Nama pembayaran" SHALL menjadi "Judul Pembayaran", termasuk header kolom tabel riwayat.
4. THE "Rekening Tujuan" SHALL dapat ditambah dan diedit nomornya (US-12.6).

## 4. Non-Regression Invariants

1. Saldo Kas Riil = (Saldo Awal + Total Kas Masuk) − Total Kas Keluar SHALL CONTINUE TO hold; Total Kas Masuk kini = Pemasukan Usaha + Dana Investor.
2. Metrik kas SHALL CONTINUE TO cash basis per tanggal transaksi (F-10 K-1/K-2); omzet, piutang, utang vendor, laba kotor tetap basis order.
3. Logika DP 70% dan status lunas (sisa ≤ 0) SHALL CONTINUE TO tidak berubah.
4. Order tanpa biaya tambahan baru SHALL CONTINUE TO memiliki net invoice, HPP, dan biaya operasional yang sama setelah dibuka dan disimpan tanpa perubahan.
5. Entri pinjaman di `riwayatPembayaran` SHALL CONTINUE TO dipertahankan saat menulis ulang (F-10 M3).
6. `npm run lint`, `npm run test`, dan `npm run build` SHALL hijau.

## 5. Keputusan & Asumsi (perlu konfirmasi klien)

| ID | Keputusan |
|---|---|
| A-1 | Laba Bersih memakai basis campuran: laba kotor basis order (tanggal order), beban kas basis tanggal transaksi. Pendapatan lain non-order **tidak** ditambahkan ke laba bersih karena klien hanya menyebut pemotongan. |
| A-2 | Item biaya tambahan sumber `lainnya` dianggap beban internal dan masuk ke biaya operasional order. |
| A-3 | "Rename ke pembayaran vendor" ditafsirkan sebagai kolom "DP VENDOR" → "PEMBAYARAN VENDOR" karena nilainya total pembayaran, bukan hanya DP. |
| A-4 | Rename vendor di koleksi `vendors` ikut mengubah nama di aplikasi operasional VisualKainDB (koleksi dipakai bersama). Order yang hanya menyimpan `vendorName` tanpa `vendorId`, serta `vendorPembayaranList[].vendorName` yang sudah tersimpan, tidak ikut berubah. Dokumen vendor baru hanya berisi `{nama, pic, createdAt}`; terverifikasi aman karena VisualKainDB membaca `alamat`/`wa` dengan fallback `'-'`. |
| A-5 | Transaksi investor (masuk, pengembalian pokok, bagi hasil) disimpan di koleksi terpisah `finance_investor`, bukan `kas`. Alasan: VisualKainDB menghitung saldo = profit − semua kas `keluar`, sehingga pengembalian pokok di `kas` akan terbaca sebagai beban; VisualKainDB juga akan dilebur ke aplikasi ini, jadi data baru tidak dibentuk mengikuti skema lamanya. Di dalam aplikasi, transaksi investor digabung ke daftar kas agar saldo tetap utuh. Keputusan Sehan, 2026-10-14. |
| A-6 | Kartu Dana Investor menampilkan sisa kewajiban (saldo), bukan arus masuk periode, karena angka itu yang harus dibayar kembali. |
| A-7 | Kategori kas masuk "Pendapatan Lain / Non-Operasional" disimpan dengan nilai `Pendapatan Lain`, bukan `Biaya Lain`, karena `Biaya Lain` juga kategori beban di kas keluar. Kas masuk lama berkategori `Biaya Lain` (atau tanpa kategori) dibaca sebagai `Pendapatan Lain` dan ditulis ulang dengan nilai baru saat diedit. Kas keluar `Biaya Lain` tidak berubah. VisualKainDB tidak punya daftar kategori kas masuk, jadi nilai baru aman dibaca di sana. Keputusan Sehan, 2026-10-14 (audit F2). |
| A-8 | Dana investor yang tercatat sebelum F-12 sebagai kas masuk biasa dipindahkan ke `finance_investor` oleh agen lewat Firebase MCP, bukan dicatat ulang oleh klien. Saldo kas di VisualKainDB turun sebesar dana itu karena aplikasi tersebut tidak membaca `finance_investor`; Sehan menerima konsekuensi ini. Keputusan Sehan, 2026-10-14 (audit F1). |

## 6. Out of Scope

- Hapus vendor dan hapus rekening (klien hanya meminta tambah dan edit).
- Bunga/jadwal cicilan investor otomatis; bagi hasil dicatat manual sebagai kas keluar.
- Perubahan rumus DP 70%, status lunas, dan security (F-11).
- Migrasi data lama `biayaTambahanList` di Firestore; list dibentuk saat order dibuka dan ditulis saat disimpan.
- Temuan audit AU-3 sampai AU-5 di §7: klien tidak mengeluhkan, jadi hanya dicatat.

## 7. Audit Data Produksi (2026-10-14, Firebase MCP, baca saja)

### Hasil yang cocok
- Tiga order lolos cutoff 1 Okt: VK260039, VK260040, VK260041. Omzet Rp 13.257.000 dan laba kotor Rp 4.102.000, sama dengan screenshot klien.
- Nilai tersimpan ketiga order cocok dengan rumus SSOT dari rincian size (kecuali catatan AU-4a).
- Invariant #4 terverifikasi untuk ketiga order: membuka lalu menyimpan tanpa perubahan menghasilkan net invoice, HPP, dan biaya operasional yang sama. Risiko L7 tidak terpicu di data saat ini.
- Kategori `kas` yang dipakai (Biaya Lain, Gaji/Upah, Operasional, Bahan Baku, Perawatan Web/Sistem) dikenal `KATEGORI_KAS_KELUAR_OPTIONS` dan tidak bentrok dengan kategori investor.
- Semua order menyimpan `vendorId`, jadi rename vendor (A-4) tercermin lewat peta vendor di hook.
- Angka Oktober 2026 dari data asli: beban kas Rp 2.548.520, laba bersih Rp 1.553.480, kas masuk Rp 9.246.500 (termasuk dana investor Rp 2.000.000), kas keluar Rp 8.248.520, saldo kas Rp 997.980 dengan saldo awal 0.

### Ditindaklanjuti
- AU-1 → A-8: dokumen `kas/YdRM2j4mK715FDhbKZmR` (13 Okt 2026, masuk Rp 2.000.000, kategori `Biaya Lain`, "Transfer BCA - Investasi visualkain") dipindahkan ke `finance_investor/YdRM2j4mK715FDhbKZmR` dengan `jenis: masuk`, `investorNama` kosong, `createdAt` asli, dan penanda `migratedFromKas`. Dokumen di `kas` dihapus setelah salinan terverifikasi (precondition `updateTime`).
- AU-2 → A-7: nilai `Biaya Lain` dipakai untuk pendapatan lain (kas masuk) dan beban (kas keluar).

### Dicatat, tidak dieksekusi (klien tidak meminta)
| ID | Catatan | Bila suatu saat ditindaklanjuti |
|---|---|---|
| AU-3 | Saldo awal per 1 Okt 2026 dianggap 0. Tanpa dana investor, saldo kas Oktober menjadi −Rp 1.002.020. Entri "Penyesuaian saldo awal" (`kas/02LAWvzNesKiHte49l39`, 23 Sep, keluar Rp 3.973.000, kategori Perawatan Web/Sistem) dan pengambilan dana pemilik (`kas/rbYnkw81slTzuzHllmz1`, 15 Sep, Gaji/Upah Rp 500.000) jatuh sebelum cutoff sehingga diabaikan. | Minta saldo bank riil per 1 Okt; bila bukan 0, catat transaksi `Saldo Awal` bertanggal 2026-10-01. |
| AU-4a | VK260041: `grossTotal` 1.450.000, sedangkan rincian size memberi 1.440.000 (selisih 10.000). `biayaLainnyaNotes` berisi "Plastik Ziplok dan 2 warna tambahan sablon" tetapi `biayaLainnya` 0. Nilai manual override dipakai apa adanya. | Konfirmasi apakah 10.000 itu biaya tambahan customer. |
| AU-4b | VK260040 ber-customer "VISUALKAIN" (kemungkinan order internal); laba Rp 600.000 ikut laba kotor. Vendor sudah dibayar Rp 1.000.000 sementara DP customer Rp 600.000, melebihi alokasi escrow vendor (Rp 480.000). | Konfirmasi perlakuan order internal. |
| AU-4c | Kas keluar "Bahan Baku" Rp 519.520 (14 Okt) dihitung beban; bila bahan itu bagian HPP order, terhitung ganda. "Biaya pinjaman wawa" Rp 201.000 dihitung beban; bila berupa pinjaman yang akan kembali, seharusnya piutang. | Konfirmasi sifat kedua transaksi. |
| AU-5 | Order belum punya `vendorPembayaranList`, sehingga pembayaran vendor diberi tanggal order (`buildCashOutflowEntries`). Total bulanan benar, tren harian tidak presisi. | Isi tanggal per pembayaran vendor lewat form edit order. |
