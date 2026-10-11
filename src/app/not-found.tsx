import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8ECF2] p-6 text-center text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card-double max-w-md w-full">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Halaman Tidak Ditemukan</h2>
        <p className="mt-2 text-xs text-slate-500">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan ke direktori lain.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 transition-all"
        >
          Kembali ke Dashboard Finansial
        </Link>
      </div>
    </div>
  );
}
