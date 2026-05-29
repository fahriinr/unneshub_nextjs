"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "../../hooks/useUserSession";

interface CommunityListItem {
  id: string;
  name: string;
  category: string;
  membersCount: number;
  initials: string;
  isJoined: boolean;
  avatarColor: string;
}

interface DBCommunity {
  id: string;
  name: string;
  category: string;
  _count?: {
    members?: number;
  };
}

interface DBMember {
  user?: {
    email: string;
  } | null;
}

export default function JoinCommunityPage() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const [search, setSearch] = useState("");
  const [communities, setCommunities] = useState<CommunityListItem[]>([]);
  const [successToast, setSuccessToast] = useState("");

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

  // Fetch real communities from API
  useEffect(() => {
    async function fetchCommunities() {
      try {
        const res = await fetch("/api/communities");
        if (res.ok) {
          const result = await res.json();
          const data = result.data || result;
          if (Array.isArray(data) && data.length > 0) {
            const mapped = await Promise.all(
              data.map(async (c: DBCommunity) => {
                let isJoined = false;
                let membersCount = c._count?.members || 0;
                try {
                  const mRes = await fetch(`/api/communities/${c.id}/members`);
                  if (mRes.ok) {
                    const mData = await mRes.json();
                    isJoined = mData.some(
                      (m: DBMember) => m.user?.email === user?.email,
                    );
                    membersCount = mData.length;
                  }
                } catch (e) {
                  console.warn(`Failed to check membership for ${c.id}:`, e);
                }

                const initials = c.name
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const avatarColor =
                  c.category === "AKADEMIK"
                    ? "bg-emerald-700 text-white"
                    : c.category === "HOBI"
                      ? "bg-red-800 text-white"
                      : "bg-indigo-900 text-white";

                return {
                  id: c.id,
                  name: c.name,
                  category: c.category,
                  membersCount,
                  initials,
                  isJoined,
                  avatarColor,
                };
              }),
            );
            setCommunities(mapped);
          }
        }
      } catch (error) {
        console.error("Failed to fetch communities from API:", error);
      }
    }
    if (user?.isLoggedIn) {
      fetchCommunities();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
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
          Memuat komunitas...
        </div>
      </div>
    );
  }

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

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
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === communityId
              ? {
                  ...c,
                  isJoined: !c.isJoined,
                  membersCount: c.isJoined
                    ? c.membersCount - 1
                    : c.membersCount + 1,
                }
              : c,
          ),
        );
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

      {/* Dark Navy Header Banner matching Screen 2
      <div className="bg-[#0B1E36] px-4 py-4 flex items-center justify-between w-full shadow-sm">
        <span className="text-white font-black text-xl tracking-tight">UnnesHub</span>
        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
          <svg className="w-4.5 h-4.5 text-[#0B1E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.041 9.041 0 01-3.185 0M17 11V7a5 5 0 00-7-4.887A5.006 5.006 0 005 7v4a5.986 5.986 0 01-.294 1.828l-1.005 3.013c-.115.346.124.694.487.694h13.624c.363 0 .602-.348.487-.694l-1.005-3.013a5.986 5.986 0 01-.294-1.828z" />
          </svg>
        </button>
      </div> */}

      {/* Screen Title & Search Block */}
      <div className="px-4 pt-6 pb-4 w-full">
        <h1 className="text-xl font-extrabold text-[#0B1E36] tracking-tight mb-4">
          Join Komunitas
        </h1>

        {/* Gray Rounded Search Input Box matching Screen 2 */}
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
            placeholder="Search communities..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#E2E5E9] rounded-xl text-xs font-bold text-[#0B1E36] outline-none placeholder-[#8FA0AF] transition-all"
          />
        </div>
      </div>

      {/* Community List exactly matching Screen 2 */}
      <div className="flex-1 px-4 w-full pb-24">
        <div className="flex flex-col gap-3">
          {filteredCommunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs font-bold text-slate-400">
                Tidak ada komunitas yang ditemukan.
              </p>
            </div>
          ) : (
            filteredCommunities.map((community) => (
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
