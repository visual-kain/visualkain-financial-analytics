import { describe, it, expect } from 'vitest';
import {
  KERJASAMA_DEFAULT_TEXT,
  addPenawaranItem,
  buildKerjasamaCreatePayload,
  buildKerjasamaUpdatePayload,
  buildPenawaranCreatePayload,
  buildPenawaranUpdatePayload,
  defaultKerjasamaForm,
  defaultPenawaranForm,
  defaultPenawaranItems,
  filterLetterRows,
  kerjasamaDocToForm,
  kerjasamaToRow,
  letterYears,
  normalizeKerjasamaDoc,
  normalizePenawaranDoc,
  omitUndefined,
  penawaranDocToForm,
  penawaranToRow,
  removePenawaranItem,
  renderLetterHtml,
  sanitizeLetterHtml,
  sortLetterRows,
  todayIso,
  updatePenawaranItem,
  validateKerjasamaForm,
  validatePenawaranForm,
  type LetterRow,
} from './letters';

const author = { name: 'Raja', email: 'raja@visualkain.id' };

describe('sanitizeLetterHtml', () => {
  it('mempertahankan tag teks dasar tanpa atribut', () => {
    const html = '<p>Halo <b>tebal</b> <strong>kuat</strong> <i>miring</i> <em>em</em> <u>garis</u><br><span>span</span></p>';
    expect(sanitizeLetterHtml(html)).toBe(html);
  });

  it('mempertahankan daftar', () => {
    expect(sanitizeLetterHtml('<ul><li>satu</li><li>dua</li></ul><ol><li>x</li></ol>')).toBe(
      '<ul><li>satu</li><li>dua</li></ul><ol><li>x</li></ol>'
    );
  });

  it('membuang semua atribut dari tag yang diizinkan', () => {
    expect(sanitizeLetterHtml('<b onclick="alert(1)" style="color:red">x</b>')).toBe('<b>x</b>');
    expect(sanitizeLetterHtml('<span class="a" id="b">x</span>')).toBe('<span>x</span>');
  });

  it('membuang script beserta isinya', () => {
    expect(sanitizeLetterHtml('a<script>alert(1)</script>b')).toBe('ab');
    expect(sanitizeLetterHtml('a<SCRIPT src="x"></SCRIPT>b')).toBe('ab');
    expect(sanitizeLetterHtml('a<style>body{display:none}</style>b')).toBe('ab');
  });

  it('membuang tag berbahaya tetapi menyisakan teks di dalamnya', () => {
    expect(sanitizeLetterHtml('<img src=x onerror="alert(1)">teks')).toBe('teks');
    expect(sanitizeLetterHtml('<a href="javascript:alert(1)">klik</a>')).toBe('klik');
    expect(sanitizeLetterHtml('<div><h1>judul</h1></div>')).toBe('judul');
  });

  it('meng-escape tag yang tidak lengkap sebagai teks', () => {
    expect(sanitizeLetterHtml('<img src=x onerror=alert(1)')).toBe('&lt;img src=x onerror=alert(1)');
    expect(sanitizeLetterHtml('1 < 2 > 0')).toBe('1 &lt; 2 &gt; 0');
  });

  it('meng-escape ampersand liar tetapi mempertahankan entitas yang sah', () => {
    expect(sanitizeLetterHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(sanitizeLetterHtml('A &amp; B &nbsp; C &#39;')).toBe('A &amp; B &nbsp; C &#39;');
  });

  it('membuang komentar HTML', () => {
    expect(sanitizeLetterHtml('a<!-- <script>x</script> -->b')).toBe('ab');
  });

  it('menutup tag yang belum ditutup dan membuang penutup yatim', () => {
    expect(sanitizeLetterHtml('<b>tebal')).toBe('<b>tebal</b>');
    expect(sanitizeLetterHtml('teks</b>')).toBe('teks');
    expect(sanitizeLetterHtml('<b><i>x</b>y')).toBe('<b><i>x</i></b>y');
  });

  it('menormalkan br dalam berbagai bentuk menjadi <br>', () => {
    expect(sanitizeLetterHtml('a<br/>b<br />c<BR>d')).toBe('a<br>b<br>c<br>d');
  });

  it('tidak meloloskan tag lewat huruf besar atau spasi tambahan', () => {
    expect(sanitizeLetterHtml('<B >x</B >')).toBe('<b>x</b>');
    expect(sanitizeLetterHtml('<scr<script>ipt>alert(1)</scr</script>ipt>')).not.toMatch(/<script/i);
  });
});

describe('renderLetterHtml', () => {
  it('mengubah baris baru biasa menjadi <br>', () => {
    expect(renderLetterHtml('baris satu\nbaris dua')).toBe('baris satu<br>baris dua');
  });

  it('baris kosong menjadi dua <br> (jarak antar paragraf)', () => {
    expect(renderLetterHtml('a\n\nb')).toBe('a<br><br>b');
  });

  it('mengenali CRLF', () => {
    expect(renderLetterHtml('a\r\nb')).toBe('a<br>b');
  });

  it('tidak menyisipkan <br> di sekitar tag blok daftar', () => {
    expect(renderLetterHtml('<ul>\n<li>satu</li>\n<li>dua</li>\n</ul>')).toBe('<ul><li>satu</li><li>dua</li></ul>');
  });

  it('memangkas baris kosong di awal dan akhir', () => {
    expect(renderLetterHtml('\n\nisi\n\n')).toBe('isi');
  });

  it('mengembalikan string kosong untuk input kosong sehingga kertas memakai tanda "-"', () => {
    expect(renderLetterHtml('')).toBe('');
    expect(renderLetterHtml('  \n ')).toBe('');
    expect(renderLetterHtml(undefined)).toBe('');
    expect(renderLetterHtml(null)).toBe('');
  });

  it('menyanitasi sebelum merender', () => {
    expect(renderLetterHtml('ok\n<script>alert(1)</script><b>x</b>')).toBe('ok<br><b>x</b>');
  });

  it('teks standar kerjasama menjadi <br> dan tetap memuat tag tebal', () => {
    const html = renderLetterHtml(KERJASAMA_DEFAULT_TEXT.keunggulan);
    expect(html.startsWith('<strong>Keunggulan VisualKain:</strong><br>')).toBe(true);
    expect(html).not.toContain('\n');
  });
});

describe('teks standar kerjasama', () => {
  it('paragraf pembuka tidak lagi mengulang "Dengan hormat," karena kertas sudah mencetaknya', () => {
    expect(KERJASAMA_DEFAULT_TEXT.pembuka.toLowerCase()).not.toContain('dengan hormat');
    expect(KERJASAMA_DEFAULT_TEXT.pembuka).toContain('<strong>VisualKain</strong>');
  });

  it('keempat paragraf terisi', () => {
    Object.values(KERJASAMA_DEFAULT_TEXT).forEach((text) => expect(text.trim().length).toBeGreaterThan(20));
  });
});

describe('todayIso', () => {
  it('memakai tanggal lokal, bukan UTC', () => {
    // 00:30 WIB sudah tanggal 17 walau UTC masih tanggal 16.
    expect(todayIso(new Date(2026, 9, 17, 0, 30))).toBe('2026-10-17');
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('default form', () => {
  const now = new Date(2026, 9, 17, 10, 0);

  it('kerjasama: nomor kosong, lampiran dan "Di Tempat" mengikuti legacy', () => {
    const form = defaultKerjasamaForm(now);
    expect(form.noSurat).toBe('');
    expect(form.tanggal).toBe('2026-10-17');
    expect(form.lampiran).toBe('Company Profile & Portofolio');
    expect(form.diTempat).toBe('Di Tempat');
    expect(form.perihal).toBe('');
    expect(form.pembuka).toBe(KERJASAMA_DEFAULT_TEXT.pembuka);
  });

  it('penawaran: nomor kosong dan mulai dengan 3 baris item satuan pcs', () => {
    const form = defaultPenawaranForm(now);
    expect(form.noPenawaran).toBe('');
    expect(form.tanggal).toBe('2026-10-17');
    const items = defaultPenawaranItems();
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.no)).toEqual([1, 2, 3]);
    items.forEach((i) => expect(i).toMatchObject({ desc: '', qty: 0, satuan: 'pcs', harga: 0, jumlah: 0 }));
  });
});

describe('item penawaran', () => {
  it('jumlah = qty x harga saat qty atau harga diubah', () => {
    let items = defaultPenawaranItems();
    items = updatePenawaranItem(items, 0, 'qty', 12);
    items = updatePenawaranItem(items, 0, 'harga', 85000);
    expect(items[0].jumlah).toBe(1_020_000);
    expect(items[1].jumlah).toBe(0);
  });

  it('mengubah deskripsi atau satuan tidak mengubah jumlah', () => {
    let items = updatePenawaranItem(defaultPenawaranItems(), 0, 'qty', 2);
    items = updatePenawaranItem(items, 0, 'harga', 1000);
    items = updatePenawaranItem(items, 0, 'desc', 'Kaos');
    items = updatePenawaranItem(items, 0, 'satuan', 'lusin');
    expect(items[0]).toMatchObject({ desc: 'Kaos', satuan: 'lusin', jumlah: 2000 });
  });

  it('update tidak memutasi array asal', () => {
    const items = defaultPenawaranItems();
    updatePenawaranItem(items, 0, 'qty', 5);
    expect(items[0].qty).toBe(0);
  });

  it('menambah baris dengan nomor berurutan dan satuan pcs', () => {
    const items = addPenawaranItem(defaultPenawaranItems());
    expect(items).toHaveLength(4);
    expect(items[3]).toEqual({ no: 4, desc: '', qty: 0, satuan: 'pcs', harga: 0, jumlah: 0 });
  });

  it('menghapus baris lalu menomori ulang', () => {
    let items = defaultPenawaranItems();
    items = updatePenawaranItem(items, 2, 'desc', 'Tersisa');
    items = removePenawaranItem(items, 0);
    expect(items.map((i) => i.no)).toEqual([1, 2]);
    expect(items[1].desc).toBe('Tersisa');
  });

  it('menolak menghapus baris terakhir', () => {
    const one = [{ no: 1, desc: 'a', qty: 1, satuan: 'pcs', harga: 1, jumlah: 1 }];
    expect(removePenawaranItem(one, 0)).toBe(one);
  });
});

describe('validasi', () => {
  const kerjasama = { ...defaultKerjasamaForm(new Date(2026, 9, 17)), perihal: 'Pengajuan', perusahaan: 'PT Maju' };
  const penawaran = { ...defaultPenawaranForm(new Date(2026, 9, 17)), perihal: 'Seragam', perusahaan: 'PT Maju' };

  it('kerjasama lolos bila tanggal, perihal, dan perusahaan terisi', () => {
    expect(validateKerjasamaForm(kerjasama)).toBeNull();
  });

  it('kerjasama menolak perihal, perusahaan, atau tanggal kosong dengan pesan berbahasa Indonesia', () => {
    expect(validateKerjasamaForm({ ...kerjasama, perihal: '  ' })).toBe('Isi perihal surat sebelum menyimpan.');
    expect(validateKerjasamaForm({ ...kerjasama, perusahaan: '' })).toBe('Isi nama perusahaan tujuan sebelum menyimpan.');
    expect(validateKerjasamaForm({ ...kerjasama, tanggal: '' })).toBe('Isi tanggal surat sebelum menyimpan.');
  });

  it('penawaran memakai aturan yang sama', () => {
    expect(validatePenawaranForm(penawaran)).toBeNull();
    expect(validatePenawaranForm({ ...penawaran, perihal: '' })).toBe('Isi perihal penawaran sebelum menyimpan.');
    expect(validatePenawaranForm({ ...penawaran, perusahaan: '' })).toBe('Isi nama perusahaan tujuan sebelum menyimpan.');
    expect(validatePenawaranForm({ ...penawaran, tanggal: '' })).toBe('Isi tanggal penawaran sebelum menyimpan.');
  });
});

describe('payload kerjasama', () => {
  const form = {
    ...defaultKerjasamaForm(new Date(2026, 9, 17)),
    perihal: '  Pengajuan Kerjasama ',
    perusahaan: ' PT Maju ',
    divisi: 'HRD',
    alamat: 'Jl. Merdeka 1',
  };
  const reserved = { nomor: 'SK-VK-2026-003', urut: 3, tahun: 2026 };

  it('membuat dokumen baru dengan nomor, tahun, urut, dan pembuat sesuai design 2.3', () => {
    const payload = buildKerjasamaCreatePayload(form, reserved, author);
    expect(payload).toMatchObject({
      noSurat: 'SK-VK-2026-003',
      tahun: 2026,
      urut: 3,
      tanggal: '2026-10-17',
      lampiran: 'Company Profile & Portofolio',
      perihal: 'Pengajuan Kerjasama',
      kepadaNama: 'PT Maju',
      kepadaJabatan: 'HRD',
      kepadaAlamat: 'Jl. Merdeka 1',
      kepadaTempat: 'Di Tempat',
      paragrafPembuka: KERJASAMA_DEFAULT_TEXT.pembuka,
      paragrafProfil: KERJASAMA_DEFAULT_TEXT.profil,
      paragrafKeunggulan: KERJASAMA_DEFAULT_TEXT.keunggulan,
      paragrafPenutup: KERJASAMA_DEFAULT_TEXT.penutup,
      createdBy: 'Raja',
      createdByEmail: 'raja@visualkain.id',
    });
  });

  it('tidak pernah memuat nilai undefined', () => {
    const payload = buildKerjasamaCreatePayload(form, reserved, { name: '', email: '' });
    expect(Object.values(payload).every((v) => v !== undefined)).toBe(true);
  });

  it('payload update hanya memuat isi surat, tidak menyentuh nomor, tahun, urut, atau pembuat', () => {
    const payload = buildKerjasamaUpdatePayload({ ...form, noSurat: 'SK-VK-2026-003' });
    expect(payload).not.toHaveProperty('noSurat');
    expect(payload).not.toHaveProperty('tahun');
    expect(payload).not.toHaveProperty('urut');
    expect(payload).not.toHaveProperty('createdBy');
    expect(payload).not.toHaveProperty('createdAt');
    expect(payload.perihal).toBe('Pengajuan Kerjasama');
    expect(payload.kepadaNama).toBe('PT Maju');
  });
});

describe('payload penawaran', () => {
  const form = {
    ...defaultPenawaranForm(new Date(2026, 9, 17)),
    perihal: 'Seragam Kantor',
    perusahaan: 'PT Maju',
    cp: 'Bu Sari',
    alamat: 'Jl. Merdeka 1',
    telpEmail: '0812',
    catatan: 'DP 50%',
  };
  const reserved = { nomor: 'PH-VK-2026-012', urut: 12, tahun: 2026 };

  it('menyimpan item tanpa field no dan menghitung ulang jumlah', () => {
    let items = defaultPenawaranItems();
    items = updatePenawaranItem(items, 0, 'desc', ' Kaos Polo ');
    items = updatePenawaranItem(items, 0, 'qty', 10);
    items = updatePenawaranItem(items, 0, 'harga', 90000);
    const payload = buildPenawaranCreatePayload(form, items, reserved, author);
    expect(payload.items[0]).toEqual({ desc: 'Kaos Polo', qty: 10, satuan: 'pcs', harga: 90000, jumlah: 900000 });
    expect(payload.items[0]).not.toHaveProperty('no');
    expect(payload.items).toHaveLength(3);
  });

  it('memetakan field form ke nama field koleksi', () => {
    const payload = buildPenawaranCreatePayload(form, defaultPenawaranItems(), reserved, author);
    expect(payload).toMatchObject({
      noPenawaran: 'PH-VK-2026-012',
      tahun: 2026,
      urut: 12,
      tanggal: '2026-10-17',
      perihal: 'Seragam Kantor',
      namaPerusahaan: 'PT Maju',
      contactPerson: 'Bu Sari',
      alamat: 'Jl. Merdeka 1',
      telepon: '0812',
      catatan: 'DP 50%',
      createdBy: 'Raja',
      createdByEmail: 'raja@visualkain.id',
    });
  });

  it('mengganti angka tidak valid (NaN, negatif, Infinity) dengan 0 sehingga Firestore tidak menolak', () => {
    const items = [{ no: 1, desc: 'x', qty: Number.NaN, satuan: 'pcs', harga: -5, jumlah: Number.POSITIVE_INFINITY }];
    const payload = buildPenawaranUpdatePayload(form, items);
    expect(payload.items[0]).toEqual({ desc: 'x', qty: 0, satuan: 'pcs', harga: 0, jumlah: 0 });
  });

  it('payload update tidak memuat nomor, tahun, urut, atau pembuat', () => {
    const payload = buildPenawaranUpdatePayload(form, defaultPenawaranItems());
    ['noPenawaran', 'tahun', 'urut', 'createdBy', 'createdAt'].forEach((key) => expect(payload).not.toHaveProperty(key));
    expect(Object.values(payload).every((v) => v !== undefined)).toBe(true);
  });
});

describe('omitUndefined', () => {
  it('membuang undefined di semua kedalaman, termasuk di dalam array', () => {
    const cleaned = omitUndefined({ a: 1, b: undefined, c: { d: undefined, e: 'x' }, f: [{ g: undefined, h: 2 }] });
    expect(cleaned).toEqual({ a: 1, c: { e: 'x' }, f: [{ h: 2 }] });
    expect('b' in cleaned).toBe(false);
  });

  it('mempertahankan null, nol, string kosong, dan false', () => {
    expect(omitUndefined({ a: null, b: 0, c: '', d: false })).toEqual({ a: null, b: 0, c: '', d: false });
  });

  it('tidak merusak objek bukan polos seperti Date', () => {
    const date = new Date(2026, 0, 1);
    expect(omitUndefined({ when: date }).when).toBe(date);
  });
});

describe('normalisasi dokumen Firestore', () => {
  it('kerjasama: field hilang menjadi string kosong, tahun dan urut diturunkan dari nomor atau tanggal', () => {
    const doc = normalizeKerjasamaDoc('abc', { noSurat: 'SK-VK-2026-001', tanggal: '2026-03-02', perihal: 'P' });
    expect(doc).toMatchObject({
      id: 'abc',
      noSurat: 'SK-VK-2026-001',
      tahun: 2026,
      urut: 1,
      tanggal: '2026-03-02',
      perihal: 'P',
      kepadaNama: '',
      paragrafPembuka: '',
      createdBy: '',
    });
  });

  it('kerjasama: round trip dokumen ke form mempertahankan isi dan nomor', () => {
    const payload = buildKerjasamaCreatePayload(
      { ...defaultKerjasamaForm(new Date(2026, 9, 17)), perihal: 'P', perusahaan: 'PT A', divisi: 'GM', alamat: 'Jl X' },
      { nomor: 'SK-VK-2026-005', urut: 5, tahun: 2026 },
      author
    );
    const form = kerjasamaDocToForm(normalizeKerjasamaDoc('id1', { ...payload }));
    expect(form).toMatchObject({
      noSurat: 'SK-VK-2026-005',
      tanggal: '2026-10-17',
      perihal: 'P',
      perusahaan: 'PT A',
      divisi: 'GM',
      alamat: 'Jl X',
      diTempat: 'Di Tempat',
      pembuka: KERJASAMA_DEFAULT_TEXT.pembuka,
    });
  });

  it('penawaran: item kosong atau tidak valid menjadi daftar dengan satu baris default', () => {
    const doc = normalizePenawaranDoc('p1', { noPenawaran: 'PH-VK-2026-001', tanggal: '2026-10-01', items: 'bukan array' });
    expect(doc.items).toEqual([]);
    const { items } = penawaranDocToForm(doc);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ no: 1, satuan: 'pcs', qty: 0 });
  });

  it('penawaran: round trip menambahkan kembali nomor urut baris', () => {
    let items = defaultPenawaranItems();
    items = updatePenawaranItem(items, 1, 'desc', 'Jaket');
    items = updatePenawaranItem(items, 1, 'qty', 3);
    items = updatePenawaranItem(items, 1, 'harga', 200000);
    const payload = buildPenawaranCreatePayload(
      { ...defaultPenawaranForm(new Date(2026, 9, 17)), perihal: 'P', perusahaan: 'PT A', cp: 'Budi', telpEmail: 'a@b.c' },
      items,
      { nomor: 'PH-VK-2026-002', urut: 2, tahun: 2026 },
      author
    );
    const loaded = penawaranDocToForm(normalizePenawaranDoc('p2', { ...payload }));
    expect(loaded.form).toMatchObject({ noPenawaran: 'PH-VK-2026-002', perusahaan: 'PT A', cp: 'Budi', telpEmail: 'a@b.c' });
    expect(loaded.items.map((i) => i.no)).toEqual([1, 2, 3]);
    expect(loaded.items[1]).toMatchObject({ desc: 'Jaket', qty: 3, harga: 200000, jumlah: 600000 });
  });
});

describe('daftar surat', () => {
  const rows: LetterRow[] = [
    { id: 'a', nomor: 'SK-VK-2026-002', tanggal: '2026-10-05', perihal: 'Pengajuan Seragam', perusahaan: 'PT Maju Jaya', createdBy: 'Raja', tahun: 2026, urut: 2 },
    { id: 'b', nomor: 'SK-VK-2026-001', tanggal: '2026-09-01', perihal: 'Kerjasama Kaos', perusahaan: 'CV Sinar', createdBy: '', tahun: 2026, urut: 1 },
    { id: 'c', nomor: 'SK-VK-2025-010', tanggal: '2025-12-20', perihal: 'Pengajuan Jaket', perusahaan: 'PT Maju Jaya', createdBy: 'Budi', tahun: 2025, urut: 10 },
  ];

  it('daftar tahun unik, terbaru dulu', () => {
    expect(letterYears(rows)).toEqual([2026, 2025]);
    expect(letterYears([])).toEqual([]);
  });

  it('tanpa filter mengembalikan semua baris', () => {
    expect(filterLetterRows(rows, { year: 'all', query: '' })).toHaveLength(3);
  });

  it('filter tahun', () => {
    expect(filterLetterRows(rows, { year: 2025, query: '' }).map((r) => r.id)).toEqual(['c']);
  });

  it('cari berdasarkan nomor, perihal, dan nama perusahaan tanpa peduli huruf besar', () => {
    expect(filterLetterRows(rows, { year: 'all', query: 'sk-vk-2026-001' }).map((r) => r.id)).toEqual(['b']);
    expect(filterLetterRows(rows, { year: 'all', query: 'KAOS' }).map((r) => r.id)).toEqual(['b']);
    expect(filterLetterRows(rows, { year: 'all', query: 'maju jaya' }).map((r) => r.id)).toEqual(['a', 'c']);
  });

  it('pencarian tidak mencocokkan kolom lain seperti pembuat', () => {
    expect(filterLetterRows(rows, { year: 'all', query: 'raja' })).toEqual([]);
  });

  it('filter tahun dan pencarian bekerja bersama', () => {
    expect(filterLetterRows(rows, { year: 2026, query: 'pengajuan' }).map((r) => r.id)).toEqual(['a']);
  });

  it('spasi di tepi pencarian diabaikan', () => {
    expect(filterLetterRows(rows, { year: 'all', query: '  sinar ' }).map((r) => r.id)).toEqual(['b']);
  });

  it('urut dari tahun dan nomor terbaru', () => {
    expect(sortLetterRows([rows[2], rows[1], rows[0]]).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('memetakan dokumen kerjasama dan penawaran ke baris daftar', () => {
    const ks = normalizeKerjasamaDoc('k1', {
      noSurat: 'SK-VK-2026-004',
      tahun: 2026,
      urut: 4,
      tanggal: '2026-10-10',
      perihal: 'Perihal',
      kepadaNama: 'PT Satu',
      createdBy: 'Raja',
    });
    expect(kerjasamaToRow(ks)).toEqual({
      id: 'k1',
      nomor: 'SK-VK-2026-004',
      tanggal: '2026-10-10',
      perihal: 'Perihal',
      perusahaan: 'PT Satu',
      createdBy: 'Raja',
      tahun: 2026,
      urut: 4,
    });
    const ph = normalizePenawaranDoc('p1', {
      noPenawaran: 'PH-VK-2026-009',
      tahun: 2026,
      urut: 9,
      tanggal: '2026-10-11',
      perihal: 'Harga',
      namaPerusahaan: 'PT Dua',
    });
    expect(penawaranToRow(ph)).toMatchObject({ id: 'p1', nomor: 'PH-VK-2026-009', perusahaan: 'PT Dua', createdBy: '' });
  });
});
