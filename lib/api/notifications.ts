// ============================================================
// Notifications API — gọi tới ITour-Notification service (port 8081)
// ============================================================

import type { NotificationDTO } from "@/types/api";

const NOTIFICATION_BASE_URL = "http://localhost:8081/api/notifications";

/** Fetch helper riêng cho notification service (không dùng cookie auth) */
async function notiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${NOTIFICATION_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Notification API error ${res.status}: ${text}`);
  }

  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

/** Lấy tất cả thông báo của một customer */
export async function fetchNotifications(customerId: string): Promise<NotificationDTO[]> {
  return notiFetch<NotificationDTO[]>(`/customer/${customerId}`);
}

/** Lấy số lượng thông báo chưa đọc */
export async function fetchUnreadCount(customerId: string): Promise<number> {
  return notiFetch<number>(`/customer/${customerId}/unread-count`);
}

/** Đánh dấu một thông báo đã đọc */
export async function markAsRead(notificationId: string): Promise<void> {
  return notiFetch<void>(`/${notificationId}/read`, { method: "PATCH" });
}

/** Đánh dấu tất cả thông báo của customer đã đọc */
export async function markAllAsRead(customerId: string): Promise<void> {
  return notiFetch<void>(`/customer/${customerId}/read-all`, { method: "PATCH" });
}
