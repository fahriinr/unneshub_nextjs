"use client";

import Link from "next/link";
import { useUserSession } from "./hooks/useUserSession";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";

interface CommunityItem {
  id: string;
  name: string;
  category: string;
  description: string;
  membersCount: number;
  role: "Admin" | "Anggota";
  initials: string;
  avatarColor: string;
}

export default function Home() {
  const { user, loading } = useUserSession();
  const [mounted, setMounted] = useState(false);
  const [sessionUser, setSessionUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [myCommunities, setMyCommunities] = useState<CommunityItem[]>([]);

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
        // Fallback
      }
    }
    if (mounted) fetchSession();
  }, [mounted]);

  const isLoggedIn = (user && user.isLoggedIn) || !!sessionUser;

  // Fetch joined communities from database APIs
  useEffect(() => {
    async function fetchMyCommunities() {
      const activeEmail = sessionUser?.email || user?.email;
      if (!activeEmail) return;

      try {
        const res = await fetch("/api/communities");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped = await Promise.all(
              data.map(async (c: any) => {
                try {
                  const mRes = await fetch(`/api/communities/${c.id}/members`);
                  if (mRes.ok) {
                    const mData = await mRes.json();
                    const userMembership = mData.find(
                      (m: any) => m.user?.email === activeEmail,
                    );

                    if (userMembership) {
                      const initials = c.name
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);

                      const avatarColorMap: Record<string, string> = {
                        AKADEMIK: "bg-emerald-800 text-white",
                        HOBI: "bg-red-800 text-white",
                        KARIR: "bg-indigo-900 text-white",
                        ORGANISASI: "bg-amber-600 text-white",
                        EVENT: "bg-blue-800 text-white",
                      };

                      return {
                        id: c.id,
                        name: c.name,
                        category: c.category,
                        description: c.description,
                        membersCount: mData.length,
                        role:
                          userMembership.role === "ADMIN" ? "Admin" : "Anggota",
                        initials,
                        avatarColor:
                          avatarColorMap[c.category] ||
                          "bg-emerald-800 text-white",
                      } as CommunityItem;
                    }
                  }
                } catch (e) {
                  console.warn(`Failed to fetch membership for ${c.id}:`, e);
                }
                return null;
              }),
            );
            setMyCommunities(
              mapped.filter((x): x is CommunityItem => x !== null),
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch my communities:", error);
      }
    }

    if (isLoggedIn) {
      fetchMyCommunities();
    }
  }, [isLoggedIn, sessionUser, user]);

  if (!mounted || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="text-center font-bold text-[#0B1E36]">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4 text-[#0B1E36]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Memuat halaman...
        </div>
      </div>
    );
  }

  // GUEST LANDING VIEW
  if (!isLoggedIn) {
    return (
      <div className="flex-1 bg-[#0B1E36] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-44 h-44 rounded-full border border-dashed border-white"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 border border-white rotate-45"></div>
        </div>

        <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#0B1E36] flex items-center justify-center mx-auto mb-6 shadow-md">
            <svg viewBox="0 0 100 100" className="w-10 h-10">
              <path
                d="M25 20 C 25 20, 25 70, 50 85 C 75 70, 75 20, 75 20 L 50 15 Z"
                fill="#F2C010"
                stroke="#0B1E36"
                strokeWidth="6"
              />
              <circle cx="50" cy="50" r="16" fill="#0B1E36" />
              <path
                d="M50 65 L 50 40 M50 45 C 50 45, 42 35, 42 45 C 42 55, 50 50, 50 50 M50 48 C 50 48, 58 38, 58 48 C 58 58, 50 53, 50 53"
                fill="none"
                stroke="#22C55E"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="50" cy="35" r="3" fill="#22C55E" />
            </svg>
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
              className="w-full py-3 bg-[#F2C010] text-[#0B1E36] font-extrabold text-xs rounded-full hover:bg-[#d9a807] transition-colors shadow-md"
            >
              Masuk Sekarang
            </Link>
            <Link
              href="/signup"
              className="w-full py-3 bg-white border border-slate-200 text-[#0B1E36] font-extrabold text-xs rounded-full hover:bg-slate-50 transition-colors shadow-sm"
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

  // Determine display name — prefer Better Auth session, fallback to localStorage
  const displayName = sessionUser?.name || user?.name || "Figi";
  const firstName = displayName.split(" ")[0];

  // LOGGED IN MOBILE-FIRST HOME VIEW (Exactly matching the mockup screenshot!)
  return (
    <div className="flex-1 w-full bg-white flex flex-col min-h-screen">
      {/* 2. Welcome Panel matching mockup exactly */}
      <div className="px-4 pt-7 pb-4 w-full">
        <h2 className="text-xl font-extrabold text-[#0B1E36] tracking-tight leading-none">
          Halo, {firstName || "Figi"}!
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-relaxed">
          Selamat datang di komunitas kampus UNNES
        </p>
      </div>

      {/* 3. Rounded-t Badge Tab Block matching mockup exactly */}
      <div className="px-4 mt-4 w-full">
        <div className="w-36 bg-[#0B1E36] text-white font-extrabold text-[10px] uppercase tracking-wider text-center py-2.5 rounded-t-lg border-b-2 border-[#0B1E36]">
          KOMUNITASMU
        </div>
      </div>

      {/* 4. Community Card Lists exactly matching mockup */}
      <div className="flex-1 px-4 w-full pb-24">
        <div className="flex flex-col gap-3">
          {myCommunities.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">
                Belum ada komunitas yang kamu ikuti.
              </p>
            </div>
          ) : (
            myCommunities.map((community, idx) => (
              <Link
                key={community.id}
                href={`/community/${community.id}`}
                className="flex items-center gap-3 bg-[#E2E5E9] rounded-xl p-3.5 transition-all hover:bg-slate-200 cursor-pointer"
                id={`community-card-${community.id}`}
              >
                {/* Initials Avatar Square Badge matching mockup */}
                <div
                  className={`w-11 h-11 rounded-lg ${community.avatarColor} flex items-center justify-center shrink-0 font-extrabold text-sm shadow-sm`}
                >
                  {community.initials}
                </div>

                {/* Title & Member Count */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-xs text-[#0B1E36] leading-tight truncate">
                    {community.name}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                    {community.membersCount} anggota
                  </p>
                </div>

                {/* Role pill badge matching mockup */}
                {community.role && (
                  <span className="text-[9px] font-extrabold px-3 py-1 bg-white text-[#0B1E36] rounded-full shadow-sm shrink-0 border border-transparent">
                    {community.role}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>

        {/* Explore Pill Button */}
        <div className="mt-6">
          <Link
            href="/community/join"
            className="w-full py-3 bg-[#0B1E36] text-white font-extrabold text-xs rounded-full flex items-center justify-center gap-1.5 hover:bg-black transition-all shadow-md"
          >
            🔍 Jelajahi & Join Komunitas Lainnya
          </Link>
        </div>
      </div>
    </div>
  );
}
