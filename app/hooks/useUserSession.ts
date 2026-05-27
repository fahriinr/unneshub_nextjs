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

const DEFAULT_USER: UserProfile = {
  name: "Ahmad Mahasiswa",
  nim: "1201421099",
  email: "ahmad@students.unnes.ac.id",
  fakultas: "FMIPA (Fakultas Matematika & Ilmu Pengetahuan Alam)",
  jurusan: "Ilmu Komputer",
  prodi: "Sistem Informasi (S1)",
  angkatan: "2021",
  profilePicture: null,
  minat: ["UI/UX Design", "Web Development", "Organisasi"],
  role: "mahasiswa",
  isLoggedIn: true,
};

export function useUserSession() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("unneshub_user");
      let currentUser: UserProfile | null = null;
      if (stored) {
        try {
          currentUser = JSON.parse(stored);
        } catch (e) {
          currentUser = DEFAULT_USER;
        }
      } else {
        currentUser = DEFAULT_USER;
        localStorage.setItem("unneshub_user", JSON.stringify(DEFAULT_USER));
      }
      setUser(currentUser);
      setLoading(false);
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
            const updated = {
              ...(prev || DEFAULT_USER),
              name: dbUser.name,
              email: dbUser.email,
              isLoggedIn: true,
            };
            localStorage.setItem("unneshub_user", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.error("Session sync failed:", e);
      }
    }
    syncSession();
  }, []);

  const saveUser = (updatedUser: UserProfile | null) => {
    setUser(updatedUser);
    if (typeof window !== "undefined") {
      if (updatedUser) {
        localStorage.setItem("unneshub_user", JSON.stringify(updatedUser));
        // Dispatch custom event to notify other components
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
      ...DEFAULT_USER,
      email: email,
      name: email.split("@")[0].split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
      isLoggedIn: true,
    };
    saveUser(newUser);
  };

  const signup = (userData: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      ...DEFAULT_USER,
      ...userData,
      isLoggedIn: true,
    } as UserProfile;
    saveUser(newUser);
  };

  const logout = () => {
    if (user) {
      saveUser({ ...user, isLoggedIn: false });
    }
  };

  const updateProfile = (updatedData: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updatedData };
      saveUser(updated);
    }
  };

  const updateRole = (newRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
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
    updateRole,
  };
}
