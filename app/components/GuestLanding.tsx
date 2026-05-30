import Link from "next/link";

export default function GuestLanding() {
  return (
    <div className="flex-1 bg-[#0B1E36] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-44 h-44 rounded-full border border-dashed border-white"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 border border-white rotate-45"></div>
      </div>

      <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-[#0B1E36] flex items-center justify-center mx-auto mb-6 shadow-md p-1.5">
          <img src="/logo.png" alt="UnnesHub Logo" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-3xl font-extrabold text-[#0B1E36] tracking-tight mb-2">
          Unnes
          <span className="text-[#F2C010] bg-[#0B1E36] px-2 py-0.5 rounded shadow-sm inline-block ml-1">
            Hub
          </span>
        </h1>

        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-6">
          Exclusive Community Platform Mahasiswa UNNES
        </p>

        <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
          Wadah terpusat, aman, dan eksklusif untuk berinteraksi,
          berkolaborasi, berdiskusi akademik, serta membangun karir bersama
          mahasiswa Universitas Negeri Semarang.
        </p>

        <div className="flex flex-col gap-3 justify-center items-center">
          <Link
            href="/login"
            className="w-full py-3 bg-[#F2C010] text-[#0B1E36] font-extrabold text-xs rounded-full hover:bg-[#d9a807] transition-colors shadow-md text-center"
          >
            Masuk Sekarang
          </Link>
          <Link
            href="/signup"
            className="w-full py-3 bg-white border border-slate-200 text-[#0B1E36] font-extrabold text-xs rounded-full hover:bg-slate-50 transition-colors shadow-sm text-center"
          >
            Daftar Akun
          </Link>
        </div>

        <p className="text-[9px] font-bold text-red-600 mt-6 bg-red-50 border border-red-200 rounded-xl px-4 py-2 inline-block">
          ⚠️ Login & pendaftaran memerlukan email institusi aktif:
          @students.unnes.ac.id
        </p>
      </div>
    </div>
  );
}
