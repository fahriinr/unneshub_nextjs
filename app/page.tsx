"use client";

import Link from "next/link";
import { useUserSession } from "./hooks/useUserSession";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";

const AVATAR_COLORS = [
  "avatar-bg-0",
  "avatar-bg-1",
  "avatar-bg-2",
  "avatar-bg-3",
  "avatar-bg-4",
  "avatar-bg-5",
];

interface CommunityItem {
  id: string;
  name: string;
  category: string;
  description: string;
  membersCount: number;
  role?: "Admin" | "Anggota";
  initials: string;
}

// Mock data — user's joined communities
const MY_COMMUNITIES: CommunityItem[] = [
  {
    id: "1",
    name: "Teknik Informatika",
    category: "AKADEMIK",
    description: "Komunitas mahasiswa Teknik Informatika UNNES.",
    membersCount: 150,
    role: "Admin",
    initials: "TI",
  },
  {
    id: "2",
    name: "Robotika",
    category: "HOBI",
    description: "Komunitas pecinta robotika dan IoT UNNES.",
    membersCount: 60,
    role: "Anggota",
    initials: "R",
  },
  {
    id: "3",
    name: "English Club",
    category: "AKADEMIK",
    description: "Komunitas belajar bahasa Inggris UNNES.",
    membersCount: 75,
    role: "Anggota",
    initials: "EC",
  },
  {
    id: "4",
    name: "Swimming Club",
    category: "HOBI",
    description: "Komunitas renang mahasiswa UNNES.",
    membersCount: 30,
    role: "Anggota",
    initials: "SC",
  },
];

export default function Home() {
  const { user, loading } = useUserSession();
  const [mounted, setMounted] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch session from Better Auth
  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setSessionUser({
            name: session.data.user.name,
            email: session.data.user.email,
          });
        }
      } catch {
        // Session fetch failed — will fall back to localStorage user
      }
    }
    if (mounted) fetchSession();
  }, [mounted]);

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
        {/* Decorative shapes */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-44 h-44 rounded-full border-4 border-dashed border-white"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 border-4 border-white rotate-45"></div>
        </div>

        {/* Hero Card */}
        <div className="w-full max-w-2xl bg-white border-2.5 border-[#0A1D37] rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_#F4C41B] text-center relative z-10">
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="neo-button-yellow w-full sm:w-44 py-3 text-sm font-black">
              Masuk Sekarang
            </Link>
            <Link href="/signup" className="neo-button-white w-full sm:w-44 py-3 text-sm font-black">
              Daftar Akun
            </Link>
          </div>

          <p className="text-[10px] font-extrabold text-red-600 mt-6 bg-red-50 border border-red-300 rounded px-3 py-1.5 inline-block">
            ⚠️ Login & pendaftaran memerlukan email institusi aktif: @students.unnes.ac.id
          </p>
        </div>
      </div>
    );
  }

  // Determine display name — prefer Better Auth session, fallback to localStorage
  const displayName = sessionUser?.name || user.name;
  const firstName = displayName.split(" ")[0];

  // LOGGED IN MOBILE-FIRST HOME VIEW
  return (
    <div className="flex-1 w-full mx-auto bg-[#FDFBF7] flex flex-col">
      {/* Header Section */}
      <div className="px-4 pt-6 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight">
              Halo, {firstName}!
            </h2>
            <p className="text-sm font-semibold text-text-muted mt-1">
              Selamat datang di komunitas kampus UNNES
            </p>
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-full border-2 border-primary-dark bg-amber-50 flex items-center justify-center shadow-[2px_2px_0px_0px_var(--color-primary-dark)] hover:translate-y-[-1px] transition-all flex-shrink-0">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="font-bold text-sm text-primary-dark">{displayName.charAt(0)}</span>
            )}
          </Link>
        </div>
      </div>

      {/* Category Tab */}
      <div className="px-4 max-w-6xl mx-auto w-full">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <span className="neo-badge-yellow text-xs whitespace-nowrap cursor-pointer">KOMUNITASMU</span>
        </div>
      </div>

      {/* Community List */}
      <div className="flex-1 px-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-3">
          {MY_COMMUNITIES.map((community, idx) => (
            <Link
              key={community.id}
              href={`/community/${community.id}`}
              className="flex items-center gap-3 bg-white border-2 border-primary-dark rounded-xl p-3.5 shadow-[3px_3px_0px_0px_var(--color-primary-dark)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--color-primary-dark)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_var(--color-primary-dark)] transition-all animate-fade-in-up"
              style={{ animationDelay: `${idx * 60}ms` }}
              id={`community-card-${community.id}`}
            >
              {/* Community Avatar */}
              <div className={`w-12 h-12 rounded-xl ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0 border-2 border-primary-dark shadow-[2px_2px_0px_0px_var(--color-primary-dark)]`}>
                <span className="font-black text-sm">{community.initials}</span>
              </div>

              {/* Community Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-sm text-primary-dark truncate">{community.name}</h3>
                <p className="text-[11px] font-semibold text-text-muted">{community.membersCount} anggota</p>
              </div>

              {/* Role Badge */}
              {community.role && (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex-shrink-0 ${
                  community.role === "Admin"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}>
                  {community.role}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Explore More */}
        <div className="mt-6 mb-8">
          <Link
            href="/community/join"
            className="neo-button-white w-full py-3 text-xs font-black"
          >
            🔍 Jelajahi & Join Komunitas Lainnya
          </Link>
        </div>
      </div>
    </div>
  );
}
