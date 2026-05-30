"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserSession } from "../../hooks/useUserSession";
import { useQueryClient } from "@tanstack/react-query";
import { uploadFile } from "@/lib/upload";

export default function CreateCommunityPage() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const queryClient = useQueryClient();

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("AKADEMIK");
  const [description, setDescription] = useState("");
  const rules = "";
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  // Simulation states
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Ukuran gambar profile maksimal 5MB!");
      return;
    }

    setProfileImageFile(file);
    setProfileImage(URL.createObjectURL(file));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (name.trim().length < 3) {
      setFormError("Nama komunitas minimal 3 karakter!");
      return;
    }
    if (description.trim().length < 10) {
      setFormError("Deskripsi komunitas minimal 10 karakter!");
      return;
    }

    setSubmitting(true);

    // Upload image to Supabase Storage if file is selected
    let coverImageUrl = null;
    if (profileImageFile) {
      try {
        coverImageUrl = await uploadFile(profileImageFile, "communityProfile", () => {});
      } catch (uploadErr: unknown) {
        const err = uploadErr as Error;
        setFormError(err.message || "Gagal mengunggah gambar profil.");
        setSubmitting(false);
        return;
      }
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const payload = {
      name: name.trim(),
      slug,
      description: description.trim(),
      category,
      rules: rules.trim(),
      tags,
      coverImage: coverImageUrl,
    };

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat komunitas");
      }

      queryClient.invalidateQueries({ queryKey: ["myCommunities"] });
      router.refresh();
      setSuccessToast("Komunitas berhasil dibuat! Sedang ditinjau oleh Admin ⏳🎉");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (apiError: unknown) {
      const err = apiError as Error;
      setFormError(err.message || "Gagal membuat komunitas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-white flex flex-col min-h-screen">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-6 py-4 rounded-xl shadow-lg text-center text-sm animate-bounce">
          {successToast}
        </div>
      )}

      {/* Dark Navy Header Banner matching Screen 3
      <div className="bg-[#0B1E36] px-4 py-4 flex items-center justify-between w-full shadow-sm">
        <span className="text-white font-black text-xl tracking-tight">UnnesHub</span>
        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
          <svg className="w-4.5 h-4.5 text-[#0B1E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.041 9.041 0 01-3.185 0M17 11V7a5 5 0 00-7-4.887A5.006 5.006 0 005 7v4a5.986 5.986 0 01-.294 1.828l-1.005 3.013c-.115.346.124.694.487.694h13.624c.363 0 .602-.348.487-.694l-1.005-3.013a5.986 5.986 0 01-.294-1.828z" />
          </svg>
        </button>
      </div> */}

      {/* Back link */}
      <div className="px-4 pt-6 max-w-lg mx-auto w-full">
        <Link
          href="/community/join"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:underline transition-all"
        >
          <span className="text-sm">‹</span> Kembali
        </Link>
      </div>

      {/* Screen Title & Layout Container */}
      <div className="px-4 pb-24 max-w-lg mx-auto w-full flex flex-col gap-6 mt-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-extrabold text-[#0B1E36] tracking-tight">
            Buat Komunitas
          </h1>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-xs font-extrabold text-red-600 animate-shake">
            ⚠️ {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* NAMA KOMUNITAS */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              NAMA KOMUNITAS
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Teknik Informatika 2024"
              className="w-full bg-[#E2E5E9] rounded-xl p-3 text-xs font-bold text-[#0B1E36] outline-none placeholder-[#8FA0AF] transition-all"
              maxLength={50}
              required
              disabled={submitting}
            />
          </div>

          {/* KATEGORI */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              KATEGORI
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#E2E5E9] rounded-xl p-3 text-xs font-bold text-[#0B1E36] outline-none appearance-none cursor-pointer"
              disabled={submitting}
            >
              <option value="AKADEMIK">AKADEMIK</option>
              <option value="HOBI">HOBI</option>
              <option value="KARIR">KARIR</option>
              <option value="ORGANISASI">ORGANISASI</option>
              <option value="EVENT">EVENT</option>
            </select>
          </div>

          {/* DESKRIPSI */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              DESKRIPSI
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Visi, misi, dan deskripsi kegiatan komunitas..."
              className="w-full min-h-[96px] bg-[#E2E5E9] rounded-xl p-3 text-xs font-bold text-[#0B1E36] outline-none placeholder-[#8FA0AF] resize-none transition-all"
              maxLength={500}
              required
              disabled={submitting}
            />
          </div>

          {/* TAGS */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              TAGS KOMUNITAS
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-[#0B1E36] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                    className="text-white/60 hover:text-white ml-0.5 cursor-pointer"
                    disabled={submitting}
                  >✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const val = tagInput.trim();
                    if (val && tags.length < 10 && !tags.includes(val)) {
                      setTags([...tags, val]);
                      setTagInput("");
                    }
                  }
                }}
                placeholder="Ketik tag lalu tekan Enter"
                className="flex-1 bg-[#E2E5E9] rounded-xl p-3 text-xs font-bold text-[#0B1E36] outline-none placeholder-[#8FA0AF] transition-all"
                maxLength={30}
                disabled={submitting || tags.length >= 10}
              />
              <button
                type="button"
                onClick={() => {
                  const val = tagInput.trim();
                  if (val && tags.length < 10 && !tags.includes(val)) {
                    setTags([...tags, val]);
                    setTagInput("");
                  }
                }}
                className="px-4 py-2 bg-[#0B1E36] text-white text-[10px] font-extrabold rounded-xl cursor-pointer hover:bg-black/90 transition-all"
                disabled={submitting || tags.length >= 10 || !tagInput.trim()}
              >
                Tambah
              </button>
            </div>
            <span className="text-[9px] font-bold text-slate-500">Maks 10 tag. Contoh: AI, IoT, Robotics</span>
          </div>

          {/* PROFILE PICTURE UPLOAD BLOCK WITH MAX 5MB AND SOFT SQUARE PREVIEW */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              GAMBAR PROFIL KOMUNITAS (MAKS 5MB)
            </label>
            <div className="flex items-center gap-4 bg-[#E2E5E9] p-4 rounded-xl">
              {/* Soft square preview crop matching mockup guidelines */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-300 flex items-center justify-center shrink-0 shadow-sm relative">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-black text-slate-400">DUMMY</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="community-avatar-upload"
                  disabled={submitting}
                />
                <label
                  htmlFor="community-avatar-upload"
                  className="px-4 py-2 bg-white text-[#0B1E36] hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-extrabold text-center cursor-pointer shadow-sm active:scale-98 transition-all block w-max"
                >
                  {profileImage ? "Ubah Gambar" : "Pilih File Gambar"}
                </label>
                <span className="text-[9px] font-bold text-slate-500">Format: JPG, PNG, GIF. Maksimal 5MB.</span>
              </div>
              {profileImage && (
                <button
                  type="button"
                  onClick={() => setProfileImage(null)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold p-1 cursor-pointer"
                  title="Hapus"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Solid Black/Navy Submit Button with user-plus icon matching Screen 3 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#0B1E36] rounded-full text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-99 transition-all cursor-pointer shadow-md mt-4"
          >
            {submitting ? (
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
                Mengirim...
              </>
            ) : (
              <>
                {/* User-Plus icon in white */}
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
                Buat Komunitas
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
