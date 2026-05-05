// ============================================================
// Auth localStorage helpers
// Lưu user info (KHÔNG lưu JWT — JWT nằm trong HttpOnly cookie)
// ============================================================
import type { UserProfile } from "@/types/api";

const USER_KEY = "currentUser";

/** Lấy user từ localStorage */
export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

/** Lưu user info vào localStorage */
export function setStoredUser(user: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Xóa user info khỏi localStorage (khi logout) */
export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

/** Kiểm tra user đã đăng nhập chưa (dựa trên localStorage) */
export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}
