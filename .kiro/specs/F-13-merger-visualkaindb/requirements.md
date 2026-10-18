# Requirements Specification — F-13: Merger VisualKainDB ke Financial Analytics (Migrasi UI)

## 1. Konteks

Aplikasi operasional `visualkaindb` (Next 14, Firebase, Open Sans, CSS manual) akan dilebur ke aplikasi ini. Klien memakai dua perangkat: satu orang dengan monitor besar, satu orang hanya dengan HP. Semua modul yang dipindah wajib mengikuti standar UI aplikasi ini (Plus Jakarta Sans, token teal, `Card`/`Button`/`Badge`/`CustomSelect`, drawer, toast) dan responsif. Logika dan rumus tetap memakai `visualkaindb` supaya angka tidak berubah. Basis data sama: Firestore project `appkonveksi`.

Sumber: permintaan klien yang diteruskan Sehan (17 Okt 2026) beserta 4 screenshot, sesi grilling 17 Okt 2026 (Q1 sampai Q20), dan survei kode `D:\Projects\visualkaindb`. Inventaris layar lengkap ada di `screens.md`.

Permintaan klien:
1. Kolom tabel Data Customer mengikuti screenshot ke-1.
2. Kalimat panjang di tabel mengikuti screenshot ke-2 (teks turun baris, tidak terpotong).
3. MVP: Data Customer, Invoice, Size Chart sampai benar-benar bisa dipakai. Modul lain tetap masuk spec.
4. Nilai minus di tabel diberi warning di kolomnya.
5. Nomor surat kerjasama memakai aturan: kode unik, tahun, dan nomor pengajuan, supaya mudah difilter dan dicari.
6. Invoice tidak boleh berubah (UI, font, warna). Ekspor Excel rapi sesuai standar aplikasi ini.

## 2. Ruang Lingkup per Fase

| Fase | Isi | Status |
|---|---|---|
| Fase 1 (MVP) | Shell navigasi gabungan (sidebar desktop + bottom nav HP), Data Customer (daftar, detail, tambah, edit, hapus), Techpack, Invoice, Size Chart, warning minus dan teks panjang di semua tabel, ekspor Excel Data Customer | Dikerjakan |
| Fase 2 | Pengajuan Kerjasama (aturan nomor + daftar surat), Penawaran Harga (aturan nomor + daftar), Purchase Order | Dikerjakan |
| Fase 3 | Ringkasan Produksi (antrean, pipeline, radar deadline, komposisi order), Data Vendor, Kalender Produksi, Cost & Profit (kalkulator, kategori, bahan, markup) | Dikerjakan (permintaan Sehan 17 Okt 2026) |
| Tidak dimigrasi | Beranda `visualkaindb` dan modul `/finance` (cashout, kas vendor, report, manual) | Sudah digantikan modul finansial aplikasi ini |

## 3. Glossary

| Istilah | Definisi |
|---|---|
| Data Customer | Daftar order produksi (koleksi `orders`). Di `visualkaindb` berada di `/database`. |
| Kategori lengan | `pendek`, `panjang`, `tanpaLengan`, dan baru `tigaPerempat` (3/4 Tangan). Setiap kategori punya 9 ukuran XS sampai 5XL. |
| Tambahan ukuran besar | 2XL +5.000, 3XL +10.000, 4XL +15.000, 5XL +20.000 per pcs, berlaku untuk harga jual dan harga modal vendor, untuk semua kategori lengan termasuk 3/4. |
| Arsip | Order dengan tanggal invoice sebelum 1 Okt 2026. Read-only di aplikasi ini. |
| Kertas legacy | Komponen cetak yang disalin apa adanya dari `visualkaindb`: invoice, techpack, surat kerjasama, penawaran, PO. |
| Nomor dokumen | `SK-VK-{YYYY}-{NNN}` untuk kerjasama, `PH-VK-{YYYY}-{NNN}` untuk penawaran, `PO-{No. Invoice}` untuk PO. |

## 4. User Stories & Acceptance Criteria

### US-13.1 Navigasi gabungan desktop dan HP
1. THE sidebar desktop SHALL mengelompokkan menu menjadi Ringkasan, Operasional (Data Customer, Size Chart), Dokumen (Invoice, Purchase Order, Penawaran, Kerjasama), dan Finansial (Data Table, Dana Masuk, Dana Keluar, Mitra Vendor).
2. THE bottom nav HP SHALL berisi 5 slot: Ringkasan, Customer, Invoice, Size Chart, Menu.
3. WHEN slot Menu diketuk THEN sistem SHALL membuka bottom sheet berisi semua menu per grup dan tombol Keluar.
4. WHEN halaman aktif berada di dalam sheet Menu THEN ikon Menu SHALL tampil aktif.
5. THE URL lama `/?tab=datatable|cashin|cashout|vendor` SHALL tetap berfungsi.
6. THE identitas user di sidebar SHALL diambil dari profil login (displayName, atau nama dari email), bukan teks hardcode.

### US-13.2 Daftar Data Customer
1. THE tabel desktop SHALL menampilkan kolom berurutan: NO INV, NAMA CUSTOMER, NAMA PROJECT, DELIVERY DATE (DEADLINE), JENIS METODE PRODUKSI, KATEGORI, JENIS BAHAN, WARNA, CREATED BY, RAW ACC CUST, TOTAL (QTY), TOTAL TANPA LENGAN, TOTAL PENDEK, TOTAL 3/4 TANGAN, TOTAL PANJANG, VENDOR, DIBUAT, STATUS, AKSI.
2. THE kolom NO INV SHALL tetap terlihat di kiri dan kolom STATUS serta AKSI di kanan saat tabel di-scroll horizontal (desktop).
3. THE kolom teks di desktop SHALL turun baris di dalam lebar kolom tetap tanpa terpotong; angka dan tanggal tetap satu baris.
4. THE tampilan HP SHALL berupa kartu dengan teks maksimal 1 baris (terpotong "…"), dan ketuk kartu membuka layar detail.
5. THE pencarian SHALL mencocokkan nama customer, No. Invoice, nama project, dan metode produksi (tidak peka huruf besar/kecil).
6. THE filter status SHALL berisi Semua, Diterima, Pembayaran, Produksi, Finishing, QC, Packing, Delivery, Selesai, masing-masing dengan jumlah order.
7. THE daftar SHALL default menampilkan order dengan tanggal invoice mulai 1 Okt 2026; toggle "Arsip sebelum Okt 2026" SHALL menampilkan order lama secara read-only.
8. THE urutan SHALL terbaru dulu (`createdAt` turun); order tanpa `createdAt` tetap tampil di akhir.
9. THE kolom RAW ACC CUST SHALL menampilkan thumbnail `accCustUrl` yang bisa diperbesar, atau "-".
10. THE kolom DIBUAT SHALL menampilkan waktu relatif ("3 menit lalu") dengan tanggal dan jam lengkap pada tooltip.
11. THE kolom CREATED BY SHALL menampilkan `createdBy`, atau "-" untuk order lama.
12. THE aksi baris SHALL berisi Detail, Edit, Techpack, Invoice, dan Hapus; order arsip hanya Detail, Techpack, dan Invoice.
13. THE pintasan keyboard desktop SHALL tersedia: panah atas/bawah pilih baris, Enter buka detail, E edit, T techpack, Delete hapus (dengan konfirmasi), Ctrl+N order baru, Ctrl+F cari, Ctrl+panah kiri/kanan ganti halaman. Aksi SHALL selalu mengenai order yang tersorot, termasuk di halaman 2 dan seterusnya.
14. THE status loading SHALL memakai skeleton shimmer; status kosong dan gagal memuat SHALL punya pesan dan tombol coba lagi.

### US-13.3 Detail Order
1. THE layar detail SHALL menampilkan: identitas (No. Invoice, status, tanggal, deadline, dibuat oleh), Customer & Project, Produksi (metode, kategori, bahan, warna, detail produksi 1 sampai 4, catatan), rincian qty 4 kategori × 9 ukuran, Harga (harga jual dan harga modal per kategori, diskon), Ringkasan finansial, gambar ACC, size chart terpilih.
2. THE Ringkasan finansial SHALL memakai rumus modul finansial (`calculateOrderTotals`) sehingga angkanya sama dengan Data Table finansial.
3. WHEN nilai profit, profit %, atau sisa bernilai minus THEN sel tersebut SHALL memakai warning minus (US-13.10).
4. THE layar detail SHALL menyediakan aksi Edit, Techpack, Invoice, Edit Finansial, dan Hapus.

### US-13.4 Tambah & Edit Order
1. THE form SHALL berisi: Tanggal Invoice, No. Invoice (otomatis), Nama Customer (huruf besar, autocomplete dari order lama yang ikut mengisi No. WA), No. WhatsApp, Nama Project, Jenis Metode Produksi, Kategori Order (dari `cp_kategori`, tombol tambah kategori), Jenis Bahan (huruf besar), Warna, Deadline, Catatan, Size Chart (opsional), gambar ACC, Detail Produksi 1 sampai 4, Harga Jual per kategori lengan (4), Diskon, Harga Modal Vendor (modal: vendor + harga per kategori lengan), Status, dan qty 4 kategori × 9 ukuran.
2. THE No. Invoice SHALL berformat `VK{yy}{urut 4 digit}`, urut = nomor tertinggi tahun itu dari seluruh order + 1, dan SHALL dicek ulang ke Firestore sesaat sebelum simpan agar tidak dobel.
3. WHEN mode edit THEN mengubah tanggal SHALL NOT mengubah No. Invoice.
4. THE footer ringkasan SHALL menampilkan Total Pesanan, Total Jumlah, Total Modal Vendor, dan Profit; profit = Total Jumlah − Modal Vendor − Biaya Operasional (rumus tabel), merah bila minus, amber bila margin < 30%.
5. THE field DP customer, DP vendor, dan biaya operasional SHALL NOT ada di form ini; semuanya dikelola di modul finansial.
6. WHEN order baru disimpan THEN dokumen SHALL berisi `dpPersen: 70`, `dpNominal: 0`, `dpPersenPO: 0`, `dpNominalPO: 0`, `biayaOperasional: 0`, `pembayaranList: []`, `createdBy`, `createdByEmail`, `createdAt`, sehingga modul finansial membaca order ini belum dibayar.
7. WHEN order diedit THEN sistem SHALL hanya menulis field form ini dan SHALL NOT mengubah field pembayaran, DP, biaya tambahan, atau biaya operasional.
8. WHEN order yang sudah pernah diedit di modul finansial (`isManualFinanceOverride`) diubah qty, harga jual, diskon, atau harga modal vendornya THEN sistem SHALL menghitung ulang `grossTotal`, `totalInvoice`, `jumlahSemua`, `totalHpp`, `totalBiayaVendor`, `hppAktual` dengan rumus yang sama dengan editor finansial (gross dari qty × harga, ditambah biaya tambahan tersimpan).
9. WHEN status Selesai dipilih dan pembayaran vendor belum lunas THEN sistem SHALL menahan simpan dengan dialog "Pelunasan Vendor Belum Lengkap" berisi sisa utang vendor dan tautan ke Dana Keluar.
10. WHEN order disimpan THEN dokumen `tracking/{noInv}` SHALL disinkronkan dan riwayat status SHALL bertambah saat status berubah.
11. THE unggah gambar ACC SHALL menerima jpg/png/webp maksimal 5 MB, dikompres ke WebP (sisi terpanjang 1600 px, kualitas 0,82), dan endpoint unggah SHALL menolak permintaan tanpa token login.
12. WHEN ada perubahan yang belum disimpan dan user meninggalkan halaman THEN sistem SHALL meminta konfirmasi.

### US-13.5 Hapus Order
1. THE dialog konfirmasi SHALL menyebut No. Invoice dan nama customer.
2. IF order sudah punya pembayaran customer atau vendor tercatat THEN sistem SHALL menolak hapus dan menyebut pembayaran yang harus dihapus dulu di modul finansial.
3. WHEN hapus berhasil THEN dokumen `orders/{id}` dan `tracking/{noInv}` SHALL terhapus dan toast sukses tampil; WHEN gagal THEN toast galat SHALL tampil.

### US-13.6 Techpack
1. THE kertas techpack (Production Sheet, ACC Customer, Size Chart) SHALL disalin apa adanya dari `visualkaindb`, termasuk 3/4 Tangan sebagai grup qty tambahan.
2. THE tombol Cetak SHALL mencetak kertas tanpa elemen aplikasi.
3. THE pratinjau di HP SHALL memperkecil kertas A4 agar muat lebar layar tanpa mengubah tata letaknya.

### US-13.7 Invoice
1. THE kertas invoice SHALL identik dengan `visualkaindb` (layout, font Open Sans dan Arial, warna, ukuran kertas, cara cetak, judul file PDF `{noInv}_{namaCustomer}`).
2. THE baris pembayaran di kertas SHALL bersumber dari pembayaran customer modul finansial (`pembayaranList`); order tanpa daftar pembayaran modern SHALL memakai field lama (`dp1Nominal`, `dp2Nominal`, `pelunasanNominal`, `dpNominal`) dengan aturan yang sama seperti modul finansial.
3. THE pembayaran ke-1 dan ke-2 SHALL berlabel "DP 1" dan "DP 2", pembayaran berikutnya memakai labelnya, dan pembayaran jenis pelunasan berlabel "Pelunasan", semuanya dengan gaya baris yang sama.
4. THE panel "Atur DP & Tagihan" SHALL dihapus; Target DP % SHALL tetap bisa diatur dan disimpan ke `targetDpPersen`.
5. THE pemilihan order SHALL berupa pencarian (No. Invoice, customer, project, metode) dengan 4 rekomendasi terbaru saat kosong; tautan `/invoice?order={id}` SHALL langsung memilih order.
6. THE modal rekening SHALL menampilkan 3 rekening invoice dari `visualkaindb`, rekening dari master rekening aplikasi ini yang nomor dan atas namanya terisi, serta form manual; rekening manual yang disimpan SHALL masuk ke master rekening; pilihan terakhir SHALL diingat per perangkat.
7. THE kalkulasi item, subtotal, diskon, total, badge status, dan kotak sisa SHALL memakai rumus `visualkaindb` tanpa perubahan.

### US-13.8 Size Chart
1. THE daftar SHALL berupa grid kartu (1 kolom HP, 2 kolom tablet, 3 sampai 4 kolom desktop) berisi nama dan tabel Size | Panjang | Lebar untuk 9 ukuran.
2. THE modal buat/edit SHALL berisi Nama (wajib) dan tabel Panjang/Lebar (cm, min 0, langkah 0,5).
3. THE hapus SHALL meminta konfirmasi dan menampilkan toast hasil.
4. THE data SHALL tetap di koleksi `sizecharts` dengan bentuk `{nama, sizes: {XS: {panjang, lebar}, …}, createdAt}`.
5. THE layar SHALL punya status loading, kosong, dan gagal memuat.

### US-13.9 Ekspor Excel Data Customer
1. THE ekspor SHALL mengikuti standar `exceljs` aplikasi ini: blok metadata (judul, entitas, filter, tanggal unduh, jumlah data), baris KPI (Total Order, Total Qty, Tanpa Lengan, Pendek, 3/4 Tangan, Panjang), header teal, angka berformat, header beku, dan autofilter.
2. THE isi ekspor SHALL mengikuti pencarian, filter status, dan toggle arsip yang aktif.

### US-13.10 Warning nilai minus
1. WHEN sel nominal atau persen bernilai minus THEN sel SHALL berlatar rose, teks merah, dan ikon peringatan dengan tooltip penyebab.
2. THE baris yang punya sel minus SHALL diberi strip merah tipis di tepi kiri.
3. THE aturan ini SHALL berlaku di tabel master finansial yang sudah ada (profit dan profit %) dan semua tabel baru yang menampilkan nominal.

### US-13.11 Pengajuan Kerjasama (Fase 2)
1. THE nomor surat SHALL berformat `SK-VK-{YYYY}-{NNN}`, NNN urut per tahun mulai 001, dibuat lewat Firestore transaction pada koleksi penghitung sehingga tidak dobel walau dua user menyimpan bersamaan.
2. THE nomor SHALL dibuat saat surat pertama kali disimpan dan SHALL NOT berubah sesudahnya.
3. THE daftar surat SHALL bisa difilter per tahun dan dicari berdasarkan nomor, perihal, dan nama perusahaan.
4. THE form dan kertas surat SHALL sama dengan `visualkaindb` (kop, paragraf default, penanda tangan); kertas SHALL disalin apa adanya.
5. THE surat SHALL disimpan di koleksi `kerjasama`.

### US-13.12 Penawaran Harga (Fase 2)
1. THE nomor penawaran SHALL berformat `PH-VK-{YYYY}-{NNN}` dengan mekanisme yang sama seperti US-13.11.
2. THE form (item: deskripsi, qty, satuan, harga satuan, jumlah = qty × harga) dan kertas SHALL sama dengan `visualkaindb`, tanpa grand total.
3. THE penawaran SHALL disimpan di koleksi `penawaran` dan punya daftar dengan filter tahun dan pencarian.

### US-13.14 Ringkasan Produksi (Fase 3)
1. THE halaman `/produksi` SHALL menampilkan KPI Order Aktif, Antrean, Dalam Produksi, Pengiriman, Selesai (jumlah order dan pcs), pipeline 6 tahap (K-31) yang menaut ke Data Customer terfilter, radar deadline (lewat, H-3, aman) dengan daftar order terurut, qty belum selesai per jenis lengan, serta peringkat kategori, bahan, dan customer berdasarkan jumlah order.
2. THE halaman SHALL NOT menampilkan angka uang (sudah ada di Ringkasan Finansial).
3. THE periode default SHALL mulai Okt 2026 dengan pilihan "Semua periode" (K-1).
4. THE halaman SHALL memakai susunan chart dashboard `visualkaindb` fase 4-6 versi volume (K-29): tren bulanan (pcs atau jumlah order, area atau batang, skala adaptif atau linier, pilihan tahun, rincian bulanan), donut kategori dengan pipeline 4×2 dan daftar order di workshop, proporsi qty per jenis lengan dengan radar deadline dan antrean, leaderboard bertab (customer, bahan, vendor), dan distribusi ukuran aktif.

### US-13.15 Data Vendor (Fase 3)
1. THE daftar vendor SHALL bisa dicari dan menampilkan nama, alamat, WA, PIC, dan jumlah order.
2. THE tambah/edit SHALL menulis `vendors {nama, alamat, wa, pic}` dan menolak nama duplikat.
3. IF vendor masih dipakai order THEN hapus SHALL diblokir.

### US-13.16 Kalender Produksi (Fase 3)
1. THE kalender bulan SHALL menandai tanggal deadline order, catatan manual (`calendarNotes`), hari ini, dan hari libur.
2. THE ketuk tanggal SHALL menampilkan order yang deadline-nya hari itu atau form catatan baru.
3. THE ekspor SHALL tersedia sebagai tautan Google Calendar per deadline dan file `.ics` per bulan (K-28).

### US-13.17 Cost & Profit (Fase 3)
1. THE kalkulator SHALL memakai rumus `visualkaindb`: aturan markup pertama dengan qtyMin ≤ qty ≤ qtyMax, harga jual = modal × (1 + persen/100), profit = total jual − total modal.
2. THE database SHALL mengelola `cp_kategori`, `cp_bahan`, `cp_markup` dengan bentuk dokumen yang sama; hapus kategori diblokir bila masih punya bahan; aturan markup yang tumpang tindih diberi peringatan.

### US-13.18 Akun tim produksi (permintaan Sehan 17 Okt 2026)
1. THE email akun tim produksi SHALL didaftarkan di env `NEXT_PUBLIC_PRODUKSI_EMAILS` (dipisah koma, tidak peka huruf besar); password tidak disimpan di env atau repo.
2. WHEN akun yang terdaftar login atau membuka `/login` dalam keadaan sudah login THEN aplikasi SHALL membuka `/produksi`; akun lain tetap ke `/`.
3. THE akun tim produksi SHALL tetap bisa membuka semua halaman, termasuk Finansial (K-30).

### US-13.19 Feedback klien 17 Okt 2026 (batch kedua)
1. THE status order SHALL mengikuti 6 tahap `visualkaindb` main (Diterima, Pembayaran, Approval, Produksi, Pengiriman, Selesai); status lama finishing, QC, dan packing dibaca sebagai Produksi tanpa menulis ulang data (K-31).
2. THE kertas invoice dan PO SHALL memakai angka modul finansial: total invoice = tagihan bersih Data Table termasuk biaya tambahan customer dan hasil Edit Finansial; total PO = HPP finansial termasuk biaya tambahan vendor, dengan pembayaran ke vendor yang sudah tercatat (K-32).
3. THE kolom kiri footer invoice (rekening dan catatan) SHALL tidak bertumpuk dengan kolom total.
4. THE tabel Data Customer SHALL muat selebar layar desktop (≥ 1440 px dengan sidebar terbuka) tanpa scroll horizontal (K-33).
5. THE size chart SHALL tampil sebagai poster Measurement Guide desain klien dan bisa diunduh sebagai JPG (K-34).
6. THE kredensial Cloudinary SHALL dibaca dari env standar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; file catatan kredensial di luar format `.env` SHALL di-ignore git (K-35).

### US-13.20 Jejak pembuat data (permintaan Sehan 17 Okt 2026)
1. WHEN pengguna menambah data lewat aplikasi (order, Dana Masuk/Keluar, dana investor, pembayaran customer/vendor per termin, vendor, size chart, kategori/bahan/markup Cost & Profit, catatan kalender, rekening, surat) THEN dokumen atau entri SHALL menyimpan `createdBy` dan `createdByEmail` akun yang login.
2. WHEN data diubah THEN dokumen SHALL menyimpan `updatedBy` dan `updatedByEmail`; entri pembayaran yang diedit di panel termin juga.
3. THE tabel dan daftar SHALL menampilkan label "dibuat oleh" (dan "diubah" bila pengubah berbeda); data lama atau dari aplikasi lain tanpa jejak ditandai "Tidak tercatat" (K-36).

### US-13.21 Feedback klien 18 Okt 2026
1. THE footer total dan tombol simpan di form order SHALL statis di akhir form pada layar HP (di bawah md), dan tetap sticky di desktop, agar tidak ikut naik di atas keyboard saat mengisi data.
2. THE input dan kolom pencarian SHALL berukuran 14px di HP (sebelumnya 16px) dan 12px di desktop (K-37).
3. THE catatan Sisa DP di invoice SHALL berbunyi "* Wajib transfer sebelum pesanan diproduksi".
4. THE judul file cetak invoice SHALL berformat `{No Inv}_{Nama Customer} - {Nama Project}`.
5. THE pesan gagal upload karena env Cloudinary kosong SHALL tidak menampilkan nama variabel ke pengguna; nama variabel hanya dicatat di log server.

### US-13.13 Purchase Order (Fase 2)
1. THE nomor PO SHALL berformat `PO-{No. Invoice}`.
2. THE pemilihan order SHALL berupa pencarian seperti invoice; judul file cetak `PO-{noInv}_{vendor}`.
3. THE kertas PO SHALL disalin apa adanya dari `visualkaindb`, termasuk item harga modal vendor + tambahan ukuran besar.

## 5. Keputusan (hasil grilling 17 Okt 2026)

| ID | Keputusan |
|---|---|
| K-1 | Default semua tabel mulai Okt 2026, arsip pra-Oktober read-only lewat toggle (Q1 B). |
| K-2 | Jalan paralel dengan `visualkaindb`; dokumen ditulis dengan nama field yang sama; `visualkaindb` dipensiunkan per modul (Q2 A). |
| K-3 | Semua user melihat semua modul untuk MVP; hak akses per role masuk F-11 (Q3 A). |
| K-4 | Bottom nav HP: Ringkasan, Customer, Invoice, Size Chart, Menu (Q4 A). |
| K-5 | Warning minus di sel + strip kiri baris (Q5 A). |
| K-6 | Teks panjang turun baris di desktop, maksimal 1 baris di HP (Q6, jawaban Sehan). |
| K-7 | Tanpa filter per kolom; pencarian global + filter status (Q7 A). |
| K-8 | `SK-VK-YYYY-NNN`, `PH-VK-YYYY-NNN`, `PO-{noInv}` (Q8 A). |
| K-9 | Fase 1 dan Fase 2 dikerjakan; Fase 3 backlog (Q9). |
| K-10 | Kertas invoice disalin apa adanya; hanya bagian di luar kertas memakai UI baru (Q10). |
| K-11 | Branch `feat/F-13-merger-visualkaindb`, preview deploy, merge ke `main` per fase (Q11 A). |
| K-12 | Kolom Data Customer persis screenshot ke-1 + STATUS (Q12 A). |
| K-13 | Kategori 3/4 Tangan ditambahkan penuh dengan aturan tambahan ukuran besar yang sama; `visualkaindb` diberi patch konstanta kategori supaya totalnya sama (Q13). |
| K-14 | Created By disimpan mulai sekarang; Raw ACC Cust = `accCustUrl`; Dibuat relatif (Q14). |
| K-15 | Invoice membaca `pembayaranList`; panel Atur DP dihapus (Q15 A). |
| K-16 | Form Data Customer tidak menulis DP dan biaya operasional; total override finansial dihitung ulang bila qty/harga berubah (Q16 A). Order baru ditulis `pembayaranList: []` dan `dpNominal: 0` agar modul finansial tidak membaca DP 70% sebagai uang masuk, karena input DP kini hanya ada di Dana Masuk. |
| K-17 | Bug `visualkaindb` yang tidak mengubah angka diperbaiki; profit form memakai rumus tabel; tanggal invoice (`createdAt`) dan badge Lunas pada order Selesai dibiarkan seperti aslinya (Q17). |
| K-18 | Hapus order diblokir bila sudah ada pembayaran (Q18 A). |
| K-19 | Techpack masuk Fase 1 (Q19). |
| K-20 | Rekening invoice: modal tetap seperti `visualkaindb` (pilihan, form manual, diingat per perangkat), tetapi daftarnya juga memuat master rekening aplikasi ini dan rekening manual disimpan ke master (Q10 + Q20). Default tetap rekening invoice `visualkaindb`, karena nomor default master rekening aplikasi ini berbeda dan belum dikonfirmasi klien. |
| K-21 | Hasil review 17 Okt 2026: pembayaran berjenis pelunasan dari ledger finansial ikut dihitung ke target DP di kertas invoice (transfer 100% sekaligus tidak lagi menampilkan "Sisa DP"); edit order ditolak bila total baru di bawah uang yang sudah diterima; gerbang pelunasan vendor hanya saat status berubah ke Selesai; tanggal invoice wajib dan minimal 1 Okt 2026; tautan internal dari form yang belum disimpan meminta konfirmasi. |
| K-22 | Permintaan klien 17 Okt 2026: kertas invoice dikembalikan ke versi formal visualkaindb sebelum redesain 9 Okt (commit `d34f192`), menggantikan K-10 untuk invoice. Tipografi disamakan dengan kertas penawaran/surat (Open Sans, kop 22pt); tanpa badge rekening, pill status, atau kotak berwarna. Detail DP tetap ada dengan gaya total yang sama: Total Tagihan, Status Pembayaran (teks), baris DP diterima bertanggal, dan Sisa DP/Sisa Pelunasan/LUNAS. Kontrol Target DP di halaman invoice dihapus. Kop PO ikut memakai Open Sans. |
| K-23 | Size Chart memakai tata letak daftar + detail (tabel ukuran melebar di desktop, tegak di HP, diagram baju, daftar order pemakai) agar tidak banyak ruang kosong; isi size chart tidak berubah. |
| K-24 | Laporan Finansial order menampilkan baris "Biaya Tambahan Customer" di Ringkasan Pendapatan sehingga Subtotal − Diskon + Biaya Tambahan = Total Tagihan. |
| K-25 | Semua tombol utama dashboard (tinggi h-10/h-11) memakai gaya taktil yang sama dengan tombol "Surat Baru": border lebih gelap + `shadow-btn-primary` untuk solid, `shadow-btn-secondary` untuk outline, teks font-medium. |
| K-26 | Bottom nav HP mengikuti section halaman aktif (menggantikan K-4): Finansial menampilkan Data Table, Dana Masuk, Dana Keluar, Mitra Vendor; Dokumen menampilkan Invoice, PO, Penawaran, Kerjasama; Operasional menampilkan Customer dan Size Chart; Ringkasan menampilkan satu pintasan per section. Slot terakhir selalu Menu. |
| K-27 | Navigasi dua section: **Produksi** (Ringkasan Produksi, Data Customer, Size Chart, Data Vendor, Kalender, Cost & Profit, dan grup Dokumen) dan **Finansial** (Ringkasan Finansial, Data Table, Dana Masuk, Dana Keluar, Mitra Vendor). Memilih Ringkasan atau halaman dari satu section mengganti bottom nav HP ke section itu: 3 tab tetap + 1 slot halaman aktif + Menu (menggantikan K-26). |
| K-28 | Kalender: integrasi Google Calendar OAuth visualkaindb tidak dipindah karena client ID terikat domain lama; diganti tautan "Tambah ke Google Calendar" per deadline dan ekspor `.ics` per bulan. |
| K-29 | Ringkasan Produksi meniru susunan chart dashboard `visualkaindb` fase 4-6 (permintaan Sehan 17 Okt 2026), tetapi tanpa angka uang (US-13.14.2): tren Omzet & Profit menjadi tren volume pcs/jumlah order, bilah HPP vs laba menjadi proporsi qty per jenis lengan, tab Top Margin menjadi Vendor, kartu Arus Kas & Piutang tidak dibawa (sudah di Ringkasan Finansial) dan diganti distribusi ukuran aktif. Peringkat customer berdasarkan jumlah order, bukan omzet. Order tanpa deadline tidak dihitung "aman" seperti di `visualkaindb`, tetapi ditampilkan terpisah di akhir antrean. |
| K-30 | Akun Raja Purnama (tim produksi): akses penuh, hanya halaman awal setelah login yang diarahkan ke Ringkasan Produksi. Akun dibuat Sehan sendiri di Firebase Console (Authentication), bukan oleh agen, dan password dibagikan lewat jalur pribadi, tidak disimpan di env. Daftar email di env `NEXT_PUBLIC_PRODUKSI_EMAILS` ikut terkirim ke browser, jadi hanya berisi email. |
| K-31 | Status order 6 tahap mengikuti `visualkaindb` main (commit `e9c841f` dan sebelumnya): `received, payment, approval, production, delivery, completed`. Status lama `finishing`, `qc`, `packing` dinormalisasi ke `production` saat dibaca (seperti `normalizeStatus` visualkaindb); dokumen baru tertulis ulang hanya saat order disimpan. Sebelum perubahan ini, status `approval` dari visualkaindb terbaca sebagai Diterima. |
| K-32 | Invoice dan PO memakai `calculateOrderTotals` modul finansial, bukan rumus lama `lib/legacy` (menjawab Q-1). Baris "Biaya Tambahan" muncul bila ada biaya tambahan; selisih hasil Edit Finansial ditampilkan sebagai baris "Penyesuaian" agar kertas tetap konsisten. DP vendor di PO diganti "Sudah Dibayar" dari catatan pembayaran vendor finansial. `visualkaindb` main juga sudah memasukkan `biayaTambahanCust` ke total. |
| K-33 | Tabel Data Customer memakai `table-fixed` dengan lebar dasar kolom 1.086 px; di layar lebih lebar sisa ruang dibagi proporsional, di bawahnya baru muncul scroll horizontal. Label status memakai versi pendek, aksi berupa grid 2×2, detail dibuka lewat klik baris atau No Inv. |
| K-34 | Poster size chart diambil dari `sizechart.pdf` klien: kaos, panah, logo, dan grid diekspor sebagai SVG statis (`public/size-chart/guide-base.svg`, tabel raster dan teks pill dihapus lewat redaction); nama size chart dan tabel ukuran digambar dari data. JPG dibuat di browser lewat kanvas (2376×1836 px) tanpa dependensi baru. |
| K-35 | `env.cloudinary` (catatan teks, bukan format `NAMA=nilai`) tidak dibaca Next.js dan belum di-ignore git; `.gitignore` kini mencakup `.env*`, `env.*`, `*.env`. Nilai Cloudinary perlu dipindah Sehan ke `.env.local` dan Vercel dengan tiga nama variabel standar; agen tidak membuka isinya. |
| K-36 | Jejak pembuat memakai nama field yang sama dengan order (`createdBy`, `createdByEmail`, ditambah `updatedBy`, `updatedByEmail`), diisi dari akun Firebase yang login (nama tampilan, atau nama dari email). Stempel pembuat entri pembayaran dipasang di panel termin saat entri dibuat, bukan saat simpan, agar entri lama tidak keliru tercatat atas nama pengubah. Data lama tidak diisi mundur (tidak ada penulisan massal ke produksi); labelnya "Tidak tercatat". Penghapusan belum dicatat. |
| K-37 | Input di HP diturunkan ke 14px atas permintaan klien. Konsekuensinya Safari iPhone bisa memperbesar halaman saat input disentuh (aturan iOS untuk teks di bawah 16px); viewport tidak dikunci agar zoom manual tetap bisa dipakai. Klien memakai Android. |

## 6. Pertanyaan terbuka
- Q-1: terjawab oleh K-32 (feedback klien 17 Okt 2026).

## 7. Di luar cakupan
- Perubahan rumus finansial modul yang sudah ada.
- Hak akses per role dan pengetatan Firestore rules (F-11).
- Migrasi data lama; tidak ada penulisan massal ke data produksi.
