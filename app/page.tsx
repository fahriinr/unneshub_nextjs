"use client";

import Link from "next/link";
import { useUserSession } from "./hooks/useUserSession";
import { useEffect, useState } from "react";

const CATEGORIES = ["AKADEMIK", "HOBI", "KARIR", "ORGANISASI", "EVENT"];

interface CommunityItem {
  id: string;
  name: string;
  category: string;
  description: string;
  membersCount: number;
}

const POPULAR_COMMUNITIES: CommunityItem[] = [
  {
    id: "1",
    name: "HIMA Sistem Informasi",
    category: "ORGANISASI",
    description: "Wadah aspirasi dan kreasi mahasiswa Sistem Informasi Universitas Negeri Semarang.",
    membersCount: 142,
  },
  {
    id: "2",
    name: "UKM Robotika UNNES",
    category: "HOBI",
    description: "Komunitas pecinta robotika, mikrokontroler, dan Internet of Things (IoT) UNNES.",
    membersCount: 88,
  },
  {
    id: "3",
    name: "Unnes Developer Student Club",
    category: "KARIR",
    description: "Komunitas belajar pemrograman dan pengembangan perangkat lunak mahasiswa UNNES.",
    membersCount: 204,
  },
  {
    id: "4",
    name: "BEM FMIPA UNNES",
    category: "ORGANISASI",
    description: "Badan Eksekutif Mahasiswa Fakultas Matematika dan Ilmu Pengetahuan Alam.",
    membersCount: 312,
  },
];

export default function Home() {
  const { user, loading } = useUserSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="text-center font-bold text-primary-dark">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-primary-dark" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat halaman...
        </div>
      </div>
    );
  }

  // GUEST LANDING VIEW
  if (!user || !user.isLoggedIn) {
    return (
      <div className="flex-1 bg-[#0A1D37] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Subtle decorative grid/background shapes */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-44 h-44 rounded-full border-4 border-dashed border-white"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 border-4 border-white rotate-45"></div>
        </div>

        {/* Hero Card */}
        <div className="w-full max-w-2xl bg-white border-2.5 border-[#0A1D37] rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_#F4C41B] text-center relative z-10">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-[#0A1D37] border-2 border-primary-dark flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_#F4C41B]">
            <svg viewBox="0 0 100 100" className="w-14 h-14">
              <path d="M25 20 C 25 20, 25 70, 50 85 C 75 70, 75 20, 75 20 L 50 15 Z" fill="#F4C41B" stroke="#0A1D37" strokeWidth="6" />
              <circle cx="50" cy="50" r="16" fill="#0A1D37" />
              <path d="M50 65 L 50 40 M50 45 C 50 45, 42 35, 42 45 C 42 55, 50 50, 50 50 M50 48 C 50 48, 58 38, 58 48 C 58 58, 50 53, 50 53" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
              <circle cx="50" cy="35" r="3" fill="#22C55E" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-primary-dark tracking-tight leading-none mb-3">
            Unnes<span className="text-[#F4C41B] bg-[#0A1D37] px-2 py-0.5 rounded border border-primary-dark shadow-[2.5px_2.5px_0px_0px_#0A1D37] inline-block ml-1">Hub</span>
          </h1>
          
          <p className="text-base md:text-lg font-black text-primary-dark uppercase tracking-wider mb-6">
            Exclusive Community Platform Mahasiswa UNNES
          </p>

          <p className="text-sm font-semibold text-text-muted max-w-lg mx-auto leading-relaxed mb-8">
            Wadah terpusat, aman, dan eksklusif untuk berinteraksi, berkolaborasi, berdiskusi akademik, serta membangun karir bersama mahasiswa Universitas Negeri Semarang.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="neo-button-yellow w-full sm:w-44 py-3 text-sm font-black"
            >
              Masuk Sekarang
            </Link>
            
            <Link
              href="/signup"
              className="neo-button-white w-full sm:w-44 py-3 text-sm font-black"
            >
              Daftar Akun
            </Link>
          </div>

          {/* Domain Validation Note */}
          <p className="text-[10px] font-extrabold text-red-600 mt-6 bg-red-50 border border-red-300 rounded px-3 py-1.5 inline-block">
            ⚠️ Login & pendaftaran memerlukan email institusi aktif: @students.unnes.ac.id
          </p>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD VIEW
  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 bg-[#FDFBF7] flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="neo-card-thick bg-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-text-muted">
            Selamat Datang Kembali,
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight">
            🎓 {user.name}
          </h2>
          <p className="text-xs font-bold text-text-muted">
            Fakultas: {user.fakultas} | NIM: {user.nim}
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/profile" className="neo-button-white px-5 py-2.5 text-xs font-black">
            👤 Edit Profil Saya
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left and Mid Column: Communities Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-center pb-2 border-b-2 border-primary-dark">
            <h3 className="text-xl font-black text-primary-dark tracking-tight">
              🏘️ Jelajahi Komunitas
            </h3>
            <span className="text-xs font-black uppercase tracking-wider text-text-muted">
              {POPULAR_COMMUNITIES.length} Tersedia
            </span>
          </div>

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {POPULAR_COMMUNITIES.map((c) => (
              <div key={c.id} className="neo-card bg-white p-5 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 rounded px-2 py-0.5">
                      {c.category}
                    </span>
                    <span className="text-[10px] font-extrabold text-text-muted">
                      👥 {c.membersCount} Anggota
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-primary-dark leading-tight line-clamp-1">
                    {c.name}
                  </h4>
                  <p className="text-xs font-semibold text-text-muted line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <Link
                  href={`/community/${c.id}`}
                  className="neo-button-yellow text-center py-2 text-xs font-black w-full"
                >
                  Kunjungi Komunitas
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Categories card */}
          <div className="neo-card bg-white p-5 flex flex-col gap-4">
            <h3 className="font-black text-sm text-primary-dark uppercase tracking-wider border-b-2 border-slate-100 pb-2">
              📌 Kategori Komunitas
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {CATEGORIES.map((cat) => (
                <span key={cat} className="neo-badge text-xs bg-white cursor-default">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Info card */}
          <div className="neo-card bg-amber-50 p-5 flex flex-col gap-3.5 border-2 border-primary-dark">
            <h3 className="font-black text-sm text-primary-dark uppercase tracking-wider border-b border-dashed border-primary-dark pb-2">
              📢 Informasi Platform
            </h3>
            <div className="flex flex-col gap-2.5 text-xs font-semibold text-primary-dark">
              <div className="flex gap-2">
                <span>🔐</span>
                <span>Validasi mahasiswa eksklusif menggunakan email Unnes.</span>
              </div>
              <div className="flex gap-2">
                <span>🕵️</span>
                <span>Dukungan post anonymous aman (real identity tersimpan & diawasi Global Admin).</span>
              </div>
              <div className="flex gap-2">
                <span>💼</span>
                <span>RBAC terintegrasi: Mahasiswa, Community Admin, Global Admin.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
