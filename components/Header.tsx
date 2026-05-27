"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { logoutAPI } from "@/lib/api/auth";
import type { UserProfile } from "@/types/api";

export default function Header({ logoSrc = "/assets/3-3.png" }: { logoSrc?: string }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } finally {
      clearStoredUser();
      window.location.href = "/login";
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src={logoSrc}
            alt="iTour Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-[#0EA5E9] transition-colors">
            Trang chủ
          </Link>
          <Link href="/tours" className="hover:text-[#0EA5E9] transition-colors">
            Tour du lịch
          </Link>
          <a href="#" className="hover:text-[#0EA5E9] transition-colors">
            Khách sạn
          </a>
          <a href="#" className="hover:text-[#0EA5E9] transition-colors">
            Tin tức
          </a>
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <Link
                href="/profile"
                className="hidden md:flex items-center gap-2 text-sm text-gray-700 hover:text-[#0EA5E9]"
              >
                <div className="w-8 h-8 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white font-bold text-xs">
                  {(currentUser.fullName || currentUser.userName || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <span className="font-semibold">
                  {currentUser.fullName || currentUser.userName}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex text-sm font-semibold text-[#0EA5E9] hover:underline"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-[#0EA5E9] text-white rounded-full text-sm font-semibold hover:bg-[#0284C7] transition-colors"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
