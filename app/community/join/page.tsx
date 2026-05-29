"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "../../hooks/useUserSession";
import { JoinSkeleton } from "../../components/Skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CommunityListItem {
  id: string;
  name: string;
  category: string;
  membersCount: number;
  initials: string;
  isJoined: boolean;
  avatarColor: string;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function JoinCommunityPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useUserSession();
  const [search, setSearch] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 2500);
  };

  // Route protection
  useEffect(() => {
    if (!loading && (!user || !user.isLoggedIn)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Optimized communities fetching with server-side search
  const { data: communities = [], isLoading: isFetchingCommunities } = useQuery({
    queryKey: ["communities", user?.email, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      const url = `/api/communities${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data komunitas");
      const result = await res.json();
      const data = result.data || result;
      if (!Array.isArray(data)) return [];

      const approvedCommunities = data.filter((c: any) => c.status === "APPROVED");

      return approvedCommunities.map((c: any) => {
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
          membersCount: c._count?.members || 0,
          initials,
          isJoined: c.isJoined || false,
          avatarColor: avatarColorMap[c.category] || "bg-emerald-800 text-white",
        } as CommunityListItem;
      });
    },
    enabled: !!user?.isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  if (loading || !user || (isFetchingCommunities && communities.length === 0 && !debouncedSearch)) {
    return <JoinSkeleton />;
  }

  const handleJoin = async (communityId: string) => {
    try {
      const community = communities.find((c) => c.id === communityId);
      if (!community) return;

      const isCurrentlyJoined = community.isJoined;
      const endpoint = `/api/communities/${communityId}/join`;

      const res = await fetch(endpoint, {
        method: "POST",
      });

      if (res.ok) {
        triggerToast(
          isCurrentlyJoined
            ? `Keluar dari ${community.name}`
            : `Bergabung ke ${community.name}`,
        );
        
        // Invalidate queries to instantly update caches
        queryClient.invalidateQueries({ queryKey: ["communities"] });
        queryClient.invalidateQueries({ queryKey: ["myCommunities"] });
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal mengubah keanggotaan");
      }
    } catch (error) {
      console.error("Failed to join community:", error);
      triggerToast("Terjadi kesalahan koneksi server.");
    }
  };

  return (
    <div className="flex-1 w-full mx-auto bg-white flex flex-col min-h-screen">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-5 md:bottom-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-5 py-3 rounded-xl shadow-lg text-center text-sm animate-fade-in">
          🎉 {successToast}
        </div>
      )}

      {/* Screen Title & Search Block */}
      <div className="px-4 pt-6 pb-4 w-full">
        <h1 className="text-xl font-extrabold text-[#0B1E36] tracking-tight mb-4">
          Join Komunitas
        </h1>

        {/* Search Input with server-side search */}
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA0AF]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="community-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari komunitas..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#E2E5E9] rounded-xl text-xs font-bold text-[#0B1E36] outline-none placeholder-[#8FA0AF] transition-all"
          />
          {/* Loading indicator for search */}
          {isFetchingCommunities && debouncedSearch && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Community List */}
      <div className="flex-1 px-4 w-full pb-24">
        <div className="flex flex-col gap-3">
          {communities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs font-bold text-slate-400">
                {debouncedSearch
                  ? `Tidak ada komunitas untuk "${debouncedSearch}"`
                  : "Tidak ada komunitas yang ditemukan."}
              </p>
            </div>
          ) : (
            communities.map((community) => (
              <Link
                key={community.id}
                href={`/community/${community.id}`}
                className="flex items-center gap-3 bg-[#E2E5E9] rounded-xl p-3.5 transition-all hover:bg-slate-200/80 cursor-pointer"
                id={`join-community-${community.id}`}
              >
                {/* Abbreviation square avatar box */}
                <div
                  className={`w-11 h-11 rounded-lg ${community.avatarColor} flex items-center justify-center shrink-0 font-extrabold text-sm shadow-sm`}
                >
                  {community.initials}
                </div>

                {/* Name + Member Subtexts */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-xs text-[#0B1E36] leading-tight truncate">
                    {community.name}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                    {community.membersCount} anggota
                  </p>
                </div>

                {/* White pill Join button */}
                <button
                  disabled={community.isJoined}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!community.isJoined) handleJoin(community.id);
                  }}
                  className={`text-[10px] font-extrabold px-5 py-1.5 rounded-full border transition-all shrink-0 ${
                    community.isJoined
                      ? "bg-slate-300 border-transparent text-slate-600 cursor-not-allowed opacity-60"
                      : "bg-white border-transparent text-[#0B1E36] shadow-sm hover:bg-slate-50 hover:shadow-md active:scale-95 cursor-pointer"
                  }`}
                  id={`join-btn-${community.id}`}
                >
                  {community.isJoined ? "Joined" : "Join"}
                </button>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* FAB - Yellow Minimalist Circle */}
      <Link
        href="/community/create"
        className="sticky bottom-20 ml-auto mr-5 mb-4 w-12 h-12 rounded-full bg-[#F2C010] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer z-40"
        id="fab-create-community"
      >
        <span className="text-2xl font-black text-[#0B1E36] leading-none">
          +
        </span>
      </Link>
    </div>
  );
}
