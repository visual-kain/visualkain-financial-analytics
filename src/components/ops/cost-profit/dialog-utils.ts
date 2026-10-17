import type React from 'react';

/**
 * Radix memanggil preventDefault saat Esc menutup dropdown CustomSelect, tetapi Modal mendengarkan Esc di window
 * dan ikut menutup dialog. Event dihentikan di sini (React sampai lebih dulu dari window) agar isian form tidak hilang.
 */
export function keepDialogOpenWhenSelectEscapes(e: React.KeyboardEvent) {
  if (e.key === 'Escape' && e.defaultPrevented) e.stopPropagation();
}
