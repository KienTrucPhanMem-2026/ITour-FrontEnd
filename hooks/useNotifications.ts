// ============================================================
// useNotifications — Hook quản lý thông báo
// ============================================================

import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  loadNotifications,
  readNotification,
  readAllNotifications,
} from "@/lib/store/slices/notificationSlice";

const POLL_INTERVAL_MS = 30_000; // Tự động fetch lại mỗi 30 giây

export function useNotifications(customerId: string | null | undefined) {
  const dispatch = useAppDispatch();
  const { items, unreadCount, loading, error } = useAppSelector(
    (s) => s.notifications
  );

  /** Load lần đầu và poll định kỳ */
  const refresh = useCallback(() => {
    if (customerId) dispatch(loadNotifications(customerId));
  }, [customerId, dispatch]);

  useEffect(() => {
    refresh();
    if (!customerId) return;
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh, customerId]);

  /** Đánh dấu một thông báo đã đọc */
  const markRead = useCallback(
    (notificationId: string) => {
      dispatch(readNotification(notificationId));
    },
    [dispatch]
  );

  /** Đánh dấu tất cả đã đọc */
  const markAllRead = useCallback(() => {
    if (customerId) dispatch(readAllNotifications(customerId));
  }, [customerId, dispatch]);

  return { items, unreadCount, loading, error, refresh, markRead, markAllRead };
}
