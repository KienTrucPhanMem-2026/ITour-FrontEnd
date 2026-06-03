// ============================================================
// Axios Client — instance dùng chung với interceptor tự động refresh token
// ============================================================
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, ApiError } from "./config";
import { clearStoredUser } from "@/lib/auth";

// ---------------------------------------------------------------
// Queue: nếu nhiều request cùng nhận 401 đồng thời,
// chỉ gọi /auth/refresh 1 lần rồi resolve/reject tất cả.
// ---------------------------------------------------------------
type QueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve();
    }
  });
  failedQueue = [];
}

// ---------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,              // Tự gửi HttpOnly cookie (access_token)
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------
// Response Interceptor
// ---------------------------------------------------------------
axiosClient.interceptors.response.use(
  // 2xx — trả thẳng response
  (response) => response,

  // Lỗi — xử lý 401 và các lỗi khác
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── 401: Token hết hạn hoặc bị blacklist ──────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Tránh vòng lặp: nếu chính /auth/refresh trả 401 → logout ngay
      if (originalRequest.url?.includes("/auth/refresh")) {
        forceLogout();
        return Promise.reject(new ApiError(401, "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."));
      }

      // 🛡️ Nếu là public endpoint, không cần refresh - trả error thẳng
      const url = originalRequest.url || "";
      const publicEndpoints = ["/tours", "/tour-itineraries", "/tour-schedules", "/discounts", "/locations", "/tour-images", "/reviews", "/banners", "/blogs"];
      const isPublicEndpoint = publicEndpoints.some(ep => url.includes(ep));
      
      if (isPublicEndpoint) {
        // Public endpoint không nên trả 401 - có lỗi gì đó
        return Promise.reject(new ApiError(401, "Không thể tải dữ liệu. Vui lòng thử lại sau."));
      }

      if (isRefreshing) {
        // Đang refresh → xếp hàng chờ
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => axiosClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh — browser tự gửi refresh_token cookie (path=/auth)
        await axiosClient.post("/auth/refresh");

        // Refresh thành công → resolve tất cả request đang xếp hàng
        processQueue(null);

        // Retry request gốc với access_token cookie mới
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại → reject tất cả request đang chờ + logout
        processQueue(refreshError);
        forceLogout();
        return Promise.reject(
          new ApiError(401, "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
        );
      } finally {
        isRefreshing = false;
      }
    }

    // ── 429: Rate Limited ─────────────────────────────────────
    if (error.response?.status === 429) {
      return Promise.reject(
        new ApiError(429, "Bạn đang gửi yêu cầu quá nhanh. Vui lòng chờ một lúc rồi thử lại.")
      );
    }

    // ── Các lỗi khác ──────────────────────────────────────────
    const status = error.response?.status ?? 0;
    const data = error.response?.data as { message?: string } | undefined;
    const message = data?.message ?? error.message ?? `HTTP ${status}`;
    return Promise.reject(new ApiError(status, message));
  }
);

/** Xóa session và redirect về trang login */
function forceLogout() {
  if (typeof window !== "undefined") {
    clearStoredUser();
    window.location.href = "/login";
  }
}

export default axiosClient;

// ---------------------------------------------------------------
// Helper: wrap axios response để lấy .data (tương tự apiFetch)
// ---------------------------------------------------------------
export async function apiGet<T>(path: string): Promise<T> {
  const res = await axiosClient.get<T>(path);
  return res.data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await axiosClient.post<T>(path, body);
  return res.data;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await axiosClient.put<T>(path, body);
  return res.data;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await axiosClient.patch<T>(path, body);
  return res.data;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await axiosClient.delete<T>(path);
  return res.data;
}
