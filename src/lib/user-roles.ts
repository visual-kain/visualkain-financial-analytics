/**
 * Akun tim produksi didaftarkan lewat env `NEXT_PUBLIC_PRODUKSI_EMAILS` (email dipisah koma, tanpa password).
 * Akun ini tetap punya akses penuh; bedanya hanya halaman pertama setelah login adalah Ringkasan Produksi (K-30).
 */
export function parseEmailList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Dibaca langsung dengan nama lengkap supaya Next.js bisa menyisipkan nilainya ke bundle klien saat build.
const PRODUKSI_EMAILS = parseEmailList(process.env.NEXT_PUBLIC_PRODUKSI_EMAILS);

export function isProduksiEmail(email: string | null | undefined, list: readonly string[] = PRODUKSI_EMAILS): boolean {
  return !!email && list.includes(email.trim().toLowerCase());
}

export function homeRouteFor(email: string | null | undefined, list: readonly string[] = PRODUKSI_EMAILS): string {
  return isProduksiEmail(email, list) ? '/produksi' : '/';
}
