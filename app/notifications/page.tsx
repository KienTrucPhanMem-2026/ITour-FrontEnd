"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/api/notifications";
import type { NotificationDTO } from "@/types/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Bell,
  CheckCheck,
  Check,
  ArrowRight,
  Inbox,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

// ============================================================
// Time Formatting
// ============================================================
function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// NotifIcon Component
// ============================================================
function NotifIcon({ type }: { type: string }) {
  const config: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    BOOKING_SUCCESS: {
      bg: "bg-emerald-50 border-emerald-100",
      color: "text-emerald-500",
      icon: <Check className="w-5 h-5" />,
    },
    BOOKING_CANCELLED: {
      bg: "bg-rose-50 border-rose-100",
      color: "text-rose-500",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    PAYMENT_SUCCESS: {
      bg: "bg-blue-50 border-blue-100",
      color: "text-blue-500",
      icon: <Sparkles className="w-5 h-5" />,
    },
    TIER_UPGRADED: {
      bg: "bg-fuchsia-50 border-fuchsia-100",
      color: "text-fuchsia-500",
      icon: <Sparkles className="w-5 h-5" />,
    },
    SYSTEM_ALERT: {
      bg: "bg-amber-50 border-amber-100",
      color: "text-amber-500",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  };
  const c = config[type] ?? {
    bg: "bg-slate-50 border-slate-100",
    color: "text-slate-500",
    icon: <Bell className="w-5 h-5" />,
  };

  return (
    <span className={`flex-shrink-0 w-11 h-11 rounded-2xl ${c.bg} border flex items-center justify-center ${c.color} shadow-sm`}>
      {c.icon}
    </span>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function NotificationsPage() {
  const router = useRouter();
  const isReady = useProtectedRoute();
  const currentUser = useCurrentUser();

  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Load Notifications ──
  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await fetchNotifications(currentUser.id);
      // Sort newest first
      const sorted = (data || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sorted);
    } catch (err) {
      console.error("Lỗi khi tải danh sách thông báo:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isReady && currentUser) {
      loadNotifications();
    }
  }, [isReady, currentUser, loadNotifications]);

  // ── Mark single notification as read ──
  const handleMarkRead = async (id: string, actionUrl?: string) => {
    try {
      // Optimistic UI update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      await markAsRead(id);
      if (actionUrl) {
        router.push(actionUrl);
      }
    } catch (err) {
      console.error("Lỗi khi đánh dấu đã đọc:", err);
      // Revert if error
      loadNotifications();
    }
  };

  // ── Mark all as read ──
  const handleMarkAllRead = async () => {
    if (!currentUser || notifications.filter((n) => !n.read).length === 0) return;
    try {
      setActionLoading(true);
      // Optimistic UI update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await markAllAsRead(currentUser.id);
    } catch (err) {
      console.error("Lỗi khi đọc tất cả:", err);
      loadNotifications();
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Items
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isReady || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8F8] flex flex-col justify-between">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        {/* Page Header */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-sky-50 text-[#0EA5E9] rounded-2xl border border-sky-100/50">
                <Bell className="w-6 sm:w-7 sm:h-7" />
              </span>
              Thông Báo Của Tôi
            </h1>
            <p className="text-slate-400 font-semibold text-xs sm:text-sm pl-0.5">
              Quản lý các cập nhật quan trọng về hành trình du lịch của bạn
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 select-none cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu đọc tất cả
            </button>
          )}
        </div>

        {/* Filters and List block */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-8">
          {/* Tab Filters */}
          <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
            {([
              { id: "ALL", label: "Tất cả thông báo" },
              { id: "UNREAD", label: `Chưa đọc (${unreadCount})` },
            ] as const).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all select-none cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow shadow-slate-950"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* List area */}
          {loading ? (
            /* Skeleton rows */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4 border border-slate-50 rounded-2xl animate-pulse">
                  <div className="w-11 h-11 bg-slate-100 rounded-2xl shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="w-2/5 h-4 bg-slate-100 rounded" />
                    <div className="w-4/5 h-3 bg-slate-100 rounded" />
                    <div className="w-1/6 h-2 bg-slate-100 rounded pt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16 bg-slate-50/40 border border-dashed border-slate-200 rounded-[2rem]">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-200/50 shadow-inner">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-slate-800 font-black text-sm">Hộp thư thông báo trống</h3>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                {filter === "UNREAD"
                  ? "Tuyệt vời! Bạn không bỏ lỡ bất kỳ thông báo quan trọng nào."
                  : "Hệ thống sẽ gửi thông báo cho bạn khi có cập nhật mới về dịch vụ."}
              </p>
            </div>
          ) : (
            /* Notification List */
            <div className="space-y-3.5">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n.id);
                  }}
                  className={`group relative flex gap-4 p-4 sm:p-5 rounded-[2rem] border-2 transition-all duration-200 cursor-pointer ${
                    n.read
                      ? "bg-white border-slate-50 hover:border-slate-100 hover:bg-slate-50/20"
                      : "bg-sky-50/30 border-sky-100/50 hover:border-sky-200/60 shadow-md shadow-sky-50/20"
                  }`}
                >
                  {/* Icon */}
                  <NotifIcon type={n.type} />

                  {/* Body Content */}
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className={`text-sm font-black tracking-tight leading-snug transition-colors ${
                        n.read ? "text-slate-800" : "text-sky-950"
                      }`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <p className={`text-xs font-semibold leading-relaxed ${
                      n.read ? "text-slate-400" : "text-sky-900/70"
                    }`}>
                      {n.message}
                    </p>

                    {n.actionUrl && (
                      <div className="pt-1">
                        <Link
                          href={n.actionUrl}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(n.id, n.actionUrl);
                          }}
                          className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider transition-colors ${
                            n.read ? "text-indigo-600 hover:text-indigo-700" : "text-sky-600 hover:text-sky-700"
                          }`}
                        >
                          Xem chi tiết chuyến đi
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Unread Glow Dot */}
                  {!n.read && (
                    <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-sky-500 shadow-md shadow-sky-300 animate-ping" />
                  )}
                  {!n.read && (
                    <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-sky-500 shadow-md shadow-sky-300" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
