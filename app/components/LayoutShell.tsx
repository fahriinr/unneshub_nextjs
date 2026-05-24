"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import { useUserSession } from "../hooks/useUserSession";

const AUTH_ROUTES = ["/login", "/signup"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUserSession();

  const isAuthPage = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isLoggedIn = !!(user && user.isLoggedIn);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main className={`flex-1 flex flex-col ${isLoggedIn && !isAuthPage ? "has-bottom-nav" : ""}`}>
        {children}
      </main>
      {!isAuthPage && <BottomNav isLoggedIn={isLoggedIn} />}
    </>
  );
}
