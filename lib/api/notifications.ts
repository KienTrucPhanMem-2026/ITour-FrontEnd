// ============================================================
// Notifications API
// ============================================================
import axiosClient from "./axiosClient";
import type { NotificationDTO } from "@/types/api";

/** Lấy tất cả thông báo của một customer */
export async function fetchNotifications(customerId: string): Promise<NotificationDTO[]> {
  const res = await axiosClient.get<any[]>(`/notifications/user/${customerId}`);
  return (res.data || []).map((item) => ({
    ...item,
    read: item.isRead ?? item.read ?? false,
  }));
}

/** Lấy số lượng thông báo chưa đọc */
export async function fetchUnreadCount(customerId: string): Promise<number> {
  const res = await axiosClient.get<number>(`/notifications/user/${customerId}/unread-count`);
  return res.data;
}

/** Đánh dấu một thông báo đã đọc */
export async function markAsRead(notificationId: string): Promise<void> {
  await axiosClient.patch(`/notifications/${notificationId}/read`);
}

/** Đánh dấu tất cả thông báo của customer đã đọc */
export async function markAllAsRead(customerId: string): Promise<void> {
  await axiosClient.patch(`/notifications/user/${customerId}/read-all`);
}
