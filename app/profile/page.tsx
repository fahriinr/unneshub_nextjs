"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSession } from "../hooks/useUserSession";
import { ProfileSkeleton } from "../components/Skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const FAKULTAS_LIST = [
  "FMIPA (Fakultas Matematika dan Ilmu Pengetahuan Alam)",
  "FT (Fakultas Teknik)",
  "FEB (Fakultas Ekonomika dan Bisnis)",
  "FH (Fakultas Hukum)",
  "FISIP (Fakultas Ilmu Sosial dan Ilmu Politik)",
  "FBS (Fakultas Bahasa dan Seni)",
  "FIP (Fakultas Ilmu Pendidikan)",
];

const PREDEFINED_MINAT = [
  "#Akademik",
  "#Teknologi",
  "#Karier",
  "#Organisasi",
  "#Hobi",
  "#Olahraga",
  "#Kreativitas",
  "#Event",
];

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading, updateProfile, logout } = useUserSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Form states
  const [editName, setEditName] = useState("");
  const [editNim, setEditNim] = useState("");
  const [editFakultas, setEditFakultas] = useState("");
  const [editMinat, setEditMinat] = useState<string[]>([]);
  const [newMinatTag, setNewMinatTag] = useState("");
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Route protection
  useEffect(() => {
    if (!loading && (!user || !user.isLoggedIn)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch real profile from DB
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Gagal mengambil data profil");
      return await res.json();
    },
    enabled: !!user?.isLoggedIn,
    staleTime: 1000 * 30,
  });

  // Derive profile fields from DB data
  const dbName = profileData?.name || user?.name || "";
  const dbEmail = profileData?.email || user?.email || "";
  const dbNim = profileData?.nim || "";
  const dbFakultas = profileData?.fakultas || "";
  const dbImage = profileData?.image || null;

  // Stats from DB
  const joinedCount = profileData?.memberships?.length || 0;
  const postsCount = profileData?.posts?.length || 0;
  const adminCount = (() => {
    const adminCommunityIds = new Set<string>();
    // Communities where user has ADMIN membership role
    profileData?.memberships?.forEach((m: any) => {
      if (m.role === "ADMIN")
        adminCommunityIds.add(m.communityId || m.community?.id);
    });
    // Communities the user created (they are implicitly admin)
    profileData?.createdCommunities?.forEach((c: any) => {
      adminCommunityIds.add(c.id);
    });
    return adminCommunityIds.size;
  })();

  // Sync form state when profile data loads
  const [initializedFrom, setInitializedFrom] = useState<string | null>(null);
  useEffect(() => {
    const profileId = profileData?.id;
    if (profileId && profileId !== initializedFrom) {
      setInitializedFrom(profileId);
      setEditName(dbName);
      setEditNim(dbNim);
      setEditFakultas(dbFakultas);
      setEditMinat(user?.minat || []);
    }
  }, [profileData, dbName, dbNim, dbFakultas, initializedFrom, user?.minat]);

  if (loading || !user || isLoadingProfile) {
    return <ProfileSkeleton />;
  }

  // Handle Logout Confirmation
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleCancel = () => {
    setEditName(dbName);
    setEditNim(dbNim);
    setEditFakultas(dbFakultas);
    setEditMinat(user?.minat || []);
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
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          nim: editNim.trim(),
          fakultas: editFakultas,
          prodi: user.prodi || "",
          angkatan: user.angkatan || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui profil");
      }

      // Update local session state
      updateProfile({
        name: editName.trim(),
        nim: editNim.trim(),
        fakultas: editFakultas,
        minat: editMinat,
      });

      // Invalidate profile cache to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      setSuccessToast("Profil berhasil diperbarui! 🎉");
      setTimeout(() => setSuccessToast(""), 3000);
      setIsEditing(false);
    } catch (err: any) {
      setFormError(err.message || "Gagal memperbarui profil");
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

  const avatarInitial = (dbName || "F").charAt(0).toUpperCase();

  return (
    <div className="flex-1 w-full bg-[#FDFBF7] flex flex-col min-h-screen relative font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-6 py-4 rounded-xl shadow-lg text-center text-sm animate-bounce">
          {successToast}
        </div>
      )}

      <div className="flex-1 w-full max-w-lg md:max-w-4xl mx-auto px-4 py-5 flex flex-col md:flex-row gap-6 items-start pb-28 mt-2">
        {/* Left Column: Avatar, Stats, & Actions (Save/Cancel/Logout) */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="relative bg-[#0B1E36] rounded-2xl pt-10 pb-8 px-6 text-center text-white shadow-md">
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
              {isEditing ? "Batal" : "Edit"}
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
                <p className="text-[10px] text-slate-400 mt-1 select-none leading-none">
                  {dbEmail}
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-extrabold tracking-tight leading-snug">
                  {dbName}
                </h1>
                <p className="text-xs font-semibold text-slate-300 mt-1 select-none leading-none">
                  {dbEmail}
                </p>
              </>
            )}

            {/* Stat Row */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10 text-xs font-extrabold text-white select-none">
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-[#F2C010]">
                  {joinedCount}
                </span>
                <span className="text-[8px] font-bold text-slate-300 uppercase mt-0.5 leading-none">
                  Komunitas
                </span>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-[#F2C010]">
                  {postsCount}
                </span>
                <span className="text-[8px] font-bold text-slate-300 uppercase mt-0.5 leading-none">
                  Postingan
                </span>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-[#F2C010]">
                  {adminCount}
                </span>
                <span className="text-[8px] font-bold text-slate-300 uppercase mt-0.5 leading-none">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Left Column Action Buttons for Save / Logout */}
          {!showLogoutConfirm && (
            <div className="w-full">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleSave}
                    className="w-full py-3.5 bg-[#0B1E36] hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center uppercase tracking-wide"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full py-3 bg-slate-105 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center uppercase tracking-wide border border-slate-200"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-3.5 bg-[#EF4444] hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center uppercase tracking-wide"
                >
                  Keluar Akun
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Fields (NIM, Fakultas, Minat) */}
        <div className="w-full md:flex-1 bg-[#E2E5E9]/75 border border-slate-200/50 rounded-2xl px-5 py-6 flex flex-col gap-5 shadow-sm">
          {showLogoutConfirm ? (
            /* Logout confirmation view */
            <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-md text-center flex flex-col gap-4 animate-in zoom-in-95 duration-200">
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
              {/* NIM Field */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider pl-1 select-none">
                  NIM
                </label>
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
                    {dbNim || "Belum diisi"}
                  </div>
                )}
              </div>

              {/* Fakultas Field */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider pl-1 select-none">
                  Fakultas
                </label>
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
                    {dbFakultas || "Belum diisi"}
                  </div>
                )}
              </div>

              {/* Minat Tags Field */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider pl-1 select-none">
                  Minat
                </label>

                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 italic pl-1 select-none">
                      Pilih minat Anda dari daftar di bawah (bisa pilih
                      beberapa):
                    </span>
                    <div className="flex flex-wrap gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm select-none">
                      {PREDEFINED_MINAT.map((tag) => {
                        const isSelected = editMinat.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditMinat(
                                  editMinat.filter((t) => t !== tag),
                                );
                              } else {
                                setEditMinat([...editMinat, tag]);
                              }
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center gap-1 ${
                              isSelected
                                ? "bg-[#0B1E36] text-[#F2C010] border-[#0B1E36] shadow-sm font-black"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {tag}
                            <span className="text-[9px] opacity-75">
                              {isSelected ? "✓" : "+"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {editMinat.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-150 select-none">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block w-full pl-1 mb-1 select-none">
                          Terpilih:
                        </span>
                        {editMinat.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 bg-amber-100 border border-amber-200/50 text-[#0B1E36] rounded-full text-[9px] font-extrabold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 min-h-[42px] select-text">
                    {user.minat && user.minat.length > 0 ? (
                      user.minat.map((tag) => (
                        <span
                          key={tag}
                          className="px-3.5 py-1.5 bg-white border border-slate-150 rounded-full text-[10px] font-extrabold text-[#0B1E36] shadow-sm"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic pl-1">
                        Belum ada minat
                      </span>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
