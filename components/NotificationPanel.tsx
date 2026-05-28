"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { NotificationDTO } from "@/types/api";

// ============================================================
// Icon Helpers
// ============================================================
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Type → visual icon (hiển thị ở bên trái mỗi item)
function NotifIcon({ type }: { type: string }) {
  const config: Record<string, { bg: string; color: string; path: JSX.Element }> = {
    BOOKING_SUCCESS: {
      bg: "#ecfdf5", color: "#10b981",
      path: <polyline points="20 6 9 17 4 12" />,
    },
    BOOKING_CANCELLED: {
      bg: "#fff1f2", color: "#f43f5e",
      path: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    },
    PAYMENT_SUCCESS: {
      bg: "#eff6ff", color: "#3b82f6",
      path: <><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></>,
    },
    SYSTEM_ALERT: {
      bg: "#fffbeb", color: "#f59e0b",
      path: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    },
  };
  const c = config[type] ?? { bg: "#f5f3ff", color: "#8b5cf6", path: <circle cx="12" cy="12" r="4" /> };

  return (
    <span style={{
      flexShrink: 0,
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: c.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {c.path}
      </svg>
    </span>
  );
}

// ============================================================
// Utilities
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
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ============================================================
// Props
// ============================================================
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: NotificationDTO[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

// ============================================================
// Component
// ============================================================
export default function NotificationPanel({
  isOpen,
  onClose,
  items,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="np-wrap">
      {/* ── HEADER ─────────────────────────────── */}
      <div className="np-head">
        <span className="np-head__title">Thông báo</span>
        {unreadCount > 0 && (
          <button className="np-head__mark-btn" onClick={onMarkAllRead}>
            <IconCheck />
            Đọc tất cả
          </button>
        )}
      </div>

      {/* ── BODY ───────────────────────────────── */}
      <div className="np-body">
        {loading && items.length === 0 ? (
          /* Skeleton */
          <div className="np-skeleton-wrap">
            {[1, 2, 3].map((i) => (
              <div key={i} className="np-skeleton-row">
                <div className="np-skeleton np-skeleton--circle" />
                <div className="np-skeleton-lines">
                  <div className="np-skeleton np-skeleton--line" />
                  <div className="np-skeleton np-skeleton--line np-skeleton--short" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty */
          <div className="np-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="np-empty__text">Chưa có thông báo nào</p>
          </div>
        ) : (
          /* List */
          <ul className="np-list">
            {items.map((n) => (
              <li
                key={n.id}
                className={`np-item${n.read ? "" : " np-item--unread"}`}
                onClick={() => { if (!n.read) onMarkRead(n.id); }}
              >
                {/* Visual */}
                <NotifIcon type={n.type} />

                {/* Content */}
                <div className="np-item__body">
                  <p className="np-item__title">{n.title}</p>
                  <p className="np-item__desc">{n.message}</p>
                  <span className="np-item__time">{formatTime(n.createdAt)}</span>
                  {n.actionUrl && (
                    <Link href={n.actionUrl} className="np-item__cta" onClick={(e) => e.stopPropagation()}>
                      Xem chi tiết →
                    </Link>
                  )}
                </div>

                {/* Unread dot */}
                {!n.read && <span className="np-item__dot" />}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────── */}
      <div className="np-foot">
        <Link href="/notifications" onClick={onClose} className="np-foot__link">
          Xem tất cả thông báo
        </Link>
      </div>

      {/* ── STYLES ─────────────────────────────── */}
      <style jsx>{`
        /* === Container === */
        .np-wrap {
          position: absolute;
          top: calc(100% + 10px);
          right: -8px;
          width: 340px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e8edf2;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9999;
          animation: np-in .18s cubic-bezier(.16,1,.3,1);
        }
        @keyframes np-in {
          from { opacity:0; transform:translateY(-6px) scale(.98); }
          to   { opacity:1; transform:translateY(0)   scale(1);    }
        }

        /* === Header === */
        .np-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .np-head__title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .np-head__mark-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #0EA5E9;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background .15s;
        }
        .np-head__mark-btn:hover { background: #f0f9ff; }

        /* === Body === */
        .np-body {
          max-height: 360px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }

        /* === Empty === */
        .np-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 36px 20px;
        }
        .np-empty__text {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }

        /* === Skeleton === */
        .np-skeleton-wrap { padding: 8px 0; }
        .np-skeleton-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
        }
        .np-skeleton {
          background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 6px;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position:-200% 0; }
        }
        .np-skeleton--circle { width:38px; height:38px; border-radius:50%; flex-shrink:0; }
        .np-skeleton-lines { flex:1; display:flex; flex-direction:column; gap:6px; }
        .np-skeleton--line { height:11px; width:100%; }
        .np-skeleton--short { width:60%; }

        /* === List === */
        .np-list {
          list-style: none;
          margin: 0;
          padding: 6px 0;
        }

        /* === Item === */
        .np-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background .12s;
        }
        .np-item:hover { background: #f8fafc; }
        .np-item--unread { background: #f0f9ff; }
        .np-item--unread:hover { background: #e0f2fe; }

        /* content */
        .np-item__body {
          flex: 1;
          min-width: 0;
        }
        .np-item__title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 14px; /* space for dot */
        }
        .np-item__desc {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 4px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .np-item__time {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
        .np-item__cta {
          display: inline-block;
          margin-left: 8px;
          font-size: 11px;
          color: #0EA5E9;
          font-weight: 600;
          text-decoration: none;
        }
        .np-item__cta:hover { text-decoration: underline; }

        /* unread indicator dot */
        .np-item__dot {
          position: absolute;
          top: 50%;
          right: 14px;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0EA5E9;
          flex-shrink: 0;
        }

        /* === Footer === */
        .np-foot {
          padding: 10px 16px;
          text-align: center;
          border-top: 1px solid #f1f5f9;
        }
        .np-foot__link {
          font-size: 12.5px;
          font-weight: 600;
          color: #0EA5E9;
          text-decoration: none;
        }
        .np-foot__link:hover { text-decoration: underline; }

        /* === Responsive === */
        @media (max-width: 400px) {
          .np-wrap { width: calc(100vw - 20px); right: -10px; }
        }
      `}</style>
    </div>
  );
}
