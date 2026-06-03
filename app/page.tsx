"use client";

import Link from "next/link";
import { useUserSession } from "./hooks/useUserSession";
import { HomeSkeleton } from "./components/Skeleton";
import { useQuery } from "@tanstack/react-query";
import GuestLanding from "./components/GuestLanding";
import CommunityCard, { CommunityItem } from "./components/CommunityCard";

export default function Home() {
  const { user, loading } = useUserSession();

  const isLoggedIn = !!(user && user.isLoggedIn);
  const activeEmail = user?.email;

  // Optimized joined communities fetching with caching to eliminate lag
  const { data: { joined = [], unjoined = [] } = { joined: [], unjoined: [] }, isLoading: isFetchingCommunities } = useQuery({
    queryKey: ["myCommunities", activeEmail],
    queryFn: async () => {
      if (!activeEmail) return { joined: [], unjoined: [] };

      const res = await fetch("/api/communities");
      if (!res.ok) throw new Error("Gagal mengambil data komunitas");
      
      const result = await res.json();
      const data = result.data || result;
      if (!Array.isArray(data)) return { joined: [], unjoined: [] };

      const mapped = data.map((c: any) => {
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
          membersCount: c._count?.members || 0,
          role: c.permissions?.isCommunityAdmin ? "Admin" : "Anggota",
          initials,
          avatarColor: avatarColorMap[c.category] || "bg-emerald-800 text-white",
          status: c.status,
          coverImage: c.coverImage || c.community_image_url || null,
          isJoined: c.isJoined || false,
        } as any;
      });

      return {
        joined: mapped.filter((c: any) => c.isJoined),
        unjoined: mapped.filter((c: any) => !c.isJoined && c.status === "APPROVED"),
      };
    },
    enabled: isLoggedIn && !!activeEmail,
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
  });

  if (loading || (isLoggedIn && isFetchingCommunities && joined.length === 0)) {
    return <HomeSkeleton />;
  }

  // GUEST LANDING VIEW
  if (!isLoggedIn) {
    return <GuestLanding />;
  }

  // Determine display name from session hook
  const displayName = user?.name || "Figi";
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

      <div className="flex-1 w-full px-4 pb-24 md:grid md:grid-cols-3 md:gap-8 md:items-start">
        {/* Left Column: Joined Communities */}
        <div className="md:col-span-2 flex flex-col">
          {/* 3. Rounded-t Badge Tab Block matching mockup exactly */}
          <div className="w-full">
            <div className="w-36 bg-[#0B1E36] text-white font-extrabold text-[10px] uppercase tracking-wider text-center py-2.5 rounded-t-lg border-b-2 border-[#0B1E36]">
              KOMUNITASMU
            </div>
          </div>

          {/* 4. Community Card Lists exactly matching mockup */}
          <div className="flex flex-col gap-3 mt-4">
            {joined.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400">
                  Belum ada komunitas yang kamu ikuti.
                </p>
              </div>
            ) : (
              joined.map((community: any) => (
                <CommunityCard key={community.id} community={community} />
              ))
            )}
          </div>

          {/* Explore Pill Button */}
          <div className="mt-6">
            <Link
              href="/community/join"
              className="w-full py-3 bg-[#0B1E36] text-white font-extrabold text-xs rounded-full flex items-center justify-center gap-1.5 hover:bg-black transition-all shadow-md text-center"
            >
              🔍 Jelajahi & Join Komunitas Lainnya
            </Link>
          </div>
        </div>

        {/* Right Column: Suggestions Sidebar (Visible on Desktop only) */}
        {unjoined.length > 0 && (
          <div className="hidden md:flex md:col-span-1 flex-col gap-4 sticky top-24">
            <div className="bg-[#FFFBEB] border-2 border-[#0B1E36] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#0B1E36] flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-extrabold text-xs text-[#0B1E36] uppercase tracking-wider">
                  🌟 Rekomendasi Komunitas
                </h3>
                <p className="text-[10px] font-bold text-slate-400">
                  Temukan grup baru yang sesuai dengan minatmu
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {unjoined.slice(0, 4).map((community: any) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
