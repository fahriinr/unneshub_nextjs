"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSession } from "../hooks/useUserSession";

const FAKULTAS_LIST = [
  "FMIPA (Fakultas Matematika dan Ilmu Pengetahuan Alam)",
  "FT (Fakultas Teknik)",
  "FEB (Fakultas Ekonomika dan Bisnis)",
  "FH (Fakultas Hukum)",
  "FISIP (Fakultas Ilmu Sosial dan Ilmu Politik)",
  "FBS (Fakultas Bahasa dan Seni)",
  "FIP (Fakultas Ilmu Pendidikan)",
  "FIK (Fakultas Ilmu Keolahragaan)",
];

export interface CommunityDetails {
  id: string;
  name: string;
  category: string;
}

export interface PostItem {
  id: string;
  content: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateProfile, logout } = useUserSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Stats from Database APIs
  const [joinedCount, setJoinedCount] = useState(5); // default mock / fallback
  const [postsCount, setPostsCount] = useState(23); // default mock / fallback
  const [adminCount, setAdminCount] = useState(2); // default mock / fallback

  // Form states
  const [editName, setEditName] = useState("");
  const [editNim, setEditNim] = useState("");
  const [editFakultas, setEditFakultas] = useState("");
  const [editMinat, setEditMinat] = useState<string[]>([]);
  const [newMinatTag, setNewMinatTag] = useState("");
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [prevUser, setPrevUser] = useState<any>(null);

  // Sync state with user session data
  if (user && user !== prevUser) {
    setPrevUser(user);
    setEditName(user.name || "");
    setEditNim(user.nim || "");
    setEditFakultas(user.fakultas || "");
    setEditMinat(user.minat || []);
  }

  // Fetch real profile and stats from database API
  useEffect(() => {
    async function fetchRealProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const profileData = await res.json();
          // Calculate counts
          const joined = profileData.memberships?.length || 0;
          const posts = profileData.posts?.length || 0;
          const admin = (profileData.memberships?.filter((m: any) => m.role === "ADMIN")?.length || 0) + (profileData.createdCommunities?.length || 0);

          setJoinedCount(joined);
          setPostsCount(posts);
          setAdminCount(admin);
        }
      } catch (err) {
        console.warn("Failed to fetch real profile data, using session counts:", err);
      }
    }

    if (user?.isLoggedIn) {
      fetchRealProfile();
    }
  }, [user]);

  // Route protection
  useEffect(() => {
    if (!loading && (!user || !user.isLoggedIn)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="text-center font-bold text-[#0B1E36]">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-[#0B1E36]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat data profil...
        </div>
      </div>
    );
  }

  // Handle Logout Confirmation
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleCancel = () => {
    if (user) {
      setEditName(user.name || "");
      setEditNim(user.nim || "");
      setEditFakultas(user.fakultas || "");
      setEditMinat(user.minat || []);
    }
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (editName.trim().length < 3) {
      setFormError("Nama minimal 3 karakter!");
      return;
    }

    try {
      // 1. Save core attributes in the database
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
          prodi: user.prodi || "",
          angkatan: user.angkatan || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui database profile");
      }

      // 2. Save hybrid offline attributes in Session state
      updateProfile({
        name: editName.trim(),
        nim: editNim.trim(),
        fakultas: editFakultas,
        minat: editMinat,
      });

      setSuccessToast("Profil berhasil diperbarui! 🎉");
      setTimeout(() => setSuccessToast(""), 3000);
      setIsEditing(false);
    } catch (err: any) {
      console.warn("DB Patch failed, updating session only:", err);
      
      // Fallback update session only
      updateProfile({
        name: editName.trim(),
        nim: editNim.trim(),
        fakultas: editFakultas,
        minat: editMinat,
      });

      setSuccessToast("Profil diperbarui! 🎉");
      setTimeout(() => setSuccessToast(""), 3000);
      setIsEditing(false);
    }
  };

  const handleAddMinat = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newMinatTag.trim()) {
      e.preventDefault();
      if (!editMinat.includes(newMinatTag.trim())) {
        setEditMinat([...editMinat, newMinatTag.trim()]);
      }
      setNewMinatTag("");
    }
  };

  const handleRemoveMinat = (tagToRemove: string) => {
    setEditMinat(editMinat.filter((tag) => tag !== tagToRemove));
  };

  const avatarInitial = (user.name || "F").charAt(0).toUpperCase();

  return (
    <div className="flex-1 w-full bg-[#FDFBF7] flex flex-col min-h-screen relative font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-6 py-4 rounded-xl shadow-lg text-center text-sm animate-bounce">
          {successToast}
        </div>
      )}

      {/* Navy Header Block exactly matching Image 3 */}
      <div className="relative bg-[#0B1E36] pt-12 pb-8 px-6 text-center text-white shrink-0 shadow-md">
        {/* Edit Pill Button in top right */}
        <button
          onClick={() => {
            if (isEditing) {
              handleCancel();
            } else {
              setIsEditing(true);
            }
          }}
          className="absolute top-4 right-4 px-4 py-1 bg-[#0B1E36] border border-white/20 hover:bg-white/10 text-white font-extrabold text-[10px] rounded-full transition-all cursor-pointer uppercase tracking-wider shadow-sm"
        >
          Edit
        </button>

        {/* Large Yellow Avatar Circle */}
        <div className="w-24 h-24 bg-[#F2C010] rounded-full border-4 border-[#0B1E36] mx-auto flex items-center justify-center font-black text-4xl text-[#0C0A09] shadow-md mb-3 select-none">
          {avatarInitial}
        </div>

        {/* User Name & Email */}
        {isEditing ? (
          <div className="max-w-[200px] mx-auto">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-center bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm font-extrabold text-white outline-none focus:bg-white/20"
              placeholder="Nama"
            />
            <p className="text-[10px] text-slate-400 mt-1 select-none leading-none">{user.email}</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-extrabold tracking-tight leading-snug">{user.name}</h1>
            <p className="text-xs font-semibold text-slate-300 mt-1 select-none leading-none">{user.email}</p>
          </>
        )}

        {/* Stat Row exactly matching Image 3 */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/10 text-xs font-extrabold text-white select-none">
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-[#F2C010]">{joinedCount}</span>
            <span className="text-[9px] font-bold text-slate-300 uppercase mt-0.5 leading-none">Komunitas</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-[#F2C010]">{postsCount}</span>
            <span className="text-[9px] font-bold text-slate-300 uppercase mt-0.5 leading-none">Postingan</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-[#F2C010]">{adminCount}</span>
            <span className="text-[9px] font-bold text-slate-300 uppercase mt-0.5 leading-none">Admin</span>
          </div>
        </div>
      </div>

      {/* Surface Grey Card Area exactly matching Image 3 */}
      <div className="flex-1 bg-[#E2E5E9]/75 border-t border-slate-200/50 rounded-t-3xl -mt-4 px-5 py-6 flex flex-col gap-5 shadow-inner">
        {showLogoutConfirm ? (
          /* Logout confirmation view overlay inside the grey card */
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-md text-center flex flex-col gap-4 animate-in zoom-in-95 duration-200 mt-4">
            <p className="text-xs font-black text-[#0B1E36] leading-relaxed">
              Anda yakin ingin keluar dari akun ?
            </p>
            <div className="flex gap-3 justify-center mt-2">
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-[#22C55E] text-white font-extrabold text-xs rounded-lg hover:bg-emerald-600 transition-colors shadow-sm active:scale-95 cursor-pointer min-w-[90px]"
              >
                Keluar
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-2.5 bg-[#EF4444] text-white font-extrabold text-xs rounded-lg hover:bg-red-600 transition-colors shadow-sm active:scale-95 cursor-pointer min-w-[90px]"
              >
                Tidak
              </button>
            </div>
          </div>
        ) : (
          /* Standard fields list */
          <>
            {/* NIM Field Container */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider pl-1 select-none">NIM</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editNim}
                  onChange={(e) => setEditNim(e.target.value)}
                  placeholder="2404140065"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#0B1E36] outline-none shadow-sm transition-all focus:border-slate-300"
                />
              ) : (
                <div className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#0B1E36] shadow-sm select-text">
                  {user.nim || "Belum diisi"}
                </div>
              )}
            </div>

            {/* Fakultas Field Container */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider pl-1 select-none">Fakultas</label>
              {isEditing ? (
                <select
                  value={editFakultas}
                  onChange={(e) => setEditFakultas(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#0B1E36] outline-none appearance-none cursor-pointer shadow-sm focus:border-slate-300"
                >
                  <option value="">Pilih Fakultas</option>
                  {FAKULTAS_LIST.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#0B1E36] leading-relaxed shadow-sm select-text">
                  {user.fakultas || "Belum diisi"}
                </div>
              )}
            </div>

            {/* Minat Tags Field Container */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider pl-1 select-none">Minat</label>
              
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={newMinatTag}
                    onChange={(e) => setNewMinatTag(e.target.value)}
                    onKeyDown={handleAddMinat}
                    placeholder="Ketik minat & tekan Enter..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-[#0B1E36] outline-none shadow-sm transition-all focus:border-slate-300"
                  />
                  <div className="flex flex-wrap gap-2 p-2.5 bg-white rounded-xl border border-slate-200 min-h-[42px] shadow-sm select-none">
                    {editMinat.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => handleRemoveMinat(tag)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-red-50 hover:text-red-600 text-[#0B1E36] rounded-full text-[10px] font-extrabold cursor-pointer transition-all border border-amber-200/50"
                        title="Klik untuk menghapus"
                      >
                        {tag} <span className="font-extrabold text-[8px]">✕</span>
                      </span>
                    ))}
                    {editMinat.length === 0 && (
                      <span className="text-[10px] font-bold text-slate-400 italic p-1">Tambahkan minat di atas.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 min-h-[42px] select-text">
                  {user.minat && user.minat.length > 0 ? (
                    user.minat.map((tag) => (
                      <span key={tag} className="px-3.5 py-1.5 bg-white border border-slate-150 rounded-full text-[10px] font-extrabold text-[#0B1E36] shadow-sm">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 italic pl-1">Belum ada minat</span>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {formError && (
              <div className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 p-3.5 rounded-xl">
                ⚠️ {formError}
              </div>
            )}

            {/* Red Action Button at bottom */}
            <div className="mt-4 pb-24 shrink-0">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="w-full py-3.5 bg-[#EF4444] text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-red-600 active:scale-99 transition-all cursor-pointer text-center select-none uppercase tracking-wide"
                >
                  Edit Profil
                </button>
              ) : (
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-3.5 bg-[#EF4444] text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-red-600 active:scale-99 transition-all cursor-pointer text-center select-none uppercase tracking-wide"
                >
                  Keluar Akun
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
