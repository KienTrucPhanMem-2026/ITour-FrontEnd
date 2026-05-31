// ============================================================
// Auth API — login, register, logout, refresh
// ============================================================
import { apiFetch } from "./config";
import axiosClient from "./axiosClient";
import type { ApiResponse, LoginRequest, RegisterRequest, UserProfile } from "@/types/api";

/**
 * POST /api/auth/login
 * Dùng apiFetch thay vì axiosClient để tránh interceptor gọi /auth/refresh
 * khi chính login bị 401 (credentials sai).
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
 */
export async function registerAPI(data: RegisterRequest): Promise<UserProfile> {
  const res = await apiFetch<ApiResponse<UserProfile>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

/**
 * POST /api/auth/refresh
 * Browser tự gửi refresh_token cookie (path=/auth).
 * Gọi qua axiosClient để được hưởng interceptor base URL — nhưng
 * interceptor sẽ skip retry nếu chính URL này trả 401.
 */
export async function refreshTokenAPI(): Promise<void> {
  await axiosClient.post("/auth/refresh");
}

/**
 * POST /api/auth/logout
 * Backend sẽ blacklist cả access_token và refresh_token.
 */
export async function logoutAPI(): Promise<void> {
  await axiosClient.post("/auth/logout");
}

/**
 * POST /api/auth/forgot-password
 * Gửi OTP về email. Luôn trả về thành công dù email có hay không.
 */
export async function forgotPasswordAPI(email: string): Promise<void> {
  await apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * POST /api/auth/verify-otp
 * Xác thực OTP 6 số.
 */
export async function verifyOtpAPI(email: string, otp: string): Promise<void> {
  await apiFetch<void>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

/**
 * POST /api/auth/reset-password
 * Đặt lại mật khẩu mới sau khi OTP đã được xác thực.
 */
export async function resetPasswordAPI(email: string, newPassword: string): Promise<void> {
  await apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, newPassword }),
  });
}

