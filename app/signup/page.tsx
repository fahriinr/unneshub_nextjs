"use client";

import { useState } from "react";
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

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useUserSession();
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Nama Lengkap wajib diisi!");
      setLoading(false);
      return;
    }

    if (!nim.trim()) {
      setError("NIM wajib diisi!");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Email wajib diisi!");
      setLoading(false);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@students\.unnes\.ac\.id$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email harus menggunakan domain institusi: @students.unnes.ac.id");
      setLoading(false);
      return;
    }

    if (!fakultas) {
      setError("Fakultas wajib dipilih!");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password wajib diisi!");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter!");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok!");
      setLoading(false);
      return;
    }

    // Success signup flow
    setTimeout(() => {
      signup({
        name: name.trim(),
        nim: nim.trim(),
        email: email.trim().toLowerCase(),
        fakultas: fakultas,
        isLoggedIn: true,
      });
      router.push("/profile");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex-1 min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 py-12">
      {/* Container Card - strictly using .neo-card-thick as defined in design.md */}
      <div className="w-full max-w-md neo-card-thick p-8 hover:scale-[1.005] bg-white">
        {/* Brand/Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#0A1D37] border-2 border-primary-dark flex items-center justify-center shadow-[3px_3px_0px_0px_#F4C41B] mb-4">
            <svg viewBox="0 0 100 100" className="w-12 h-12">
              <path d="M25 20 C 25 20, 25 70, 50 85 C 75 70, 75 20, 75 20 L 50 15 Z" fill="#F4C41B" stroke="#0A1D37" strokeWidth="6" />
              <circle cx="50" cy="50" r="16" fill="#0A1D37" />
              <path d="M50 65 L 50 40 M50 45 C 50 45, 42 35, 42 45 C 42 55, 50 50, 50 50 M50 48 C 50 48, 58 38, 58 48 C 58 58, 50 53, 50 53" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
              <circle cx="50" cy="35" r="3" fill="#22C55E" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-primary-dark tracking-tight">UnnesHub</h1>
          <p className="text-sm font-semibold text-text-muted mt-1">Daftar Akun Baru UnnesHub</p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl text-xs font-bold text-red-800 shadow-[3px_3px_0px_0px_#0A1D37] animate-bounce">
            ⚠️ {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark tracking-wide">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="neo-input text-xs"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark tracking-wide">NIM (Nomor Induk Mahasiswa)</label>
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Masukkan NIM"
              className="neo-input text-xs"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark tracking-wide">Email UNNES</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email @students.unnes.ac.id"
              className="neo-input text-xs"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark tracking-wide">Fakultas</label>
            <select
              value={fakultas}
              onChange={(e) => setFakultas(e.target.value)}
              className="neo-input text-xs cursor-pointer appearance-none relative"
              disabled={loading}
            >
              <option value="" disabled className="text-text-muted">
                Pilih Fakultas
              </option>
              {FAKULTAS_LIST.map((f) => (
                <option key={f} value={f}>
                  {f.split(" (")[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password (min 6 karakter)"
              className="neo-input text-xs"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark tracking-wide">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi password"
              className="neo-input text-xs"
              disabled={loading}
            />
          </div>

          {/* Submit Button - strictly using .neo-button-yellow */}
          <button
            type="submit"
            className="neo-button-yellow w-full py-3 mt-4 text-sm font-black animate-none"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-1.5 justify-center">
                <svg className="animate-spin h-4 w-4 text-[#0A1D37]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Mendaftarkan...
              </span>
            ) : (
              "Daftar"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center text-sm font-semibold text-text-muted">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-[#0A1D37] hover:text-[#F4C41B] font-extrabold hover:underline"
          >
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
