// ============================================================
// useAuth hooks — JWT guard + current user
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, isAuthenticated } from "@/lib/auth";
import type { UserProfile } from "@/types/api";

/**
 * Hook bảo vệ route: nếu user chưa đăng nhập → redirect về /login.
 * Trả về `ready: true` khi đã kiểm tra xong (tránh flash).
 */
export function useRequireAuth(): { ready: boolean } {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  return { ready };
}

/**
 * Hook lấy user hiện tại từ localStorage.
 * Trả về null nếu chưa đăng nhập.
 */
export function useCurrentUser(): UserProfile | null {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return user;
}
