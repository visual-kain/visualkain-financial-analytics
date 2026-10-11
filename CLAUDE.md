@AGENTS.md

# Claude Code & Antigravity Adapter

- Selalu baca dan patuhi kontrak operasional `AGENTS.md`.
- Perlakukan artefak repositori sebagai sumber kebenaran (source of truth) utama; hindari asumsi yang tidak tercatat dalam file desain `docs/specs/design.md`.
- Setiap kali menambahkan fitur kalkulasi finansial, jalankan `npm run test` (Vitest) untuk memastikan non-regresi matematis akuntansi.
- Gunakan font monospaced `font-mono` (`JetBrains Mono`) untuk seluruh nilai nominal Rupiah dan angka tabular.
- Komponen visualisasi grafik menggunakan `recharts` dengan fallback shimmer skeleton saat pemuatan data.
