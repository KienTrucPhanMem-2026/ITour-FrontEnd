// ============================================================
// API Client — Base config với credentials:include để gửi HttpOnly cookie
// ============================================================

import { log } from "console";

export const API_BASE_URL = "http://localhost:8080/api";

/** Lỗi từ API — chứa code, message */
export class ApiError extends Error {
  constructor(
    public code: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Wrapper fetch:
 * - Tự thêm base URL
 * - Gửi cookie JWT httpOnly qua credentials: 'include'
 * - Parse JSON và throw ApiError nếu server trả lỗi
 * - 401 → xóa user localStorage + redirect login
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Xử lý 401 — JWT hết hạn hoặc chưa login
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    }
    throw new ApiError(401, "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
  }

  // Xử lý 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  let body: unknown;

  try {
    body = await res.json();
    console.log(body)
  } catch {
    throw new ApiError(res.status, `HTTPdsff ${res.status}`);
  }

  if (!res.ok) {
    const msg =
      (body as { message?: string })?.message ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, msg);
  }

  return body as T;
}
