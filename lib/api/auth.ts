// ============================================================
// Auth API — login, register, logout
// ============================================================
import { apiFetch } from "./config";
import type { ApiResponse, LoginRequest, RegisterRequest, UserProfile } from "@/types/api";

/**
 * POST /api/auth/login
 * Cookie access_token sẽ được set tự động bởi browser (HttpOnly).
 * Response body trả user info (accessToken đã bị null bởi server).
 */
export async function loginAPI(data: LoginRequest): Promise<UserProfile> {
  const res = await apiFetch<ApiResponse<UserProfile>>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

/**
 * POST /api/auth/register
 * Tương tự login — cookie sẽ được set.
 */
export async function registerAPI(data: RegisterRequest): Promise<UserProfile> {
  const res = await apiFetch<ApiResponse<UserProfile>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

/**
 * POST /api/auth/logout
 * Server set cookie maxAge=0 để xóa cookie.
 */
export async function logoutAPI(): Promise<void> {
  await apiFetch<ApiResponse<void>>("/auth/logout", {
    method: "POST",
  });
}
