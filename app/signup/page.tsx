"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { signupSchema } from "@/lib/validations/auth";
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
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = signupSchema.safeParse({
      name: name.trim(),
      nim: nim,
      fakultas,
      email: email.trim(),
      password,
      confirmPassword,
      agreed,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { error: authError } = await authClient.signUp.email({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    });

    if (authError) {
      setError(authError.message || "Pendaftaran gagal. Coba lagi.");
      setLoading(false);
      return;
    }

    // Persist nim & fakultas to DB
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          nim: nim.trim(),
          fakultas,
        }),
      });
    } catch {
      // Non-blocking — profile fields can be updated later
    }

    // Auto-login the user into local session state
    signup({
      name: name.trim(),
      nim: nim,
      email: email.trim().toLowerCase(),
      fakultas: fakultas,
      role: "mahasiswa",
      isLoggedIn: true,
    });

    router.push("/signup/success");
  };

  return (
    <div className="flex-1 min-h-screen bg-[#0B1E36] flex flex-col">
      {/* Navy Header */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <div className="w-20 h-20 mb-4">
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
            <circle
              cx="60"
              cy="60"
              r="56"
              fill="#F4C41B"
              stroke="#0A1D37"
              strokeWidth="4"
            />
            <path
              d="M35 30 C 35 30, 35 80, 60 95 C 85 80, 85 30, 85 30 L 60 24 Z"
              fill="#0A1D37"
              stroke="#F4C41B"
              strokeWidth="2"
            />
            <path
              d="M60 78 L 60 48 M60 54 C 60 54, 50 42, 50 54 C 50 66, 60 58, 60 58 M60 56 C 60 56, 70 44, 70 56 C 70 68, 60 60, 60 60"
              fill="none"
              stroke="#22C55E"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="60" cy="42" r="3.5" fill="#22C55E" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          UnnesHub
        </h1>
        <p className="text-sm font-semibold text-[#8FA0AF] mt-0.5">
          Selamat Datang di UnnesHub
        </p>
      </div>

      {/* Gray Form Container */}
      <div className="flex-1 bg-[#E2E5E9] rounded-t-3xl px-6 py-8 animate-fade-in-up">
        {/* Error */}
        {error && (
          <div className="mb-5 p-3 bg-red-100 border border-red-400 rounded-lg text-xs font-bold text-red-700 text-center">
            ⚠️ {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 max-w-md mx-auto"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B1E36] tracking-wide">
              Nama
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input-light"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B1E36] tracking-wide">
              NIM
            </label>
            <input
              id="signup-nim"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="auth-input-light"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B1E36] tracking-wide">
              Fakultas
            </label>
            <select
              id="signup-fakultas"
              value={fakultas}
              onChange={(e) => setFakultas(e.target.value)}
              className="auth-input-light cursor-pointer appearance-none"
              disabled={loading}
            >
              <option value="" disabled>
                Pilih Fakultas
              </option>
              {FAKULTAS_LIST.map((f) => (
                <option key={f} value={f}>
                  {f.split(" (")[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B1E36] tracking-wide">
              Email UNNES
            </label>
            <input
              id="signup-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@students.unnes.ac.id"
              className="auth-input-light"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B1E36] tracking-wide">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input-light"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B1E36] tracking-wide">
              Konfirmasi Password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input-light"
              disabled={loading}
            />
          </div>

          {/* Terms Checkbox */}
          <label className="flex items-start gap-2.5 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#0B1E36] border-2 border-[#0B1E36] rounded cursor-pointer shrink-0"
            />
            <span className="text-[11px] font-semibold text-[#4B5563] leading-tight">
              Saya menyetujui{" "}
              <span className="font-bold text-[#0B1E36]">
                Ketentuan Layanan
              </span>{" "}
              dan{" "}
              <span className="font-bold text-[#0B1E36]">
                Kebijakan Privasi
              </span>{" "}
              UnnesHub.
            </span>
          </label>

          <button
            id="signup-submit"
            type="submit"
            className="neo-button-yellow w-full py-3 mt-2 text-sm font-black"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-1.5 justify-center">
                <svg
                  className="animate-spin h-4 w-4"
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
                Mendaftarkan...
              </span>
            ) : (
              "Daftar Sekarang"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm font-semibold text-[#6B7280]">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-[#0B1E36] font-extrabold hover:underline"
          >
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
