"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "../../hooks/useUserSession";

const AVATAR_COLORS = [
  "avatar-bg-0",
  "avatar-bg-1",
  "avatar-bg-2",
  "avatar-bg-3",
  "avatar-bg-4",
  "avatar-bg-5",
];

interface CommunityListItem {
  id: string;
  name: string;
  category: string;
  membersCount: number;
  initials: string;
  isJoined: boolean;
}

// Mock community data
const MOCK_COMMUNITIES: CommunityListItem[] = [
  { id: "1", name: "Teknik Informatika", category: "AKADEMIK", membersCount: 150, initials: "TI", isJoined: true },
  { id: "2", name: "Robotika", category: "HOBI", membersCount: 60, initials: "R", isJoined: false },
  { id: "3", name: "English Club", category: "AKADEMIK", membersCount: 75, initials: "EC", isJoined: false },
  { id: "4", name: "Swimming Club", category: "HOBI", membersCount: 30, initials: "SC", isJoined: false },
  { id: "5", name: "Developer Student Club", category: "KARIR", membersCount: 204, initials: "DS", isJoined: false },
  { id: "6", name: "BEM FMIPA", category: "ORGANISASI", membersCount: 312, initials: "BF", isJoined: false },
  { id: "7", name: "Fotografi UNNES", category: "HOBI", membersCount: 45, initials: "FU", isJoined: false },
  { id: "8", name: "Debat Bahasa Inggris", category: "AKADEMIK", membersCount: 38, initials: "DB", isJoined: false },
];

export default function JoinCommunityPage() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const [search, setSearch] = useState("");
  const [communities, setCommunities] = useState<CommunityListItem[]>(MOCK_COMMUNITIES);
  const [successToast, setSuccessToast] = useState("");

  // Route protection
  useEffect(() => {
    if (!loading && (!user || !user.isLoggedIn)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // --- REAL API INTEGRATION (commented out for now) ---
  // useEffect(() => {
  //   async function fetchCommunities() {
  //     try {
  //       const res = await fetch("/api/communities");
  //       if (res.ok) {
  //         const data = await res.json();
  //         setCommunities(data.communities.map((c: any) => ({
  //           id: c.id,
  //           name: c.name,
  //           category: c.category,
  //           membersCount: c._count?.members || 0,
  //           initials: c.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
  //           isJoined: c.isJoined || false,
  //         })));
  //       }
  //     } catch (error) {
  //       console.error("Failed to fetch communities:", error);
  //     }
  //   }
  //   if (user?.isLoggedIn) fetchCommunities();
  // }, [user]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="text-center font-bold text-primary-dark">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-primary-dark" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat komunitas...
        </div>
      </div>
    );
  }

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = (communityId: string) => {
    // --- REAL API INTEGRATION (commented out for now) ---
    // async function joinCommunity() {
    //   try {
    //     const res = await fetch(`/api/communities/${communityId}/join`, {
    //       method: "POST",
    //     });
    //     if (!res.ok) throw new Error("Failed to join");
    //   } catch (error) {
    //     console.error("Failed to join community:", error);
    //   }
    // }
    // joinCommunity();

    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId ? { ...c, isJoined: !c.isJoined } : c
      )
    );
    const community = communities.find((c) => c.id === communityId);
    if (community) {
      const msg = community.isJoined
        ? `Keluar dari ${community.name}`
        : `Bergabung ke ${community.name}`;
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(""), 2500);
    }
  };

  return (
    <div className="flex-1 w-full mx-auto bg-[#FDFBF7] flex flex-col">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-5 md:bottom-5 z-50 bg-[#F4C41B] border-2 border-primary-dark text-primary-dark font-extrabold px-5 py-3 rounded-lg shadow-[4px_4px_0px_0px_#0A1D37] text-center text-sm animate-fade-in">
          🎉 {successToast}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-black text-primary-dark tracking-tight mb-4">
          Join Komunitas
        </h1>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            id="community-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari komunitas..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-primary-dark rounded-xl text-sm font-semibold text-primary-dark outline-none focus:shadow-[3px_3px_0px_0px_var(--color-primary-dark)] transition-all"
          />
        </div>
      </div>

      {/* Community List */}
      <div className="flex-1 px-4 max-w-6xl mx-auto w-full pb-4">
        <div className="flex flex-col gap-3">
          {filteredCommunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-bold text-text-muted">Tidak ada komunitas yang ditemukan.</p>
            </div>
          ) : (
            filteredCommunities.map((community, idx) => (
              <div
                key={community.id}
                className="flex items-center gap-3 bg-white border-2 border-primary-dark rounded-xl p-3.5 shadow-[3px_3px_0px_0px_var(--color-primary-dark)] transition-all animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
                id={`join-community-${community.id}`}
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-xl ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0 border-2 border-primary-dark shadow-[2px_2px_0px_0px_var(--color-primary-dark)]`}>
                  <span className="font-black text-sm">{community.initials}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm text-primary-dark truncate">{community.name}</h3>
                  <p className="text-[11px] font-semibold text-text-muted">{community.membersCount} anggota</p>
                </div>

                {/* Join/Leave Button */}
                <button
                  onClick={() => handleJoin(community.id)}
                  className={`text-[11px] font-black px-4 py-1.5 rounded-lg border-2 transition-all cursor-pointer flex-shrink-0 ${
                    community.isJoined
                      ? "bg-slate-100 text-slate-500 border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      : "bg-white text-primary-dark border-primary-dark shadow-[2px_2px_0px_0px_var(--color-primary-dark)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--color-primary-dark)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_var(--color-primary-dark)]"
                  }`}
                  id={`join-btn-${community.id}`}
                >
                  {community.isJoined ? "Joined" : "Join"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB — Create Community */}
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setSuccessToast("Fitur buat komunitas segera hadir!");
          setTimeout(() => setSuccessToast(""), 2500);
        }}
        className="fab"
        id="fab-create-community"
      >
        <svg className="w-7 h-7 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
    </div>
  );
}
