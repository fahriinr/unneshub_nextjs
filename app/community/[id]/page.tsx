"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "../../hooks/useUserSession";

interface CommentItem {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  authorName: string;
  avatarLetter: string;
  isAnonymous: boolean;
}

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
  isPinned?: boolean;
  imageUrl?: string;
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
  avatarColor: string;
  onlineCount: number;
}

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const { id } = use(params);

  // States
  const [community, setCommunity] = useState<CommunityDetails | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [activeTab, setActiveTab] = useState("Postingan");
  const [postText, setPostText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [memberRole, setMemberRole] = useState<string>("MEMBER");

  // Comments Tray State
  const [activeCommentPost, setActiveCommentPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Event creation form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  // Route protection
  useEffect(() => {
    if (!loading && (!user || !user.isLoggedIn)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load Community & Posts
  useEffect(() => {
    let active = true;

    async function loadRealData() {
      try {
        // Fetch Community Details
        const commRes = await fetch(`/api/communities/${id}`);
        if (!commRes.ok) throw new Error("Gagal mengambil data komunitas");
        const commData = await commRes.json();

        // Fetch Members List
        let membersData = [];
        try {
          const membersRes = await fetch(`/api/communities/${id}/members`);
          if (membersRes.ok) {
            membersData = await membersRes.json();
          }
        } catch (e) {
          console.warn("Failed to fetch members:", e);
        }

        // Fetch Posts
        let postsData = [];
        try {
          const postsRes = await fetch(`/api/posts?communityId=${id}`);
          if (postsRes.ok) {
            postsData = await postsRes.json();
          }
        } catch (e) {
          console.warn("Failed to fetch posts:", e);
        }

        if (!active) return;

        // Check if current user is a member
        const userMembership = membersData.find(
          (m: any) => m.user?.email === user?.email
        );
        const isJoined = !!userMembership;
        if (userMembership) {
          setMemberRole(userMembership.role);
        }

        // Map Category Avatar Color
        const avatarColorMap: Record<string, string> = {
          AKADEMIK: "bg-emerald-700 text-white",
          HOBI: "bg-red-800 text-white",
          KARIR: "bg-indigo-900 text-white",
          ORGANISASI: "bg-amber-600 text-white",
          EVENT: "bg-blue-800 text-white"
        };

        setCommunity({
          id: commData.id,
          name: commData.name,
          slug: commData.slug,
          description: commData.description,
          category: commData.category,
          membersCount: commData._count?.members || membersData.length || 0,
          initials: commData.name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          isJoined,
          avatarColor: avatarColorMap[commData.category] || "bg-emerald-700 text-white",
          onlineCount: Math.max(1, Math.floor((commData._count?.members || 1) / 5)),
          rules: commData.rules || "",
        });

        // Map posts
        const mappedPosts: PostItem[] = postsData.map((post: any) => {
          const postAuthor = post.author || {};
          const authorName = post.isAnonymous ? "Anonymous" : (postAuthor.name || "Mahasiswa");
          const avatarLetter = post.isAnonymous 
            ? "?" 
            : authorName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

          return {
            id: post.id,
            authorName,
            authorEmail: postAuthor.email || "",
            authorNim: "",
            avatarLetter,
            timeAgo: new Date(post.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            content: post.content,
            isAnonymous: post.isAnonymous,
            likes: post._count?.likes || 0,
            commentsCount: post._count?.comments || 0,
            isLiked: false, // will be updated when liked
            imageUrl: post.imageUrl || undefined,
          };
        });

        setPosts(mappedPosts);
      } catch (err) {
        console.error("Real API error:", err);
      }
    }

    if (user?.isLoggedIn) {
      loadRealData();
    }

    return () => {
      active = false;
    };
  }, [id, user]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Join Community Handler
  const handleJoinCommunity = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/communities/${id}/join`, {
        method: "POST"
      });
      if (res.ok) {
        triggerToast(`Berhasil bergabung! 🎉`);
        setCommunity(prev => prev ? {
          ...prev,
          isJoined: true,
          membersCount: prev.membersCount + 1,
        } : null);
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal bergabung dengan komunitas");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menyambungkan ke server.");
    } finally {
      setJoining(false);
    }
  };

  // Create post handler
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!postText.trim()) return;

    const payload = {
      content: postText.trim(),
      isAnonymous: isAnonymous,
      communityId: id,
    };

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newPostRaw = await res.json();
        const postAuthor = newPostRaw.author || {};
        const authorName = newPostRaw.isAnonymous ? "Anonymous" : (postAuthor.name || user.name);
        const avatarLetter = newPostRaw.isAnonymous 
          ? "?" 
          : authorName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

        const newPostItem: PostItem = {
          id: newPostRaw.id,
          authorName,
          authorEmail: postAuthor.email || user.email,
          authorNim: user.nim || "",
          avatarLetter,
          timeAgo: "Baru saja",
          content: newPostRaw.content,
          isAnonymous: newPostRaw.isAnonymous,
          likes: 0,
          commentsCount: 0,
          isLiked: false,
        };
        setPosts(prev => [newPostItem, ...prev]);
        setPostText("");
        setIsAnonymous(false);
        triggerToast("Postingan berhasil diterbitkan!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal menerbitkan postingan");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus postingan ini?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        triggerToast("Postingan berhasil dihapus!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal menghapus postingan");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  // Toggle pin handler (Admin Privilege)
  const handleTogglePin = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isPinned = !p.isPinned;
        triggerToast(isPinned ? "Postingan berhasil disematkan!" : "Sematkan dibatalkan.");
        return { ...p, isPinned };
      }
      return p;
    }));
  };

  // Create event handler (Admin Privilege)
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!eventTitle.trim() || !eventTime.trim()) return;

    const newEventPost: PostItem = {
      id: `post-event-${Date.now()}`,
      authorName: user.role === "global_admin" ? "Global Admin" : `Admin ${community?.initials || "K"}`,
      authorEmail: user.email,
      authorNim: user.nim,
      avatarLetter: user.role === "global_admin" ? "G" : "A",
      timeAgo: "Baru saja",
      content: `Pengumuman Event baru yang diselenggarakan oleh komunitas. Jangan sampai ketinggalan ya!`,
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

    setPosts(prev => [newEventPost, ...prev]);
    setEventTitle("");
    setEventTime("");
    setEventLocation("");
    setShowEventModal(false);
    triggerToast("Event baru berhasil ditambahkan!");
  };

  // Register for event handler
  const handleRegisterEvent = (postId: string) => {
    setPosts(prev => prev.map((post) => {
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
    }));
  };

  // Like handler
  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: data.liked,
              likes: data.likeCount,
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // COMMENTS DRAWER SYSTEM
  // ==========================================
  const handleOpenComments = async (post: PostItem) => {
    setActiveCommentPost(post);
    setCommentText("");

    try {
      const res = await fetch(`/api/comments?postId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        const mappedComments: CommentItem[] = data.map((comment: any) => {
          const author = comment.author || {};
          const authorName = author.name || "Mahasiswa";
          const avatarLetter = authorName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
          return {
            id: comment.id,
            postId: comment.postId,
            content: comment.content,
            createdAt: new Date(comment.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            }),
            authorName,
            avatarLetter,
            isAnonymous: false,
          };
        });
        setComments(mappedComments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCommentPost || !commentText.trim()) return;

    setSubmittingComment(true);

    const payload = {
      content: commentText.trim(),
      postId: activeCommentPost.id,
    };

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newCommentRaw = await res.json();
        const commentAuthor = newCommentRaw.author || {};
        const authorName = commentAuthor.name || user.name;
        const avatarLetter = authorName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
        
        const newCommentItem: CommentItem = {
          id: newCommentRaw.id,
          postId: activeCommentPost.id,
          content: newCommentRaw.content,
          createdAt: "Baru saja",
          authorName,
          avatarLetter,
          isAnonymous: false,
        };

        setComments(prev => [...prev, newCommentItem]);
        
        // Update comment count in posts state
        setPosts(prev => prev.map(p => {
          if (p.id === activeCommentPost.id) {
            return { ...p, commentsCount: p.commentsCount + 1 };
          }
          return p;
        }));

        setCommentText("");
        triggerToast("Komentar berhasil ditambahkan!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal mengirim komentar");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading || !user || !community) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="text-center font-bold text-[#0B1E36]">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-[#0B1E36]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading data...
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "community_admin" || user.role === "global_admin" || memberRole === "ADMIN";

  // ==========================================
  // VIEW 1: VISITOR / INFORMASI KOMUNITAS VIEW (NOT JOINED)
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

        {/* Dark Navy Header Banner */}
        <div className="bg-[#0B1E36] px-4 py-4 flex items-center justify-between w-full shadow-sm">
          <span className="text-white font-black text-xl tracking-tight">UnnesHub</span>
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4.5 h-4.5 text-[#0B1E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.041 9.041 0 01-3.185 0M17 11V7a5 5 0 00-7-4.887A5.006 5.006 0 005 7v4a5.986 5.986 0 01-.294 1.828l-1.005 3.013c-.115.346.124.694.487.694h13.624c.363 0 .602-.348.487-.694l-1.005-3.013a5.986 5.986 0 01-.294-1.828z" />
            </svg>
          </button>
        </div>

        {/* Back Link */}
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <Link
            href="/community/join"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:underline transition-all"
          >
            <span className="text-sm">‹</span> Kembali
          </Link>
        </div>

        {/* Community Dark Navy Banner Block */}
        <div className="px-4 pt-3 max-w-lg mx-auto w-full">
          <div className="bg-[#0B1E36] rounded-2xl p-6 flex items-center gap-4 text-white relative overflow-hidden shadow-sm">
            <div className={`w-14 h-14 ${community.avatarColor} rounded-xl flex items-center justify-center border border-white/20 shrink-0 font-extrabold text-xl shadow-sm`}>
              {community.initials}
            </div>

            <div className="flex flex-col min-w-0">
              <h1 className="text-base font-extrabold tracking-tight leading-snug truncate">
                Komunitas {community.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Stats Row Capsules */}
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-100 rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-black text-[#0B1E36]">
                {community.membersCount}
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider">
                Anggota
              </span>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px] text-[#F2C010]">★</span>
                <span className="text-[9px] font-black text-[#0B1E36] uppercase tracking-wide">
                  Verified
                </span>
              </div>
            </div>

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

        {/* Tentang Komunitas Description Block */}
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

        {/* Dark Navy Discussion Card */}
        <div className="px-4 pt-5 pb-24 max-w-lg mx-auto w-full">
          <div className="bg-[#0B1E36] rounded-2xl p-4 text-white flex items-start gap-3 shadow-md">
            <div className="w-8 h-8 rounded-lg bg-[#F2C010] flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-[#0B1E36]" fill="currentColor" viewBox="0 0 24 24">
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

        {/* Wide Bottom Join Button */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-40 max-w-lg mx-auto w-full md:bottom-4">
          <button
            onClick={handleJoinCommunity}
            disabled={joining}
            className="w-full py-3.5 bg-[#0B1E36] rounded-full text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:bg-black/90 active:scale-99 transition-all cursor-pointer shrink-0"
          >
            {joining ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Bergabung...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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
  // VIEW 2: ACTIVE DISCUSSION FEED & MESSAGES (JOINED) exactly matching Screen 1, 2, and 3
  // ==========================================
  return (
    <div className="flex-1 w-full bg-[#E2E5E9]/20 flex flex-col min-h-screen relative font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-6 py-3 rounded-full shadow-lg text-center text-xs animate-bounce">
          {successToast}
        </div>
      )}

      {/* 1. Header Banner exactly matching Screen 1/2/3 */}
      <div className="bg-[#0B1E36] px-4 py-3 flex items-center justify-between w-full shadow-sm text-white shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Back arrow button */}
          <Link href="/community/join" className="text-white hover:opacity-80 transition-opacity p-1">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          {/* Abbreviation Badge square matching mockup */}
          <div className={`w-9 h-9 rounded-lg ${community.avatarColor} border border-white/20 flex items-center justify-center shrink-0 font-extrabold text-sm shadow-sm`}>
            {community.initials}
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            <h1 className="font-extrabold text-xs tracking-tight truncate">{community.name}</h1>
            <span className="text-[9px] font-semibold text-slate-300 mt-0.5">{community.onlineCount} online</span>
          </div>
        </div>

        {/* Three dots vertical menu on the right matching Screen 3 */}
        <button className="p-1 hover:opacity-80 transition-opacity">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* 2. Admin banner exactly matching Screen 3 */}
      {isAdmin && (
        <div className="bg-[#FEF08A] px-4 py-2 flex items-center justify-between w-full border-b border-amber-200/50 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0B1E36]">
            {/* Yellow Dot icon as in Screen 3 */}
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2C010] border border-amber-400 inline-block"></span>
            Anda adalah admin
          </div>
          {/* Yellow pill edit button matching screen 3 */}
          <button 
            onClick={() => triggerToast("Edit Informasi Komunitas segera hadir!")}
            className="px-3 py-1 bg-[#F2C010] text-[#0B1E36] font-black text-[9px] rounded-lg border border-amber-400 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Edit Informasi
          </button>
        </div>
      )}

      {/* 3. Cream Tabs Bar exactly matching Screen 1/2/3 */}
      <div className="bg-[#FFFBEB] w-full border-b border-amber-100 flex items-center shrink-0">
        {isAdmin ? (
          // Admin View: 3 tabs matching Screen 3
          <div className="flex w-full">
            {["Postingan", "Anggota", "Set Event"].map((tab) => {
              const isTabActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-center py-3 text-xs font-black transition-all cursor-pointer ${
                    isTabActive 
                      ? "text-[#0B1E36] border-b-4 border-[#F2C010]" 
                      : "text-slate-400 hover:text-[#0B1E36]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        ) : (
          // Member View: 2 tabs matching Screen 1/2
          <div className="flex w-full">
            {["Postingan", "Info"].map((tab) => {
              const isTabActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-center py-3 text-xs font-black transition-all cursor-pointer ${
                    isTabActive 
                      ? "text-[#0B1E36] border-b-4 border-[#F2C010]" 
                      : "text-slate-400 hover:text-[#0B1E36]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Layout Content Container */}
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-5 flex flex-col gap-5 pb-28 overflow-y-auto">
        {activeTab === "Postingan" && (
          <>
            {/* 4. Post Editor exactly matching Screen 1/2 & Screen 3 */}
            <form onSubmit={handleCreatePost} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Gray Avatar circle */}
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-extrabold text-xs text-slate-500 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-extrabold text-[#0B1E36]">Anonymous</span>
                </div>

                {/* Interactive Toggle matching Screen 1/2 */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-slate-500">Anonim</span>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer outline-none relative ${
                      isAnonymous ? "bg-[#0B1E36]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        isAnonymous ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Textarea matching screen */}
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Apa yang ingin kamu bagikan?"
                className="w-full min-h-[85px] py-2 text-xs font-bold text-[#0B1E36] placeholder-[#8FA0AF] outline-none resize-none"
                maxLength={1000}
                required
              />

              {/* Bottom Actions Bar */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1">
                <div className="flex items-center gap-3 text-slate-400">
                  {/* Photo icon matching Screen 1/2 */}
                  <button type="button" onClick={() => triggerToast("Unggah foto segera hadir!")} className="hover:text-[#0B1E36] transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {/* Comment icon matching Screen 1/2 */}
                  <button type="button" onClick={() => triggerToast("Tambah tag diskusi!")} className="hover:text-[#0B1E36] transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-6 py-1.5 bg-[#0B1E36] hover:bg-black text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Post
                </button>
              </div>
            </form>

            {/* 5. Speech Bubble Card Feed Feed exactly matching Screen 1/2/3 */}
            <div className="flex flex-col gap-4.5 mt-2">
              {posts.length === 0 ? (
                <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400">Belum ada postingan komunitas. Jadilah yang pertama!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="relative pl-2.5">
                    {/* Left tail speech notch triangle in CSS matching mockup exactly */}
                    <div className="absolute left-[4px] top-[18px] w-0 h-0 border-t-[0px] border-r-[8px] border-r-[#FEF9C3] border-b-[12px] border-b-transparent z-10"></div>

                    {/* Yellow/Cream Bubble Card */}
                    <div className="bg-[#FEF9C3] rounded-2xl p-4.5 flex flex-col gap-3 shadow-sm border border-yellow-200/40 relative">
                      
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar Circle */}
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#854d0e]/10 border border-[#854d0e]/20 shrink-0 font-black text-xs text-[#854d0e]">
                            {post.avatarLetter}
                          </div>

                          <div className="flex flex-col leading-tight min-w-0">
                            <span className="font-extrabold text-xs text-[#0B1E36] truncate">
                              {post.isAnonymous ? "Anonymous" : post.authorName}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                              {post.timeAgo}
                            </span>
                          </div>
                        </div>

                        {/* Top Right Controls (Pin / Delete 🗑️) matching Screen 3 */}
                        <div className="flex items-center gap-2">
                          {/* Pinned badge */}
                          {post.isPinned && (
                            <span className="text-[9px] font-black text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded border border-yellow-300">
                              📌 Sematan
                            </span>
                          )}
                          
                          {/* Admin tools */}
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              {/* Pin toggle */}
                              <button 
                                onClick={() => handleTogglePin(post.id)}
                                className={`p-1 hover:bg-[#FEF08A] rounded text-[#0B1E36] transition-colors cursor-pointer`}
                                title="Sematkan Post"
                              >
                                📌
                              </button>
                              {/* Trash Delete icon */}
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors cursor-pointer"
                                title="Hapus Post"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content Text exactly matching Screen 1/2 */}
                      <div className="text-xs font-semibold text-[#0C0A09] leading-relaxed whitespace-pre-line pr-2 font-mono">
                        {post.content}
                      </div>

                      {/* Mock grid Screenshot image attachments exactly matching Screen 3 */}
                      {(post.imageUrl || post.id === "post-ti-1") && (
                        <div className="mt-1 rounded-xl overflow-hidden border border-yellow-300/40 shadow-sm shrink-0 bg-white p-1">
                          <img 
                            src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80" 
                            alt="Mock design attachment" 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Event calendar card inside bubble exactly matching Screen 3 */}
                      {post.event && (
                        <div className="bg-white border border-yellow-300 rounded-xl p-3.5 flex flex-col gap-3 relative mt-1.5 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">📅</span>
                            <h3 className="text-xs font-black text-[#0B1E36]">
                              {post.event.title}
                            </h3>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 pl-5">
                            {post.event.time}
                          </p>

                          <button
                            onClick={() => handleRegisterEvent(post.id)}
                            className={`w-full py-2 text-[10px] font-black border border-slate-200 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer text-center ${
                              post.event.isRegistered 
                                ? "bg-emerald-100 text-emerald-800" 
                                : "bg-slate-100 hover:bg-slate-200 text-[#0B1E36]"
                            }`}
                          >
                            {post.event.isRegistered ? "✓ Terdaftar" : "Daftar Event"}
                          </button>
                        </div>
                      )}

                      {/* Actions Stats bar exactly matching Screen 1/2 */}
                      <div className="flex items-center gap-4.5 pt-2 mt-1.5 border-t border-[#854d0e]/10">
                        {/* Likes action */}
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1 text-[10px] font-extrabold transition-all cursor-pointer ${
                            post.isLiked ? "text-red-500" : "text-[#0B1E36] hover:scale-105"
                          }`}
                        >
                          <span className="text-xs">❤</span>
                          <span>{post.likes}</span>
                        </button>

                        {/* Comments action - Click openscomments drawer */}
                        <button
                          onClick={() => handleOpenComments(post)}
                          className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0B1E36] hover:scale-105 transition-transform cursor-pointer"
                        >
                          <span className="text-xs">💬</span>
                          <span>{post.commentsCount}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Info / Anggota / Set Event Tabs contents */}
        {activeTab === "Info" && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider">Aturan Komunitas</h2>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              {community.rules || "Selamat datang! Patuhi etika akademik, hormati sesama mahasiswa, dan gunakan wadah ini untuk kolaborasi yang sehat."}
            </p>
          </div>
        )}

        {activeTab === "Anggota" && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider">Daftar Anggota</h2>
            <div className="flex flex-col gap-3">
              {[user.name, "Ahmad Mahasiswa", "North Otto", "Duang Suppakarn"].map((name, i) => (
                <div key={i} className="flex items-center gap-2.5 pb-2 border-b border-slate-50 text-xs font-bold text-[#0B1E36]">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] border border-slate-200 text-slate-500">
                    {name.charAt(0)}
                  </div>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Set Event" && (
          <form onSubmit={handleCreateEvent} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider">Set Event Baru</h2>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400">NAMA EVENT</label>
              <input 
                type="text" 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Webinar UI/UX Beginner"
                className="w-full bg-slate-50 rounded-xl p-2.5 text-xs font-bold outline-none border border-slate-150 focus:bg-white"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400">JADWAL / WAKTU</label>
              <input 
                type="text" 
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="Jumat, 12 Juli 2026 | Zoom Meeting"
                className="w-full bg-slate-50 rounded-xl p-2.5 text-xs font-bold outline-none border border-slate-150 focus:bg-white"
                required
              />
            </div>

            <button 
              type="submit"
              className="py-3 bg-[#0B1E36] text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-black transition-all cursor-pointer"
            >
              Terbitkan Event
            </button>
          </form>
        )}
      </div>

      {/* FAB button in bottom right corner matching Screen 1/2 */}
      {community.isJoined && activeTab === "Postingan" && (
        <button
          onClick={() => triggerToast("Tulis sesuatu...")}
          className="fixed bottom-20 right-5 w-12 h-12 rounded-full bg-[#F2C010] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer z-40"
        >
          <span className="text-2xl font-black text-[#0B1E36] leading-none">+</span>
        </button>
      )}

      {/* ==========================================
          INTERACTIVE COMMENTS SHEET / MODAL DRAWER
          ========================================== */}
      {activeCommentPost && (
        <div className="fixed inset-0 bg-[#0B1E36]/40 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg min-h-[50vh] max-h-[85vh] p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">💬</span>
                <h3 className="text-sm font-black text-[#0B1E36]">Komentar Postingan</h3>
              </div>
              <button 
                onClick={() => setActiveCommentPost(null)}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center font-bold text-[#0B1E36] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Post Content preview in modal */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs font-bold text-slate-500 line-clamp-2">
              "{activeCommentPost.content}"
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2">
              {comments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs font-bold text-slate-400">Belum ada komentar. Tulis komentar pertama!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-3 text-xs">
                    <div className="w-6.5 h-6.5 rounded-full bg-slate-200 flex items-center justify-center font-extrabold text-[10px] text-slate-600 shrink-0">
                      {comment.avatarLetter}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#0B1E36]">{comment.authorName}</span>
                        <span className="text-[8px] text-slate-400 font-bold">{comment.createdAt}</span>
                      </div>
                      <p className="font-semibold text-slate-600 mt-1 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2 border-t border-slate-100 pt-3">
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tulis komentar..."
                className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-xs font-bold outline-none border border-slate-200 focus:bg-white text-[#0B1E36]"
                required
                disabled={submittingComment}
              />
              <button 
                type="submit"
                disabled={submittingComment}
                className="px-5 py-2.5 bg-[#0B1E36] text-white font-extrabold text-xs rounded-full shadow-md hover:bg-black transition-all cursor-pointer shrink-0"
              >
                {submittingComment ? "..." : "Kirim"}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
