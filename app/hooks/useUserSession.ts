"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/auth-client";

export type UserRole = "mahasiswa" | "community_admin" | "global_admin";

export interface UserProfile {
  name: string;
  nim: string;
  email: string;
  fakultas: string;
  jurusan: string;
  prodi: string;
  angkatan: string;
  profilePicture: string | null;
  minat: string[];
  role: UserRole;
  isLoggedIn: boolean;
}

export function useUserSession() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on client side (optimistic render)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("unneshub_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
          setLoading(false);
        } catch (e) {
          localStorage.removeItem("unneshub_user");
        }
      }
    }
  }, []);

  // Sync active Better Auth session with localStorage
  useEffect(() => {
    async function syncSession() {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          const dbUser = session.data.user;
          setUser((prev) => {
            const updated: UserProfile = {
              name: dbUser.name,
              email: dbUser.email,
              nim: prev?.nim || "",
              fakultas: prev?.fakultas || "",
              jurusan: prev?.jurusan || "",
              prodi: prev?.prodi || "",
              angkatan: prev?.angkatan || "",
              profilePicture: dbUser.image || prev?.profilePicture || null,
              minat: prev?.minat || [],
              role: ((dbUser as any).role?.toLowerCase() as UserRole) || prev?.role || "mahasiswa",
              isLoggedIn: true,
            };
            localStorage.setItem("unneshub_user", JSON.stringify(updated));
            return updated;
          });
        } else {
          // If no active session, clear client state
          setUser(null);
          localStorage.removeItem("unneshub_user");
        }
      } catch (e) {
        console.error("Session sync failed:", e);
      } finally {
        setLoading(false);
      }
    }
    syncSession();
  }, []);

  const saveUser = (updatedUser: UserProfile | null) => {
    setUser(updatedUser);
    if (typeof window !== "undefined") {
      if (updatedUser) {
        localStorage.setItem("unneshub_user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("unneshub_user_updated"));
      } else {
        localStorage.removeItem("unneshub_user");
        window.dispatchEvent(new Event("unneshub_user_updated"));
      }
    }
  };

  // Listen to storage/custom updates
  useEffect(() => {
    const handleUpdate = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("unneshub_user");
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch (e) {}
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener("unneshub_user_updated", handleUpdate);
    return () => {
      window.removeEventListener("unneshub_user_updated", handleUpdate);
    };
  }, []);

  const login = (email: string) => {
    const newUser: UserProfile = {
      name: email.split("@")[0].split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
      nim: "",
      email: email,
      fakultas: "",
      jurusan: "",
      prodi: "",
      angkatan: "",
      profilePicture: null,
      minat: [],
      role: "mahasiswa",
      isLoggedIn: true,
    };
    saveUser(newUser);
  };

  const signup = (userData: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      name: userData.name || "",
      nim: userData.nim || "",
      email: userData.email || "",
      fakultas: userData.fakultas || "",
      jurusan: userData.jurusan || "",
      prodi: userData.prodi || "",
      angkatan: userData.angkatan || "",
      profilePicture: userData.profilePicture || null,
      minat: userData.minat || [],
      role: userData.role || "mahasiswa",
      isLoggedIn: true,
    };
    saveUser(newUser);
  };

  const logout = () => {
    saveUser(null);
    authClient.signOut().catch(console.error);
  };

  const updateProfile = (updatedData: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updatedData };
      saveUser(updated);
    }
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
  };
}
