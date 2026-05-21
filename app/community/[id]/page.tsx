"use client";

import { useState, useEffect } from "react";
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

const INITIAL_POSTS: PostItem[] = [
  {
    id: "post-1",
    authorName: "Ahmad Mahasiswa",
    authorEmail: "ahmad@students.unnes.ac.id",
    authorNim: "1201421099",
    avatarLetter: "A",
    timeAgo: "2 jam yang lalu",
    content: "Ada yang tau jadwal krs semester depan dibuka kapan ya? Tolong infonya dong temen temen 🙏",
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
    content: "Halo teman-teman! HIMA Sistem Informasi kembali mengadakan Webinar UI/UX Design khusus untuk pemula. Yuk, daftarkan diri kalian segera!",
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

export default function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, loading } = useUserSession();
  
  // Local storage post state
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postText, setPostText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // New event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Load from localStorage or pre-seed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("unneshub_posts");
      if (stored) {
        try {
          setPosts(JSON.parse(stored));
        } catch (e) {
          setPosts(INITIAL_POSTS);
        }
      } else {
        setPosts(INITIAL_POSTS);
        localStorage.setItem("unneshub_posts", JSON.stringify(INITIAL_POSTS));
      }
    }
  }, []);

  // Sync back to localStorage
  const savePosts = (updatedPosts: PostItem[]) => {
    setPosts(updatedPosts);
    if (typeof window !== "undefined") {
      localStorage.setItem("unneshub_posts", JSON.stringify(updatedPosts));
    }
  };

  // Route protection
  useEffect(() => {
    if (!loading && (!user || !user.isLoggedIn)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="text-center font-bold text-primary-dark">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-primary-dark" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Menghubungkan ke server...
        </div>
      </div>
    );
  }

  // RBAC permissions variables
  const isAdmin = user.role === "community_admin" || user.role === "global_admin";
  const isGlobalAdmin = user.role === "global_admin";

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Create post handler
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!eventTitle.trim() || !eventTime.trim()) return;

    const newEventPost: PostItem = {
      id: `post-event-${Date.now()}`,
      authorName: user.role === "global_admin" ? "Global Admin" : "Admin HIMA SI",
      authorEmail: user.email,
      authorNim: user.nim,
      avatarLetter: user.role === "global_admin" ? "G" : "H",
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

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 bg-[#FDFBF7] flex flex-col gap-6 relative">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#F4C41B] border-2 border-primary-dark text-primary-dark font-extrabold px-6 py-3 rounded-lg shadow-[4px_4px_0px_0px_#0A1D37] animate-bounce">
          🎉 {successToast}
        </div>
      )}

      {/* Back to Home Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-bold text-primary-dark hover:underline transition-all"
        >
          <span className="text-lg">‹</span> Kembali ke Beranda
        </Link>
      </div>

      {/* Active POV Info Badge (Sleek Brutalist Banner) */}
      <div className="flex justify-between items-center bg-white border-2 border-primary-dark rounded-xl p-3.5 shadow-[3px_3px_0px_0px_#0A1D37]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-text-muted">Status Akun:</span>
          <span className={`text-[10px] font-black border border-primary-dark rounded px-2.5 py-0.5 shadow-[1px_1px_0px_0px_#0A1D37] ${
            isAdmin ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
          }`}>
            {isAdmin ? "Admin POV" : "Member POV"}
          </span>
        </div>
        <p className="text-[10px] font-extrabold text-text-muted text-right max-w-[200px] leading-tight hidden sm:block">
          Ubah role simulasi di avatar pojok kanan atas untuk melihat hak akses berbeda.
        </p>
      </div>

      {/* Community Details Card */}
      <div className="neo-card-thick bg-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight leading-tight">
            HIMA Sistem Informasi
          </h1>
          <p className="text-sm font-semibold text-text-muted leading-relaxed">
            Wadah aspirasi dan kreasi mahasiswa Sistem Informasi Universitas Negeri Semarang.
          </p>
        </div>
        
        {/* Community Avatar Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-primary-dark bg-slate-100 flex items-center justify-center shadow-[3.5px_3.5px_0px_0px_#0A1D37] flex-shrink-0">
          <svg className="w-10 h-10 md:w-12 md:h-12 text-primary-dark stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.97 5.97 0 00-.75-2.98m-.94-3.197a5.97 5.97 0 00-.751-2.98m-6 6.223A9 9 0 0012 15c2.22 0 4.258-.77 5.862-2.064m-1.543-3.14c.264.986.423 2.082.423 3.204a11.954 11.954 0 01-2.128 6.89M15 9.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </div>
      </div>

      {/* Discussion Creation Segment */}
      <div className="flex gap-4 items-stretch">
        {/* Posting Form */}
        <form onSubmit={handleCreatePost} className="neo-card flex-1 p-5 flex flex-col gap-4">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="Apa yang ingin anda diskusikan?"
            className="w-full min-h-[96px] bg-slate-50 border-2 border-primary-dark rounded-lg p-3 text-sm font-semibold focus:outline-none focus:bg-white focus:shadow-[2.5px_2.5px_0px_0px_var(--color-primary-dark)] transition-all resize-none text-primary-dark"
            maxLength={500}
            required
          />
          
          <div className="flex justify-between items-center">
            {/* Anonymous Toggle Option */}
            <label className="flex items-center gap-2.5 text-xs font-bold text-primary-dark cursor-pointer group">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-primary-dark border-2 border-primary-dark rounded cursor-pointer"
              />
              <span className="group-hover:underline">Kirim sebagai Anonymous</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="neo-button-dark px-6 py-2 text-xs"
            >
              Posting
            </button>
          </div>
        </form>

        {/* Tambah Event Card - Active/Visible ONLY in Admin POV */}
        {isAdmin && (
          <button
            onClick={() => setShowEventModal(true)}
            className="w-32 md:w-36 border-2 border-dashed border-primary-dark rounded-xl bg-white flex flex-col items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_rgba(10,29,55,0.05)] hover:bg-slate-50 hover:shadow-[3px_3px_0px_0px_#0A1D37] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#0A1D37] transition-all flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-primary-dark flex items-center justify-center">
              <span className="text-xl font-bold">+</span>
            </div>
            <span className="text-xs font-black text-primary-dark tracking-wide">
              Tambah Event
            </span>
          </button>
        )}
      </div>

      {/* Beranda Postingan Feed */}
      <div className="mt-4 flex flex-col gap-6">
        <h2 className="text-xl font-black text-primary-dark tracking-tight pb-2 border-b-2 border-primary-dark">
          Beranda Postingan
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-10 bg-white border-2 border-primary-dark border-dashed rounded-xl">
            <p className="text-sm font-bold text-text-muted">Belum ada postingan komunitas. Jadilah yang pertama!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="neo-card bg-white p-6 flex flex-col gap-4 relative">
              
              {/* Post Header */}
              <div className="flex items-center gap-3">
                {/* Author Avatar */}
                <div className="w-10 h-10 rounded-full border-2 border-primary-dark overflow-hidden flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#0A1D37] bg-amber-50">
                  {post.isAnonymous ? (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                      ?
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#FEF3C7] text-primary-dark flex items-center justify-center font-black text-sm">
                      {post.avatarLetter}
                    </div>
                  )}
                </div>

                {/* Author Credentials */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-extrabold text-sm text-primary-dark">
                      {post.isAnonymous ? "Anonymous" : post.authorName}
                    </span>
                    {/* Role badge if not anonymous */}
                    {!post.isAnonymous && post.authorName.includes("Admin") && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 rounded px-1">
                        Komunitas Admin
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-text-muted block">
                    {post.timeAgo}
                  </span>
                </div>

                {/* Global Admin Security Clearance Indicator */}
                {post.isAnonymous && isGlobalAdmin && (
                  <div className="absolute top-4 right-4 bg-red-50 border-2 border-red-500 rounded-lg p-2 max-w-[200px] text-[10px] font-black text-red-800 shadow-[2px_2px_0px_0px_#EF4444] animate-pulse">
                    🚨 Admin Clear: 
                    <span className="block font-bold">Nama: {post.authorName}</span>
                    <span className="block font-medium">NIM: {post.authorNim}</span>
                  </div>
                )}
              </div>

              {/* Post Description Content */}
              <div className="text-sm font-semibold text-primary-dark leading-relaxed whitespace-pre-line">
                {post.content}
              </div>

              {/* Featured Event Element (If exists in Post) */}
              {post.event && (
                <div className="neo-card bg-amber-50 p-5 flex flex-col gap-4 border-2 border-primary-dark relative">
                  <div className="flex">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#F4C41B] text-primary-dark border-2 border-primary-dark rounded px-2.5 py-0.5 shadow-[1.5px_1.5px_0px_0px_#0A1D37]">
                      📅 EVENT MENDATANG
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-extrabold text-primary-dark">
                      {post.event.title}
                    </h3>
                    <p className="text-xs font-bold text-text-muted">
                      {post.event.time}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRegisterEvent(post.id)}
                    className={`w-full py-2.5 text-xs font-extrabold border-2 border-primary-dark rounded-lg shadow-[2.5px_2.5px_0px_0px_#0A1D37] cursor-pointer transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1px_1px_0px_0px_#0A1D37] ${
                      post.event.isRegistered 
                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                        : "bg-[#0A1D37] text-white hover:bg-slate-800"
                    }`}
                  >
                    {post.event.isRegistered ? "✓ Terdaftar" : "Daftar Event"}
                  </button>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center gap-6 pt-3 border-t border-slate-100 mt-2">
                {/* Like / Upvote metric */}
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-transform hover:scale-105 cursor-pointer ${
                    post.isLiked ? "text-red-500 font-extrabold" : "text-primary-dark"
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 ${post.isLiked ? "fill-red-500 stroke-red-500" : "fill-none stroke-current stroke-[2]"}`} 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span>{post.likes}</span>
                </button>

                {/* Comment Counter indicator */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary-dark">
                  <svg className="w-5 h-5 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <span>{post.commentsCount}</span>
                </div>

                {/* Share action */}
                <button
                  onClick={() => triggerToast("Tautan postingan disalin ke papan klip!")}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-dark hover:scale-105 cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  <span>Bagikan</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* CREATE EVENT MODAL (Active ONLY for Admins) */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-[#0A1D37]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2.5 border-primary-dark rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_0px_var(--color-primary-dark)] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-100 mb-6">
              <h3 className="text-lg font-black text-primary-dark tracking-tight">📅 Buat Event Komunitas</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="w-8 h-8 rounded-full border border-primary-dark flex items-center justify-center font-bold text-primary-dark hover:bg-slate-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">Nama Event</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Webinar UI/UX Design untuk Pemula"
                  className="neo-input text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">Jadwal / Waktu Pelaksanaan</label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="e.g. Jumat, 24 Mei 2026 | Zoom Meeting"
                  className="neo-input text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">Lokasi / Tautan Link</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Zoom Meeting / Aula Dekanat"
                  className="neo-input text-sm"
                />
              </div>

              {/* Save actions */}
              <div className="flex justify-end gap-3 mt-4 border-t-2 border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="neo-button-white text-xs px-4 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="neo-button-yellow text-xs px-6 py-2"
                >
                  Buat Event
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
