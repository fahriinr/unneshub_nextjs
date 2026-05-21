"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "../hooks/useUserSession";

const FAKULTAS_LIST = [
  "FMIPA (Fakultas Matematika & Ilmu Pengetahuan Alam)",
  "FT (Fakultas Teknik)",
  "FEB (Fakultas Ekonomika dan Bisnis)",
  "FH (Fakultas Hukum)",
  "FISIP (Fakultas Ilmu Sosial dan Ilmu Politik)",
  "FBS (Fakultas Bahasa dan Seni)",
  "FIP (Fakultas Ilmu Pendidikan)",
  "FIK (Fakultas Ilmu Keolahragaan)",
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateProfile } = useUserSession();
  const [isEditing, setIsEditing] = useState(false);

  // Edit state forms
  const [editName, setEditName] = useState("");
  const [editNim, setEditNim] = useState("");
  const [editFakultas, setEditFakultas] = useState("");
  const [editJurusan, setEditJurusan] = useState("");
  const [editProdi, setEditProdi] = useState("");
  const [editAngkatan, setEditAngkatan] = useState("");
  const [editMinat, setEditMinat] = useState<string[]>([]);
  const [newMinatTag, setNewMinatTag] = useState("");

  // Sync state with user data once loaded
  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditNim(user.nim);
      setEditFakultas(user.fakultas);
      setEditJurusan(user.jurusan);
      setEditProdi(user.prodi);
      setEditAngkatan(user.angkatan);
      setEditMinat(user.minat || []);
    }
  }, [user, isEditing]);

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
          Memuat data profil...
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    updateProfile({
      name: editName.trim(),
      nim: editNim.trim(),
      fakultas: editFakultas,
      jurusan: editJurusan.trim(),
      prodi: editProdi.trim(),
      angkatan: editAngkatan.trim(),
      minat: editMinat,
    });
    setIsEditing(false);
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

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 bg-[#FDFBF7] flex flex-col gap-6">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-bold text-primary-dark hover:underline transition-all"
        >
          <span className="text-lg">‹</span> Kembali
        </Link>
      </div>

      {/* Main Profile Neo-Card */}
      <div className="neo-card-thick bg-white overflow-hidden p-0 relative">
        {/* Banner Area */}
        <div className="h-44 bg-[#E5E7EB] border-b-2 border-primary-dark relative flex items-center justify-center text-slate-400">
          <svg className="w-12 h-12 stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
          </svg>
          <span className="absolute bottom-2 right-3 text-[10px] font-extrabold bg-white border border-primary-dark px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#0A1D37]">
            Dimensi Rekomendasi: 1200x400
          </span>
        </div>

        {/* Card Header & Avatar Segment */}
        <div className="px-6 md:px-8 pb-8 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            {/* Avatar Container (overlapped) */}
            <div className="relative -mt-20 md:-mt-24 w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-primary-dark bg-white overflow-hidden shadow-[3px_3px_0px_0px_var(--color-primary-dark)] flex items-center justify-center z-10">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FEF3C7] flex items-center justify-center">
                  <svg className="w-14 h-14 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Edit Profile Action */}
            <button
              onClick={() => setIsEditing(true)}
              className="neo-button-white text-xs py-2 px-4 flex items-center gap-1.5 ml-auto md:ml-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Edit Profil
            </button>
          </div>

          {/* User Name and Handle */}
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-primary-dark tracking-tight">{user.name}</h2>
            <p className="text-sm font-semibold text-text-muted mt-0.5">
              @{user.email.split("@")[0]}
            </p>
          </div>

          {/* Details Table/Grid */}
          <div className="border-t-2 border-slate-100 pt-6 flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-3 py-1 border-b border-dashed border-slate-100">
              <span className="font-bold text-text-muted">Fakultas</span>
              <span className="col-span-2 font-extrabold text-primary-dark">{user.fakultas}</span>
            </div>
            
            <div className="grid grid-cols-3 py-1 border-b border-dashed border-slate-100">
              <span className="font-bold text-text-muted">Jurusan</span>
              <span className="col-span-2 font-extrabold text-primary-dark">
                {user.jurusan || "Belum diisi"}
              </span>
            </div>

            <div className="grid grid-cols-3 py-1 border-b border-dashed border-slate-100">
              <span className="font-bold text-text-muted">Prodi</span>
              <span className="col-span-2 font-extrabold text-primary-dark">
                {user.prodi || "Belum diisi"}
              </span>
            </div>

            <div className="grid grid-cols-3 py-1 border-b border-dashed border-slate-100">
              <span className="font-bold text-text-muted">Angkatan</span>
              <span className="col-span-2 font-extrabold text-primary-dark">
                {user.angkatan || "Belum diisi"}
              </span>
            </div>

            {/* Interest Tags */}
            <div className="grid grid-cols-3 py-2 items-center">
              <span className="font-bold text-text-muted">Minat</span>
              <div className="col-span-2 flex flex-wrap gap-2">
                {user.minat && user.minat.length > 0 ? (
                  user.minat.map((tag) => (
                    <span key={tag} className="neo-badge text-xs bg-white">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-text-muted italic">
                    Belum ada minat yang ditambahkan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-[#0A1D37]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border-2.5 border-primary-dark rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_0px_var(--color-primary-dark)] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-100 mb-6">
              <h3 className="text-xl font-extrabold text-primary-dark tracking-tight">📝 Edit Profil Saya</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full border border-primary-dark flex items-center justify-center font-bold text-primary-dark hover:bg-slate-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Edit Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="neo-input text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">NIM</label>
                  <input
                    type="text"
                    value={editNim}
                    onChange={(e) => setEditNim(e.target.value)}
                    className="neo-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">Angkatan</label>
                  <input
                    type="text"
                    value={editAngkatan}
                    onChange={(e) => setEditAngkatan(e.target.value)}
                    placeholder="e.g. 2021"
                    className="neo-input text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">Fakultas</label>
                <select
                  value={editFakultas}
                  onChange={(e) => setEditFakultas(e.target.value)}
                  className="neo-input text-sm appearance-none cursor-pointer"
                >
                  {FAKULTAS_LIST.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">Jurusan</label>
                  <input
                    type="text"
                    value={editJurusan}
                    onChange={(e) => setEditJurusan(e.target.value)}
                    placeholder="e.g. Ilmu Komputer"
                    className="neo-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">Prodi</label>
                  <input
                    type="text"
                    value={editProdi}
                    onChange={(e) => setEditProdi(e.target.value)}
                    placeholder="e.g. Sistem Informasi (S1)"
                    className="neo-input text-sm"
                  />
                </div>
              </div>

              {/* Interest Tag Edit Section */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">
                  Minat / Topik (Tekan Enter untuk menambah)
                </label>
                <input
                  type="text"
                  value={newMinatTag}
                  onChange={(e) => setNewMinatTag(e.target.value)}
                  onKeyDown={handleAddMinat}
                  placeholder="Tambahkan minat..."
                  className="neo-input text-sm mb-2"
                />
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border-2 border-primary-dark rounded-lg min-h-[50px]">
                  {editMinat.length > 0 ? (
                    editMinat.map((tag) => (
                      <span
                        key={tag}
                        className="neo-badge-yellow text-xs flex items-center gap-1.5 cursor-pointer hover:bg-amber-300"
                        onClick={() => handleRemoveMinat(tag)}
                        title="Klik untuk menghapus"
                      >
                        {tag} <span className="font-extrabold text-[10px]">✕</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-semibold text-text-muted italic">
                      Belum ada minat. Ketik di atas dan tekan Enter.
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Save Action Buttons */}
              <div className="flex justify-end gap-3 mt-4 border-t-2 border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="neo-button-white text-xs px-4 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="neo-button-yellow text-xs px-6 py-2"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
