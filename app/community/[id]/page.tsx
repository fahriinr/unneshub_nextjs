"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "../../hooks/useUserSession";

interface PostItem {
  id: string;
  authorName: string;
  authorEmail: string;
  authorNim: string;
  avatarLetter: string;
  timeAgo: string;
  content: string;
  isAnonymous: boolean;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
  event?: {
    title: string;
    time: string;
    location: string;
    isRegistered?: boolean;
  };
}

interface CommunityDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  membersCount: number;
  initials: string;
  isJoined: boolean;
  rules?: string;
  chatCount?: number;
  isVerified?: boolean;
}

const INITIAL_POSTS: PostItem[] = [
  {
    id: "post-1",
    authorName: "Ahmad Mahasiswa",
    authorEmail: "ahmad@students.unnes.ac.id",
    authorNim: "1201421099",
    avatarLetter: "A",
    timeAgo: "2 jam yang lalu",
    content:
      "Ada yang tau jadwal krs semester depan dibuka kapan ya? Tolong infonya dong temen temen 🙏",
    isAnonymous: true,
    likes: 12,
    commentsCount: 5,
    isLiked: false,
  },
  {
    id: "post-2",
    authorName: "Admin HIMA SI",
    authorEmail: "admin.himasi@students.unnes.ac.id",
    authorNim: "0000000000",
    avatarLetter: "H",
    timeAgo: "1 hari yang lalu",
    content:
      "Halo teman-teman! HIMA Sistem Informasi kembali mengadakan Webinar UI/UX Design khusus untuk pemula. Yuk, daftarkan diri kalian segera!",
    isAnonymous: false,
    likes: 45,
    commentsCount: 12,
    isLiked: false,
    event: {
      title: "Webinar UI/UX Design untuk Pemula",
      time: "Jumat, 24 Mei 2026 | Zoom Meeting",
      location: "Zoom Meeting",
      isRegistered: false,
    },
  },
];

const DEFAULT_COMMUNITIES: CommunityDetails[] = [
  {
    id: "1",
    name: "Teknik Informatika",
    slug: "teknik-informatika",
    description:
      "Wadah bagi mahasiswa Teknik Informatika UNNES untuk berkolaborasi, belajar bersama, dan berbagi pengalaman seputar dunia teknologi, programming, hingga riset akademik.",
    category: "AKADEMIK",
    membersCount: 150,
    initials: "TI",
    isJoined: true,
    chatCount: 65,
    isVerified: true,
    rules:
      "Saling menghargai, dilarang sara, fokus seputar pemrograman dan karir teknologi.",
  },
  {
    id: "2",
    name: "Robotika",
    slug: "robotika",
    description:
      "Komunitas pecinta robotika, IoT, dan otomasi industri Universitas Negeri Semarang.",
    category: "HOBI",
    membersCount: 40,
    initials: "R",
    isJoined: false,
    chatCount: 12,
    isVerified: true,
  },
  {
    id: "3",
    name: "English Club",
    slug: "english-club",
    description:
      "A supportive environment to practice and improve English speaking, writing, and debating skills.",
    category: "AKADEMIK",
    membersCount: 70,
    initials: "EC",
    isJoined: false,
    chatCount: 28,
    isVerified: true,
  },
  {
    id: "4",
    name: "Swimming Club",
    slug: "swimming-club",
    description:
      "Komunitas olahraga renang mahasiswa UNNES, dari pemula hingga kompetitif.",
    category: "HOBI",
    membersCount: 30,
    initials: "SC",
    isJoined: false,
    chatCount: 5,
    isVerified: false,
  },
];

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const { id } = use(params);

  // States
  const [community, setCommunity] = useState<CommunityDetails | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postText, setPostText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [joining, setJoining] = useState(false);

  // Event creation form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Route protection
  useEffect(() => {
    if (!loading && (!user || !user.isLoggedIn)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load Community & Posts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedComms = localStorage.getItem("unneshub_communities_data");
      let commList: CommunityDetails[] = DEFAULT_COMMUNITIES;

      if (storedComms) {
        try {
          commList = JSON.parse(storedComms);
        } catch (e) {
          commList = DEFAULT_COMMUNITIES;
        }
      } else {
        localStorage.setItem(
          "unneshub_communities_data",
          JSON.stringify(DEFAULT_COMMUNITIES),
        );
      }

      // Merge newly created custom communities
      const storedNewComms = localStorage.getItem("unneshub_new_communities");
      if (storedNewComms) {
        try {
          const newComms = JSON.parse(storedNewComms);
          const mappedNew = newComms.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            category: c.category,
            membersCount: c.membersCount || 1,
            initials: c.initials,
            isJoined: c.isJoined ?? true,
            chatCount: 0,
            isVerified: false,
            rules: c.rules || "",
          }));
          commList = [
            ...mappedNew,
            ...commList.filter(
              (p) => !mappedNew.some((m: any) => m.id === p.id),
            ),
          ];
        } catch (e) {}
      }

      const foundComm = commList.find((c) => c.id === id);
      if (foundComm) {
        setCommunity(foundComm);
      } else {
        setCommunity({
          id: id,
          name: "Komunitas Kampus",
          slug: "komunitas-kampus",
          description:
            "Wadah interaksi dan kolaborasi eksklusif mahasiswa Universitas Negeri Semarang.",
          category: "AKADEMIK",
          membersCount: 45,
          initials: "KK",
          isJoined: false,
          chatCount: 15,
          isVerified: true,
        });
      }

      // Load posts for this specific community
      const storedPosts = localStorage.getItem(`unneshub_posts_${id}`);
      if (storedPosts) {
        try {
          setPosts(JSON.parse(storedPosts));
        } catch (e) {
          setPosts(INITIAL_POSTS);
        }
      } else {
        setPosts(INITIAL_POSTS);
        localStorage.setItem(
          `unneshub_posts_${id}`,
          JSON.stringify(INITIAL_POSTS),
        );
      }
    }
  }, [id]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const savePosts = (updatedPosts: PostItem[]) => {
    setPosts(updatedPosts);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `unneshub_posts_${id}`,
        JSON.stringify(updatedPosts),
      );
    }
  };

  // Join Community Handler
  const handleJoinCommunity = async () => {
    setJoining(true);
    setTimeout(() => {
      if (!community) return;

      const updatedComm = {
        ...community,
        isJoined: true,
        membersCount: community.membersCount + 1,
      };

      setCommunity(updatedComm);

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("unneshub_communities_data");
        if (stored) {
          try {
            const list = JSON.parse(stored);
            const newList = list.map((c: any) =>
              c.id === id ? updatedComm : c,
            );
            localStorage.setItem(
              "unneshub_communities_data",
              JSON.stringify(newList),
            );
          } catch (e) {}
        }
      }

      triggerToast(`Berhasil bergabung dengan ${community.name}! 🎉`);
      setJoining(false);
    }, 1500);
  };

  // Create post handler
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!postText.trim()) return;

    const newPost: PostItem = {
      id: `post-${Date.now()}`,
      authorName: user.name,
      authorEmail: user.email,
      authorNim: user.nim,
      avatarLetter: user.name.charAt(0).toUpperCase(),
      timeAgo: "Baru saja",
      content: postText.trim(),
      isAnonymous: isAnonymous,
      likes: 0,
      commentsCount: 0,
      isLiked: false,
    };

    savePosts([newPost, ...posts]);
    setPostText("");
    setIsAnonymous(false);
    triggerToast("Postingan berhasil diterbitkan!");
  };

  // Create event handler
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!eventTitle.trim() || !eventTime.trim()) return;

    const newEventPost: PostItem = {
      id: `post-event-${Date.now()}`,
      authorName:
        user.role === "global_admin"
          ? "Global Admin"
          : `Admin ${community?.initials || "K"}`,
      authorEmail: user.email,
      authorNim: user.nim,
      avatarLetter: user.role === "global_admin" ? "G" : "A",
      timeAgo: "Baru saja",
      content: `Halo teman-teman! Terdapat event baru yang diselenggarakan oleh komunitas. Jangan sampai ketinggalan ya!`,
      isAnonymous: false,
      likes: 0,
      commentsCount: 0,
      isLiked: false,
      event: {
        title: eventTitle.trim(),
        time: eventTime.trim(),
        location: eventLocation.trim() || "Online",
        isRegistered: false,
      },
    };

    savePosts([newEventPost, ...posts]);
    setEventTitle("");
    setEventTime("");
    setEventLocation("");
    setShowEventModal(false);
    triggerToast("Event baru berhasil ditambahkan!");
  };

  // Register for event handler
  const handleRegisterEvent = (postId: string) => {
    const updated = posts.map((post) => {
      if (post.id === postId && post.event) {
        const isRegistered = !post.event.isRegistered;
        if (isRegistered) {
          triggerToast("Anda berhasil mendaftar untuk event ini!");
        } else {
          triggerToast("Pendaftaran event dibatalkan.");
        }
        return {
          ...post,
          event: {
            ...post.event,
            isRegistered,
          },
        };
      }
      return post;
    });
    savePosts(updated);
  };

  // Like handler
  const handleLike = (postId: string) => {
    const updated = posts.map((post) => {
      if (post.id === postId) {
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likes: isLiked ? post.likes + 1 : post.likes - 1,
        };
      }
      return post;
    });
    savePosts(updated);
  };

  if (loading || !user || !community) {
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
          Loading data...
        </div>
      </div>
    );
  }

  const isAdmin =
    user.role === "community_admin" || user.role === "global_admin";

  // ==========================================
  // VIEW 1: VISITOR / INFORMASI KOMUNITAS VIEW (NOT JOINED) exactly matching Screen 4
  // ==========================================
  if (!community.isJoined) {
    return (
      <div className="flex-1 w-full bg-white flex flex-col min-h-screen">
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed top-5 left-4 right-4 md:left-auto md:right-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-6 py-4 rounded-xl shadow-lg text-center text-sm animate-bounce">
            {successToast}
          </div>
        )}

        {/* Dark Navy Header Banner matching Screen 4
        <div className="bg-[#0B1E36] px-4 py-4 flex items-center justify-between w-full shadow-sm">
          <span className="text-white font-black text-xl tracking-tight">UnnesHub</span>
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4.5 h-4.5 text-[#0B1E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.041 9.041 0 01-3.185 0M17 11V7a5 5 0 00-7-4.887A5.006 5.006 0 005 7v4a5.986 5.986 0 01-.294 1.828l-1.005 3.013c-.115.346.124.694.487.694h13.624c.363 0 .602-.348.487-.694l-1.005-3.013a5.986 5.986 0 01-.294-1.828z" />
            </svg>
          </button>
        </div> */}

        {/* Back Link */}
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <Link
            href="/community/join"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:underline transition-all"
          >
            <span className="text-sm">‹</span> Kembali
          </Link>
        </div>

        {/* Community Dark Navy overlapping Banner Block exactly matching Screen 4 */}
        <div className="px-4 pt-3 max-w-lg mx-auto w-full">
          <div className="bg-[#0B1E36] rounded-2xl p-6 flex items-center gap-4 text-white relative overflow-hidden shadow-sm">
            {/* Square abbreviation avatar box with clean green background */}
            <div className="w-14 h-14 bg-emerald-700 rounded-xl flex items-center justify-center border border-white/20 shrink-0 font-extrabold text-xl text-white shadow-sm">
              {community.initials}
            </div>

            <div className="flex flex-col min-w-0">
              <h1 className="text-base font-extrabold tracking-tight leading-snug truncate">
                Komunitas {community.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Stats Row Capsules exactly matching Screen 4 */}
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <div className="grid grid-cols-3 gap-3">
            {/* Stat Item 1: Members */}
            <div className="bg-white border border-slate-100 rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-black text-[#0B1E36]">
                {community.membersCount}
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider">
                Anggota
              </span>
            </div>

            {/* Stat Item 2: Verified badge */}
            <div className="bg-white border border-slate-100 rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px] text-[#F2C010]">★</span>
                <span className="text-[9px] font-black text-[#0B1E36] uppercase tracking-wide">
                  Verified
                </span>
              </div>
            </div>

            {/* Stat Item 3: Chat count */}
            <div className="bg-white border border-slate-100 rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-black text-[#0B1E36]">
                {community.chatCount ?? 65}
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider">
                Chat
              </span>
            </div>
          </div>
        </div>

        {/* Tentang Komunitas Description Block matching Screen 4 */}
        <div className="px-4 pt-5 max-w-lg mx-auto w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Tentang Komunitas
            </h2>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              {community.description}
            </p>
          </div>
        </div>

        {/* Dark Navy Discussion Card matching Screen 4 */}
        <div className="px-4 pt-5 pb-24 max-w-lg mx-auto w-full">
          <div className="bg-[#0B1E36] rounded-2xl p-4 text-white flex items-start gap-3 shadow-md">
            {/* Yellow Chat Bubble icon */}
            <div className="w-8 h-8 rounded-lg bg-[#F2C010] flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 text-[#0B1E36]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.477 2 2 5.582 2 10c0 1.93.834 3.7 2.25 5.094C3.89 16.712 3 18.5 3 18.5s2.25-.262 4.125-1.5c1.472.637 3.125 1 4.875 1 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-extrabold tracking-wide truncate">
                Diskusi: Kurikulum 2024
              </span>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                12 pesan baru hari ini
              </span>
            </div>
          </div>
        </div>

        {/* Wide Bottom solid Navy Join Button with user-plus icon matching Screen 4 */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-40 max-w-lg mx-auto w-full md:bottom-4">
          <button
            onClick={handleJoinCommunity}
            disabled={joining}
            className="w-full py-3.5 bg-[#0B1E36] rounded-full text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:bg-black/90 active:scale-99 transition-all cursor-pointer shrink-0"
          >
            {joining ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                Bergabung...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Join Komunitas
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE DISCUSSION FEED & MESSAGES (JOINED) - Clean minimalist styling matching rest of app
  // ==========================================
  return (
    <div className="flex-1 w-full bg-white flex flex-col min-h-screen">
      {/* Dark Navy Header Banner */}
      <div className="bg-[#0B1E36] px-4 py-4 flex items-center justify-between w-full shadow-sm">
        <span className="text-white font-black text-xl tracking-tight">
          UnnesHub
        </span>
        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
          <svg
            className="w-4.5 h-4.5 text-[#0B1E36]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a9.041 9.041 0 01-3.185 0M17 11V7a5 5 0 00-7-4.887A5.006 5.006 0 005 7v4a5.986 5.986 0 01-.294 1.828l-1.005 3.013c-.115.346.124.694.487.694h13.624c.363 0 .602-.348.487-.694l-1.005-3.013a5.986 5.986 0 01-.294-1.828z"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-5 pb-24">
        {/* Back Link */}
        <div>
          <Link
            href="/community/join"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:underline transition-all"
          >
            <span className="text-sm">‹</span> Kembali
          </Link>
        </div>

        {/* Clean Flat Details Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded px-2 py-0.5 inline-block w-fit mb-1.5">
              {community.category}
            </span>
            <h1 className="text-lg font-extrabold text-[#0B1E36] tracking-tight leading-tight mb-1">
              {community.name}
            </h1>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              {community.description}
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0 font-extrabold text-white text-base shadow-sm">
            {community.initials}
          </div>
        </div>

        {/* Discussion Creation Segment */}
        <form
          onSubmit={handleCreatePost}
          className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm"
        >
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="Apa yang ingin anda diskusikan?"
            className="w-full min-h-[80px] bg-white rounded-xl p-3 text-xs font-bold focus:outline-none placeholder-slate-400 border border-slate-150 transition-all resize-none text-[#0B1E36]"
            maxLength={500}
            required
          />

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-xs font-extrabold text-[#0B1E36] cursor-pointer group">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#0B1E36] border border-slate-300 rounded cursor-pointer"
              />
              <span className="group-hover:underline text-[10px]">
                Kirim sebagai Anonymous
              </span>
            </label>

            <button
              type="submit"
              className="px-5 py-2 bg-[#0B1E36] text-white font-extrabold text-[10px] rounded-full hover:bg-black transition-all cursor-pointer shadow-sm"
            >
              Posting
            </button>
          </div>
        </form>

        {/* Discussion Feed */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-black text-[#0B1E36] pb-1.5 border-b border-slate-100">
            Beranda Postingan
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-400">
                Belum ada postingan komunitas. Jadilah yang pertama!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm relative"
              >
                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 border border-slate-200 shrink-0 font-extrabold text-xs text-[#0B1E36]">
                    {post.isAnonymous ? "?" : post.avatarLetter}
                  </div>

                  <div className="flex-1">
                    <span className="font-extrabold text-xs text-[#0B1E36] block">
                      {post.isAnonymous ? "Anonymous" : post.authorName}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                      {post.timeAgo}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                  {post.content}
                </div>

                {/* Event */}
                {post.event && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 relative mt-1 shadow-inner">
                    <span className="text-[8px] font-black uppercase tracking-wider bg-[#F2C010] text-[#0B1E36] px-2 py-0.5 rounded w-fit">
                      📅 EVENT MENDATANG
                    </span>

                    <div className="flex flex-col">
                      <h3 className="text-xs font-extrabold text-[#0B1E36]">
                        {post.event.title}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                        {post.event.time}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRegisterEvent(post.id)}
                      className={`w-full py-2 text-xs font-extrabold rounded-full transition-all shrink-0 cursor-pointer shadow-sm ${
                        post.event.isRegistered
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[#0B1E36] text-white hover:bg-black"
                      }`}
                    >
                      {post.event.isRegistered ? "✓ Terdaftar" : "Daftar Event"}
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-5 pt-2 mt-1 border-t border-slate-50">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 text-[10px] font-extrabold transition-all cursor-pointer ${
                      post.isLiked
                        ? "text-red-500"
                        : "text-slate-500 hover:text-[#0B1E36]"
                    }`}
                  >
                    <span>♥</span>
                    <span>{post.likes}</span>
                  </button>

                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500">
                    <span>💬</span>
                    <span>{post.commentsCount}</span>
                  </div>

                  <button
                    onClick={() =>
                      triggerToast("Tautan postingan disalin ke papan klip!")
                    }
                    className="text-[10px] font-extrabold text-slate-500 hover:text-[#0B1E36] cursor-pointer"
                  >
                    Bagikan
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
