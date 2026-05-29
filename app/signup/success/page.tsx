"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex-1 min-h-screen bg-[#0B1E36] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center animate-fade-in-up">
        {/* Logo */}
        <div className="w-24 h-24 mb-8">
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
            <circle cx="60" cy="60" r="56" fill="#F4C41B" stroke="#0A1D37" strokeWidth="4" />
            <path d="M35 30 C 35 30, 35 80, 60 95 C 85 80, 85 30, 85 30 L 60 24 Z" fill="#0A1D37" stroke="#F4C41B" strokeWidth="2" />
            <path d="M60 78 L 60 48 M60 54 C 60 54, 50 42, 50 54 C 50 66, 60 58, 60 58 M60 56 C 60 56, 70 44, 70 56 C 70 68, 60 60, 60 60" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="42" r="3.5" fill="#22C55E" />
          </svg>
        </div>

        <h1 className="text-xl font-extrabold text-white tracking-tight mb-2">UnnesHub</h1>
        <p className="text-sm font-semibold text-[#8FA0AF] mb-8">Selamat Datang di UnnesHub</p>

        {/* Success Message Card */}
        <div className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h2 className="text-lg font-extrabold text-white mb-2">
            Akun anda berhasil terdaftar.
          </h2>
          <p className="text-xs font-semibold text-[#8FA0AF] mb-6">
            Akun Anda telah aktif dan siap digunakan. Selamat bergabung!
          </p>

          <Link
            href="/"
            className="neo-button-yellow w-full py-3 text-sm font-black"
          >
            Mulai Sekarang
          </Link>

          <p className="text-[11px] font-semibold text-[#8FA0AF] mt-4">
            Otomatis dialihkan dalam {countdown} detik...
          </p>
        </div>
      </div>
    </div>
  );
}
