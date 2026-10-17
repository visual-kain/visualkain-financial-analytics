import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { defaultKerjasamaForm } from '@/lib/letters';
import { KerjasamaPaper } from './KerjasamaPaper';
import { PenawaranPaper } from './PenawaranPaper';

afterEach(cleanup);

const base = { ...defaultKerjasamaForm(new Date(2026, 9, 17)), noSurat: 'SK-VK-2026-001', perihal: 'Pengajuan', perusahaan: 'PT Maju' };

describe('KerjasamaPaper', () => {
  it('mempertahankan id dan kelas kertas legacy', () => {
    const { container } = render(<KerjasamaPaper formData={base} />);
    const paper = container.querySelector('#ksPaper');
    expect(paper).not.toBeNull();
    expect(paper?.classList.contains('letter-paper')).toBe(true);
    expect(container.querySelectorAll('.ks-paragraph')).toHaveLength(4);
  });

  it('mencetak "Dengan hormat," satu kali saja dengan teks standar', () => {
    const { container } = render(<KerjasamaPaper formData={base} />);
    const occurrences = (container.textContent ?? '').match(/Dengan hormat/gi) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it('baris baru dari textarea menjadi <br> di dalam paragraf', () => {
    const { container } = render(<KerjasamaPaper formData={{ ...base, keunggulan: 'Baris satu\nBaris dua' }} />);
    const paragraphs = container.querySelectorAll('.ks-paragraph');
    expect(paragraphs[2].innerHTML).toBe('Baris satu<br>Baris dua');
  });

  it('menyanitasi HTML tersimpan: script dan atribut berbahaya tidak sampai ke DOM', () => {
    const { container } = render(
      <KerjasamaPaper
        formData={{
          ...base,
          pembuka: 'Halo <script>window.__pwned = 1</script><img src=x onerror="window.__pwned = 2"> <b onclick="x()">tebal</b>',
        }}
      />
    );
    const first = container.querySelectorAll('.ks-paragraph')[0];
    expect(first.querySelector('script')).toBeNull();
    expect(first.querySelector('img')).toBeNull();
    expect(first.querySelector('b')?.getAttributeNames()).toEqual([]);
    expect(first.textContent).toContain('tebal');
  });

  it('paragraf kosong menampilkan tanda "-"', () => {
    const { container } = render(<KerjasamaPaper formData={{ ...base, penutup: '  ' }} />);
    expect(container.querySelectorAll('.ks-paragraph')[3].innerHTML).toBe('<p>-</p>');
  });

  it('teks pengguna di kepala surat di-escape oleh React', () => {
    const { container } = render(<KerjasamaPaper formData={{ ...base, perusahaan: '<b>PT</b>' }} />);
    expect(container.querySelector('.ph-kepada-nama')?.innerHTML).toBe('&lt;b&gt;PT&lt;/b&gt;');
  });
});

describe('PenawaranPaper', () => {
  const form = {
    noPenawaran: 'PH-VK-2026-001',
    tanggal: '2026-10-17',
    perihal: 'Seragam',
    perusahaan: 'PT Maju',
    cp: 'Bu Sari',
    alamat: 'Jl. A',
    telpEmail: '0812',
    catatan: 'DP 50%\n\nBerlaku 30 hari',
  };

  it('mempertahankan id dan merender item tanpa grand total', () => {
    const { container } = render(
      <PenawaranPaper
        formData={form}
        items={[
          { no: 1, desc: 'Kaos', qty: 10, satuan: 'pcs', harga: 90000, jumlah: 900000 },
          { no: 2, desc: '', qty: 0, satuan: 'pcs', harga: 0, jumlah: 0 },
        ]}
      />
    );
    expect(container.querySelector('#phPaper')).not.toBeNull();
    expect(container.querySelectorAll('.ph-items-print tbody tr')).toHaveLength(2);
    expect(container.textContent).not.toMatch(/grand total|subtotal|ppn/i);
  });

  it('catatan: baris kosong dibuang, tiap baris menjadi satu paragraf', () => {
    const { container } = render(<PenawaranPaper formData={form} items={[]} />);
    const lines = Array.from(container.querySelectorAll('.ph-catatan-box p')).map((p) => p.textContent);
    expect(lines).toEqual(['Catatan:', 'DP 50%', 'Berlaku 30 hari']);
    expect(container.textContent).toContain('Belum ada item');
  });
});
