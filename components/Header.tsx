"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { logoutAPI } from "@/lib/api/auth";
import type { UserProfile } from "@/types/api";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPanel from "@/components/NotificationPanel";

// ── Bell SVG icon ────────────────────────────────────────────
function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={hasUnread ? "#0EA5E9" : "#64748b"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ── Icons for User Dropdown ──────────────────────────────────
function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Header({ logoSrc = "/assets/3-3.png" }: { logoSrc?: string }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [notiOpen, setNotiOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  const userDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const { items, unreadCount, loading, markRead, markAllRead } =
    useNotifications(currentUser?.id ?? null);

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } finally {
      clearStoredUser();
      window.location.href = "/login";
    }
  };

  const toggleNoti = useCallback(() => {
    setNotiOpen((v) => !v);
    setUserDropOpen(false);
  }, []);

  const toggleUserDrop = useCallback(() => {
    setUserDropOpen((v) => !v);
    setNotiOpen(false);
  }, []);

  const closeNoti = useCallback(() => setNotiOpen(false), []);
  const closeUserDrop = useCallback(() => setUserDropOpen(false), []);

  // Click outside listener for User Dropdown
  useEffect(() => {
    if (!userDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) {
        closeUserDrop();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userDropOpen, closeUserDrop]);

  return (
    <>
      <header className="hdr">
        <div className="hdr__inner">

          {/* LEFT COLUMN: Empty spacer to center the center-group */}
          <div className="hdr__left-spacer" />

          {/* CENTER COLUMN: Nav - Logo - Nav with 50px gaps */}
          <div className="hdr__center-group">
            <Link href="/tours" className="hdr__nav-link">
              Tour du lịch
            </Link>
            
            <Link href="/" className="hdr__logo">
              <img src={logoSrc} alt="iTour Logo" className="hdr__logo-img" />
            </Link>
            
            <a href="#" className="hdr__nav-link">
              Tin tức
            </a>
          </div>

          {/* RIGHT COLUMN: Actions / Auth */}
          <div className="hdr__right">
            {currentUser ? (
              <>
                {/* Bell notification button */}
                <div className="bell-wrap">
                  <button
                    id="notification-bell-btn"
                    aria-label="Thông báo"
                    onClick={toggleNoti}
                    className={`bell-btn${notiOpen ? " bell-btn--active" : ""}`}
                  >
                    <BellIcon hasUnread={unreadCount > 0} />
                    {unreadCount > 0 && (
                      <span className="bell-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <NotificationPanel
                    isOpen={notiOpen}
                    onClose={closeNoti}
                    items={items}
                    unreadCount={unreadCount}
                    loading={loading}
                    onMarkRead={markRead}
                    onMarkAllRead={markAllRead}
                  />
                </div>

                {/* Avatar with dropdown click */}
                <div className="user-wrap" ref={userDropRef}>
                  <button
                    onClick={toggleUserDrop}
                    className={`hdr__avatar-btn${userDropOpen ? " hdr__avatar-btn--active" : ""}`}
                    aria-label="Tài khoản cá nhân"
                  >
                    {(currentUser.fullName || currentUser.userName || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </button>

                  {userDropOpen && (
                    <div className="user-drop">
                      {/* User Info Header */}
                      <div className="user-drop__header">
                        <p className="user-drop__name">
                          {currentUser.fullName || currentUser.userName}
                        </p>
                        <p className="user-drop__role">Khách hàng</p>
                      </div>

                      <div className="user-drop__divider" />

                      {/* Dropdown list items */}
                      <ul className="user-drop__list">
                        <li>
                          <Link
                            href="/profile?tab=info"
                            className="user-drop__item"
                            onClick={closeUserDrop}
                          >
                            <IconUser />
                            Thông tin tài khoản
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/profile?tab=bookings"
                            className="user-drop__item"
                            onClick={closeUserDrop}
                          >
                            <IconHistory />
                            Lịch sử đặt tour
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/profile?tab=favourites"
                            className="user-drop__item"
                            onClick={closeUserDrop}
                          >
                            <IconHeart />
                            Tour yêu thích
                          </Link>
                        </li>
                      </ul>

                      <div className="user-drop__divider" />

                      {/* Logout option */}
                      <button
                        onClick={() => {
                          closeUserDrop();
                          handleLogout();
                        }}
                        className="user-drop__item user-drop__item--logout"
                      >
                        <IconLogout />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Register is now secondary, Login is primary & highlighted */}
                <Link href="/register" className="hdr__btn-secondary">
                  Đăng ký
                </Link>
                <Link href="/login" className="hdr__btn-primary">
                  Đăng nhập
                </Link>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Scoped styles */}
      <style jsx>{`
        /* === Header shell === */
        .hdr {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }
        .hdr__inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
        }

        /* 3 Columns structure */
        .hdr__left-spacer {
          /* Just to occupy the left grid cell so that the center column is perfectly centered */
          display: block;
        }
        .hdr__center-group {
          display: flex;
          align-items: center;
          gap: 50px; /* 50px gap between navigations and logo */
        }
        .hdr__right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Logo */
        :global(.hdr__logo) {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .hdr__logo-img {
          height: 38px;
          width: auto;
          object-fit: contain;
        }

        /* Nav links */
        :global(.hdr__nav-link) {
          font-size: 14.5px;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          transition: color 0.15s;
          white-space: nowrap;
        }
        :global(.hdr__nav-link:hover) {
          color: #0EA5E9;
        }

        /* === Bell === */
        .bell-wrap {
          position: relative;
        }
        .bell-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }
        .bell-btn:hover {
          background: #f1f5f9;
        }
        .bell-btn--active {
          background: #e0f2fe;
        }

        .bell-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          min-width: 15px;
          height: 15px;
          padding: 0 4px;
          border-radius: 999px;
          background: #ef4444;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 2px #fff;
          line-height: 1;
        }

        /* === Avatar Button === */
        .hdr__avatar-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #0EA5E9;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hdr__avatar-btn:hover {
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
        }
        .hdr__avatar-btn--active {
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.4);
          background: #0284C7;
        }

        /* === User Dropdown Menu === */
        .user-wrap {
          position: relative;
        }
        .user-drop {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 220px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          padding: 6px 0;
          z-index: 10000;
          animation: user-drop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes user-drop-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .user-drop__header {
          padding: 10px 16px;
        }
        .user-drop__name {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-drop__role {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          margin: 2px 0 0 0;
        }

        .user-drop__divider {
          height: 1px;
          background: #f1f5f9;
          margin: 6px 0;
        }

        .user-drop__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        :global(.user-drop__item) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          transition: all 0.12s;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }
        :global(.user-drop__item:hover) {
          background: #f8fafc;
          color: #0EA5E9;
        }
        :global(.user-drop__item--logout) {
          color: #ef4444;
        }
        :global(.user-drop__item--logout:hover) {
          background: #fff5f5;
          color: #dc2626;
        }

        /* === Header Auth Buttons === */
        /* Secondary Action (Register) */
        :global(.hdr__btn-secondary) {
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          padding: 8px 18px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          transition: all 0.15s;
          white-space: nowrap;
        }
        :global(.hdr__btn-secondary:hover) {
          background: #f8fafc;
          color: #1e293b;
          border-color: #cbd5e1;
        }

        /* Primary Highlighted Action (Login) */
        :global(.hdr__btn-primary) {
          padding: 8px 22px;
          background: #0EA5E9;
          color: #fff;
          border-radius: 20px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.15s;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
        }
        :global(.hdr__btn-primary:hover) {
          background: #0284C7;
          box-shadow: 0 4px 16px rgba(2, 132, 199, 0.25);
        }

        /* Mobile Responsive adjustments */
        @media (max-width: 768px) {
          .hdr__inner {
            grid-template-columns: 1fr auto;
          }
          .hdr__left-spacer, .hdr__center-group .hdr__nav-link {
            display: none;
          }
          .hdr__center-group {
            gap: 0;
          }
        }
      `}</style>
    </>
  );
}
