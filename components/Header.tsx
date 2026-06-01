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

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconVoucher() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <circle cx="6" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      {/* Inner: 3-column grid to perfectly center the logo+nav group */}
      <div className="max-w-[1280px] mx-auto px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center">

        {/* LEFT: Empty spacer */}
        <div />

        {/* CENTER: Nav – Logo – Nav */}
        <div className="flex items-center gap-[50px]">
          <Link
            href="/tours"
            className="text-[14.5px] font-semibold text-slate-500 no-underline transition-colors duration-150 whitespace-nowrap hover:text-sky-500 hidden md:block"
          >
            Tour du lịch
          </Link>

          <Link href="/" className="flex items-center shrink-0">
            <img src={logoSrc} alt="iTour Logo" className="h-[38px] w-auto object-contain" />
          </Link>

          <a
            href="#"
            className="text-[14.5px] font-semibold text-slate-500 no-underline transition-colors duration-150 whitespace-nowrap hover:text-sky-500 hidden md:block"
          >
            Tin tức
          </a>
        </div>

        {/* RIGHT: Actions / Auth */}
        <div className="flex items-center justify-end gap-3">
          {currentUser ? (
            <>
              {/* Bell notification button */}
              <div className="relative">
                <button
                  id="notification-bell-btn"
                  aria-label="Thông báo"
                  onClick={toggleNoti}
                  className={`relative flex items-center justify-center w-[38px] h-[38px] rounded-full border-none cursor-pointer transition-colors duration-150 ${
                    notiOpen ? "bg-sky-100" : "bg-transparent hover:bg-slate-100"
                  }`}
                >
                  <BellIcon hasUnread={unreadCount > 0} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_0_2px_#fff] leading-none">
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
              <div className="relative" ref={userDropRef}>
                <button
                  onClick={toggleUserDrop}
                  aria-label="Tài khoản cá nhân"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border-2 border-transparent cursor-pointer transition-all duration-150 ${
                    userDropOpen
                      ? "bg-sky-100 border-sky-500"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <div className={`w-[34px] h-[34px] rounded-full text-white text-[13px] font-bold flex items-center justify-center transition-all duration-150 ${
                    userDropOpen
                      ? "bg-sky-600"
                      : "bg-sky-500"
                  }`}>
                    {(currentUser.fullName || currentUser.userName || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <span className="text-[13px] font-semibold text-slate-700 hidden md:block max-w-[120px] truncate">
                    {currentUser.fullName || currentUser.userName}
                  </span>
                </button>

                {userDropOpen && (
                  <div className="absolute top-[calc(100%+10px)] right-0 w-[220px] bg-white rounded-xl border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.1)] py-1.5 z-[10000] animate-user-drop-in">
                    {/* User Info Header */}
                    <div className="px-4 py-2.5">
                      <p className="text-sm font-bold text-slate-800 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                        {currentUser.fullName || currentUser.userName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5 mb-0">Khách hàng</p>
                    </div>

                    <div className="h-px bg-slate-100 my-1.5" />

                    {/* Dropdown list items */}
                    <ul className="list-none m-0 p-0">
                      <li>
                        <Link
                          href="/profile?tab=info"
                          onClick={closeUserDrop}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-500 no-underline transition-all duration-100 bg-transparent w-full text-left cursor-pointer hover:bg-slate-50 hover:text-sky-500"
                        >
                          <IconUser />
                          Thông tin tài khoản
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/profile?tab=bookings"
                          onClick={closeUserDrop}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-500 no-underline transition-all duration-100 bg-transparent w-full text-left cursor-pointer hover:bg-slate-50 hover:text-sky-500"
                        >
                          <IconCalendar />
                          Chuyến đi của tôi
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/profile?tab=vouchers"
                          onClick={closeUserDrop}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-500 no-underline transition-all duration-100 bg-transparent w-full text-left cursor-pointer hover:bg-slate-50 hover:text-sky-500"
                        >
                          <IconVoucher />
                          Ví voucher của tôi
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/profile?tab=favourites"
                          onClick={closeUserDrop}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-500 no-underline transition-all duration-100 bg-transparent w-full text-left cursor-pointer hover:bg-slate-50 hover:text-sky-500"
                        >
                          <IconHeart />
                          Tour yêu thích
                        </Link>
                      </li>
                    </ul>

                    <div className="h-px bg-slate-100 my-1.5" />

                    {/* Logout option */}
                    <button
                      onClick={() => {
                        closeUserDrop();
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-red-500 no-underline transition-all duration-100 bg-transparent border-none w-full text-left cursor-pointer hover:bg-red-50 hover:text-red-600"
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
              {/* Register – secondary */}
              <Link
                href="/register"
                className="text-[13.5px] font-semibold text-slate-500 no-underline px-[18px] py-2 rounded-full border border-slate-200 transition-all duration-150 whitespace-nowrap hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300"
              >
                Đăng ký
              </Link>
              {/* Login – primary */}
              <Link
                href="/login"
                className="px-[22px] py-2 bg-sky-500 text-white rounded-full text-[13.5px] font-bold no-underline transition-all duration-150 whitespace-nowrap shadow-[0_4px_12px_rgba(14,165,233,0.15)] hover:bg-sky-600 hover:shadow-[0_4px_16px_rgba(2,132,199,0.25)]"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
