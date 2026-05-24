"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { loginSchema } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }


    const { error: authError } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError(authError.message || "Login gagal. Periksa email dan password Anda.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex-1 min-h-screen bg-[#0B1E36] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center animate-fade-in-up">
        {/* Logo */}
        <div className="w-24 h-24 mb-6">
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
            <circle cx="60" cy="60" r="56" fill="#F4C41B" stroke="#0A1D37" strokeWidth="4" />
            <path d="M35 30 C 35 30, 35 80, 60 95 C 85 80, 85 30, 85 30 L 60 24 Z" fill="#0A1D37" stroke="#F4C41B" strokeWidth="2" />
            <path d="M60 78 L 60 48 M60 54 C 60 54, 50 42, 50 54 C 50 66, 60 58, 60 58 M60 56 C 60 56, 70 44, 70 56 C 70 68, 60 60, 60 60" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="42" r="3.5" fill="#22C55E" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">UnnesHub</h1>
        <p className="text-sm font-semibold text-[#8FA0AF] mb-8">Selamat Datang di UnnesHub</p>

        {/* Error */}
        {error && (
          <div className="w-full mb-5 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-xs font-bold text-red-300 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#8FA0AF] tracking-wide">Email</label>
            <input
              id="login-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email UNNES"
              className="auth-input"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#8FA0AF] tracking-wide">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="auth-input"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="neo-button-yellow w-full py-3 mt-2 text-sm font-black"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-1.5 justify-center">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </span>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-8 text-center text-sm font-semibold text-[#8FA0AF]">
          Belum punya akun?{" "}
          <Link
            href="/signup"
            className="text-white font-extrabold hover:text-[#F4C41B] transition-colors"
          >
            Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
