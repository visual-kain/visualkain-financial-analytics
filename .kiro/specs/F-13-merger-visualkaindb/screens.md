# Inventaris Layar — F-13

Setiap layar dan sub-layar dari `visualkaindb` beserta padanannya di aplikasi ini. Kolom "Legacy" merujuk file di `D:\Projects\visualkaindb\src`.

## Shell

| Layar | Legacy | Baru |
|---|---|---|
| Splash 1,8 detik | `app/loading.tsx` | Dihapus; memakai layar verifikasi `AuthGate` yang ada |
| Login | `app/login/page.tsx` | `/login` yang ada (tetap) |
| Header + sapaan + tanggal | `components/layout/Header.tsx` | Header halaman `PageHeader` (judul, subjudul, aksi) |
| Tab nav + dropdown | `components/layout/TabNav.tsx` | Sidebar desktop berkelompok + bottom nav HP 5 slot + sheet Menu |

## Fase 1

### Data Customer (`/data-customer`)
| Sub-layar | Legacy | Baru |
|---|---|---|
| Header: cari, filter status, New Order | `components/database/FilterSection.tsx` | `PageHeader` + bilah filter: pencarian, chip status dengan jumlah, toggle Arsip, Ekspor Excel, Order Baru |
| Tabel 23 kolom | `components/database/OrderTable.tsx` | Tabel 19 kolom (screenshot ke-1 + STATUS), kolom lengket, teks turun baris |
| Kartu HP | tidak ada (tabel di-scroll) | Kartu: NO INV, status, customer, project, deadline, qty per kategori, vendor, dibuat, aksi |
| Skeleton loading | `OrderTable.tsx:63-108` | Shimmer baris (desktop) dan kartu (HP) |
| Kosong | `OrderTable.tsx:110-151` | `EmptyState` + tombol Order Baru |
| Gagal memuat | tidak ada | Banner galat + Coba lagi |
| Pagination | `components/database/Pagination.tsx` | Bilah halaman gaya tabel master (10 per halaman, ringkas di HP) |
| Pratinjau gambar ACC | buka tab baru | Lightbox dialog |
| Konfirmasi hapus | SweetAlert "Hapus Order?" | Dialog berisi No. Invoice + customer; versi terblokir bila ada pembayaran |
| Pintasan keyboard | `hooks/useKeyboard.ts` | Hook baru dengan indeks global (bug halaman 2 diperbaiki) |

### Detail Order (`/data-customer/[id]`) — baru
| Bagian | Isi |
|---|---|
| Header | No. Invoice, badge status, tanggal invoice, deadline, dibuat oleh, waktu dibuat; aksi Edit, Techpack, Invoice, Edit Finansial, Hapus |
| Customer & Project | nama, WA (tombol chat), project |
| Produksi | metode, kategori, bahan, warna, detail produksi 1–4, catatan |
| Rincian qty | tabel 4 kategori × 9 ukuran + subtotal (HP: kartu per kategori) |
| Harga | harga jual dan modal per kategori, diskon, vendor |
| Ringkasan finansial | total tagihan, modal vendor (HPP), biaya operasional, profit, profit %, sudah dibayar customer, sisa tagihan, sudah dibayar ke vendor; warning minus |
| ACC & Size chart | gambar ACC (lightbox), tabel size chart terpilih |
| Arsip | banner read-only untuk order sebelum Okt 2026 |

### Form Order (`/data-customer/new`, `/data-customer/[id]/edit`)
| Sub-layar | Legacy | Baru |
|---|---|---|
| Kartu Informasi Customer & Project | `OrderForm.tsx` | Card yang sama, grid 1 kolom HP / 2 kolom desktop |
| Autocomplete customer | dropdown | Dropdown daftar customer (mengisi WA) |
| Modal Tambah Kategori | `OrderForm.tsx:972-983` | Dialog Radix |
| Unggah ACC (kosong, mengunggah, ada gambar, galat) | `components/ui/AccImageUpload.tsx` | Komponen baru dengan status yang sama + pratinjau |
| Kartu Detail Produksi | `prodDetail1..4` | Sama |
| Kartu Harga & Status | harga 3 kategori, DP, biaya operasional, status | Harga 4 kategori, diskon, status (DP dan biaya operasional pindah ke modul finansial) |
| Modal Harga Modal Vendor | `OrderForm.tsx:939-969` | Dialog: vendor + harga modal 4 kategori |
| Qty per kategori | 3 kartu × 9 ukuran | 4 kartu × 9 ukuran (Pendek, 3/4 Tangan, Panjang, Tanpa Lengan) dengan subtotal |
| Footer ringkasan lengket | `OrderForm.tsx:870-935` | Footer lengket: Total Pesanan, Total Jumlah, Modal Vendor, Profit (+%), Batal, Simpan |
| Dialog Pelunasan Vendor Belum Lengkap | SweetAlert | Dialog: sisa utang vendor + tautan Dana Keluar |
| Konfirmasi keluar tanpa simpan | tidak ada | `useBeforeUnloadGuard` + dialog |

### Techpack (`/data-customer/[id]/techpack`)
| Sub-layar | Legacy | Baru |
|---|---|---|
| Toolbar | Back to Database, Print | Kembali, Cetak (UI baru) |
| Halaman 1 Production Sheet | `TechPackPaper.tsx` | Disalin apa adanya + grup 3/4 Tangan |
| Halaman 2 ACC Customer | `AccPaper` | Disalin apa adanya |
| Halaman 3 Size Chart | `SizeChartPaper` | Disalin apa adanya |
| Order tidak ditemukan / memuat | satu pesan | Shimmer saat memuat, `EmptyState` bila tidak ada |

### Invoice (`/invoice`)
| Sub-layar | Legacy | Baru |
|---|---|---|
| Pencarian order + rekomendasi | `app/invoice/page.tsx` | Combobox pencarian (4 terbaru saat kosong, maks 10 hasil) |
| Panel Atur DP & Tagihan | `app/invoice/page.tsx:353-469` | Dihapus (K-15); diganti ringkasan pembayaran read-only + Target DP % |
| Modal Rekening Bank | `app/invoice/page.tsx:472-654` | Dialog: rekening invoice, master rekening, form manual |
| Kertas invoice | `components/invoice/InvoicePreview.tsx` | Disalin apa adanya, sumber pembayaran dari `pembayaranList` |
| Kosong | "Pilih order untuk menampilkan invoice" | `EmptyState` + kertas kosong legacy |

### Size Chart (`/size-chart`)
| Sub-layar | Legacy | Baru |
|---|---|---|
| Hero + Buat Size Chart | `app/size-chart/page.tsx` | `PageHeader` + tombol Buat |
| Grid kartu | `components/sizechart/SizeChartGrid.tsx` | Grid `Card` 1/2/3/4 kolom, tabel ukuran ringkas |
| Modal buat/edit | `components/sizechart/SizeChartModal.tsx` | Dialog, tabel input Panjang/Lebar |
| Konfirmasi hapus | SweetAlert | Dialog + toast |
| Kosong / loading | kosong saja | `EmptyState` / shimmer |

## Fase 2

### Kerjasama (`/kerjasama`)
| Sub-layar | Legacy | Baru |
|---|---|---|
| Daftar surat | tidak ada | Tabel/kartu: No. Surat, tanggal, perihal, perusahaan, dibuat oleh; filter tahun, pencarian |
| Form + pratinjau | `components/kerjasama/KerjasamaForm.tsx`, `KerjasamaPreview.tsx` | Form UI baru + kertas legacy disalin; desktop 2 kolom, HP tab Form/Pratinjau |
| Nomor surat | acak `SK-yymm-rrr` | `SK-VK-YYYY-NNN` dari transaction penghitung |
| Cetak | `window.print` | `PrintPortal` |

### Penawaran (`/penawaran`)
| Sub-layar | Legacy | Baru |
|---|---|---|
| Daftar penawaran | tidak ada | Tabel/kartu dengan filter tahun dan pencarian |
| Form item + pratinjau | `components/penawaran/PenawaranForm.tsx`, `PenawaranPreview.tsx` | Form UI baru (kolom tidak pecah per huruf), kertas disalin |
| Nomor | acak `PH-yymm-rrr` | `PH-VK-YYYY-NNN` |

### Purchase Order (`/purchase-order`)
| Sub-layar | Legacy | Baru |
|---|---|---|
| Pencarian order | `app/purchase-order/page.tsx` | Combobox seperti invoice |
| Kertas PO | `components/po/POPaper.tsx` | Disalin apa adanya, nomor `PO-{noInv}` |

## Fase 3 (backlog)

| Modul | Legacy | Catatan |
|---|---|---|
| Master Vendor | `app/vendor/page.tsx`, `components/vendor/VendorModal.tsx` | Tabel nama, alamat, WA, PIC; cek referensi order sebelum hapus |
| Kalender Produksi | `app/kalender/page.tsx`, `components/kalender/ProductionCalendar.tsx` | Grid bulan, modal deadline, catatan manual, Google Calendar |
| Cost & Profit | `app/cost-profit/*`, `components/cost-profit/*` | Kalkulator, kategori, bahan, aturan markup |
| Ringkasan operasional | `components/home/StatsGrid.tsx`, `OperationalRadarCard.tsx`, `ProductionPortfolioMix.tsx` | Antrean produksi dan radar deadline |
