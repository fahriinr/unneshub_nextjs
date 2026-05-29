"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import { useUserSession } from "../hooks/useUserSession";

const AUTH_ROUTES = ["/login", "/signup"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUserSession();

  const isAuthPage = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isLoggedIn = !!(user && user.isLoggedIn);

  // Redirection guard for guest users
  useEffect(() => {
    if (!loading && !isAuthPage && !isLoggedIn) {
      router.push("/signup");
    }
  }, [loading, isAuthPage, isLoggedIn, router]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <Navbar />}
      <div className="flex-1 flex justify-center w-full">
        <div className="w-full max-w-[520px] flex flex-col min-h-full md:shadow-[0_0_40px_rgba(0,0,0,0.08)] md:border-x md:border-slate-200/60 bg-white relative">
          <main className={`flex-1 flex flex-col ${isLoggedIn && !isAuthPage ? "has-bottom-nav" : ""}`}>
            {children}
          </main>
          {!isAuthPage && <BottomNav isLoggedIn={isLoggedIn} />}
        </div>
      </div>
    </div>
  );
}
