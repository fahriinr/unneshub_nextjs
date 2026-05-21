"use client";

import Link from "next/link";
import { useUserSession, UserRole } from "../hooks/useUserSession";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { user, updateRole, logout } = useUserSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || !user.isLoggedIn) {
    return null;
  }

  const handleRoleChange = (role: UserRole) => {
    updateRole(role);
    setDropdownOpen(false);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "mahasiswa":
        return "Mahasiswa";
      case "community_admin":
        return "Community Admin";
      case "global_admin":
        return "Global Admin";
      default:
        return "User";
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "mahasiswa":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "community_admin":
        return "bg-indigo-100 text-indigo-700 border-indigo-300";
      case "global_admin":
        return "bg-amber-100 text-amber-700 border-amber-300";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-primary-dark">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and App Title */}
        <Link href="/" className="flex items-center gap-3 group hover:scale-[1.01] transition-transform">
          <div className="w-10 h-10 rounded-lg bg-primary-dark border-2 border-primary-dark flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_0px_var(--color-accent-yellow)]">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              {/* Shield/U Base */}
              <path d="M25 20 C 25 20, 25 70, 50 85 C 75 70, 75 20, 75 20 L 50 15 Z" fill="#F4C41B" stroke="#0A1D37" strokeWidth="6" />
              {/* Inner plant elements */}
              <circle cx="50" cy="50" r="16" fill="#0A1D37" />
              <path d="M50 65 L 50 40 M50 45 C 50 45, 42 35, 42 45 C 42 55, 50 50, 50 50 M50 48 C 50 48, 58 38, 58 48 C 58 58, 50 53, 50 53" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
              {/* Inner details */}
              <circle cx="50" cy="35" r="3" fill="#22C55E" />
            </svg>
          </div>
          <span className="font-sans font-extrabold text-2xl tracking-tight text-primary-dark flex items-center gap-1.5">
            Unnes<span className="text-accent-yellow bg-primary-dark px-1.5 py-0.5 rounded border border-primary-dark shadow-[1.5px_1.5px_0px_0px_#0A1D37]">Hub</span>
          </span>
        </Link>

        {/* Navigation Middle Links */}
        <nav className="hidden md:flex items-center gap-6 font-semibold">
          <Link 
            href="/" 
            className={`px-3 py-1.5 rounded-lg border-2 border-transparent transition-all ${pathname === "/" ? "bg-amber-50 border-primary-dark text-primary-dark shadow-[2px_2px_0px_0px_var(--color-primary-dark)]" : "hover:bg-slate-50"}`}
          >
            Beranda
          </Link>
          <Link 
            href="/community/1" 
            className={`px-3 py-1.5 rounded-lg border-2 border-transparent transition-all ${pathname.startsWith("/community") ? "bg-amber-50 border-primary-dark text-primary-dark shadow-[2px_2px_0px_0px_var(--color-primary-dark)]" : "hover:bg-slate-50"}`}
          >
            Komunitas
          </Link>
          <Link 
            href="/profile" 
            className={`px-3 py-1.5 rounded-lg border-2 border-transparent transition-all ${pathname === "/profile" ? "bg-amber-50 border-primary-dark text-primary-dark shadow-[2px_2px_0px_0px_var(--color-primary-dark)]" : "hover:bg-slate-50"}`}
          >
            Profil Saya
          </Link>
        </nav>

        {/* Right Area: User Profile drop & Role Selector */}
        <div className="flex items-center gap-3" ref={dropdownRef}>
          {/* Active Role Indicator (Quick view) */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Simulasi Role:</span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 border border-primary-dark rounded shadow-[1px_1px_0px_0px_var(--color-primary-dark)] ${
              user.role === "global_admin" ? "bg-red-200" : user.role === "community_admin" ? "bg-amber-200" : "bg-green-200"
            }`}>
              {getRoleLabel(user.role)}
            </span>
          </div>

          {/* User Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full border-2 border-primary-dark bg-white overflow-hidden shadow-[2.5px_2.5px_0px_0px_var(--color-primary-dark)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_var(--color-primary-dark)] transition-all flex items-center justify-center cursor-pointer"
            id="user-profile-button"
            aria-label="Toggle user menu"
          >
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-amber-50 flex items-center justify-center font-bold text-lg text-primary-dark">
                {user.name.charAt(0)}
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-4 top-16 w-64 bg-white border-2 border-primary-dark rounded-xl shadow-[4px_4px_0px_0px_var(--color-primary-dark)] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-4 py-3 border-b-2 border-slate-100">
                <p className="font-extrabold text-sm text-primary-dark line-clamp-1">{user.name}</p>
                <p className="text-xs font-medium text-text-muted line-clamp-1">{user.email}</p>
                <p className="text-[10px] mt-1 font-bold text-primary-dark">NIM: {user.nim}</p>
              </div>

              {/* Navigation Links for Mobile */}
              <div className="block md:hidden px-2 py-1.5 border-b-2 border-slate-100">
                <Link 
                  href="/" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center w-full px-3 py-1.5 text-xs font-bold text-primary-dark hover:bg-slate-50 rounded-lg"
                >
                  🏠 Beranda
                </Link>
                <Link 
                  href="/community/1" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center w-full px-3 py-1.5 text-xs font-bold text-primary-dark hover:bg-slate-50 rounded-lg"
                >
                  🏘️ HIMA SI Komunitas
                </Link>
                <Link 
                  href="/profile" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center w-full px-3 py-1.5 text-xs font-bold text-primary-dark hover:bg-slate-50 rounded-lg"
                >
                  👤 Profil Saya
                </Link>
              </div>

              {/* RBAC ROLE SIMULATOR SECTION */}
              <div className="px-4 py-2 bg-slate-50 border-b-2 border-slate-100">
                <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
                  Ubah Mode Simulasi (RBAC):
                </span>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleRoleChange("mahasiswa")}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-extrabold border transition-all flex items-center justify-between cursor-pointer ${
                      user.role === "mahasiswa" 
                        ? "bg-green-100 border-green-500 text-green-800" 
                        : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>Mahasiswa (User)</span>
                    {user.role === "mahasiswa" && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => handleRoleChange("community_admin")}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-extrabold border transition-all flex items-center justify-between cursor-pointer ${
                      user.role === "community_admin" 
                        ? "bg-amber-100 border-amber-500 text-amber-800" 
                        : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>Community Admin</span>
                    {user.role === "community_admin" && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => handleRoleChange("global_admin")}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-extrabold border transition-all flex items-center justify-between cursor-pointer ${
                      user.role === "global_admin" 
                        ? "bg-red-100 border-red-500 text-red-800" 
                        : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>Global Admin</span>
                    {user.role === "global_admin" && <span>✓</span>}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1">
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                    router.push("/login");
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                >
                  🚪 Keluar dari Akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
