"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Booking } from "@/lib/mockData";
import { mockBookings } from "@/lib/mockData";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

export default function DashboardPage() {
  const router = useRouter();
  const isReady = useProtectedRoute(); // Bảo vệ trang - redirect nếu chưa login
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "profile">(
    "overview"
  );

  useEffect(() => {
    // Load user data từ localStorage
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }

    // Load mock bookings
    setBookings(mockBookings.filter((b) => b.userId === "user-1"));
  }, []);

  const handleLogout = () => {
    clearStoredUser();
    router.push("/");
  };

  if (!isReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8F8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  const totalSpent = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#F5F8F8]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#0EA5E9] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Du Lịch Việt</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/tours" className="text-sm font-medium text-gray-600 hover:text-[#0EA5E9]">
              Khám Phá Tours
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-semibold transition-colors"
            >
              Đăng Xuất
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* ── User Header ── */}
        <div className="bg-white rounded-2xl p-8 shadow-md mb-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] flex items-center justify-center text-white text-3xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">{user.phone}</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === "overview"
                ? "border-[#0EA5E9] text-[#0EA5E9]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === "bookings"
                ? "border-[#0EA5E9] text-[#0EA5E9]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Đơn Đặt Tours ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === "profile"
                ? "border-[#0EA5E9] text-[#0EA5E9]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Thông Tin Cá Nhân
          </button>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-semibold">Đơn Đã Đặt</h3>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900">{bookings.length}</p>
              <p className="text-sm text-gray-500 mt-2">tổng cộng</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-semibold">Đơn Đã Xác Nhận</h3>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900">{confirmedBookings}</p>
              <p className="text-sm text-gray-500 mt-2">sắp tới</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-semibold">Tổng Chi Tiêu</h3>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.16 5.314l4.897-1.596A1 1 0 0114.803 4.9l4.401 14.653a1 1 0 01-1.282 1.278l-4.897-1.596.5 6.428a1 1 0 11-1.998.066L10.5 20.9l-1.5 1.5a1 1 0 01-1.414-1.414l1.5-1.5-1.503-19.228a1 1 0 011.582-1.031z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900">
                {(totalSpent / 1000000).toFixed(1)}M₫
              </p>
              <p className="text-sm text-gray-500 mt-2">đã chi tiêu</p>
            </div>

            {/* Quick actions */}
            <div className="md:col-span-3 bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Hành Động Nhanh</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/tours"
                  className="px-6 py-2 bg-[#0EA5E9] text-white rounded-full font-semibold hover:bg-[#0284C7] transition-colors"
                >
                  Đặt Tour Mới
                </Link>
                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors">
                  Xem Yêu Thích
                </button>
                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors">
                  Liên Hệ Hỗ Trợ
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {booking.tourTitle}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 Ngày khởi hành: {new Date(booking.checkIn).toLocaleDateString("vi-VN")}
                        </p>
                        <p className="text-sm text-gray-600">
                          👥 Số người: {booking.participants}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#0EA5E9]">
                          {(booking.totalPrice / 1000000).toFixed(1)}M₫
                        </div>
                        <div className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {booking.status === "confirmed" ? "✓ Xác nhận" : "⏳ Chờ xác nhận"}
                        </div>
                      </div>
                    </div>
                    <button className="mt-4 px-4 py-2 border border-[#0EA5E9] text-[#0EA5E9] rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                      Xem Chi Tiết
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-md">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 text-lg mb-4">
                  Bạn chưa có đơn đặt tour nào
                </p>
                <Link
                  href="/tours"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#0EA5E9] text-white rounded-full font-semibold hover:bg-[#0284C7]"
                >
                  Đặt Tour Ngay
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Thông Tin Cá Nhân</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    defaultValue={user.phone || ""}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Địa Chỉ
                  </label>
                  <input
                    type="text"
                    defaultValue={user.address || ""}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  />
                </div>
                <button className="w-full px-6 py-2 bg-[#0EA5E9] text-white rounded-lg font-semibold hover:bg-[#0284C7] transition-colors">
                  Lưu Thay Đổi
                </button>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Bảo Mật</h3>
                <button className="w-full px-6 py-2 border border-[#0EA5E9] text-[#0EA5E9] rounded-lg font-semibold hover:bg-blue-50 transition-colors mb-3">
                  Đổi Mật Khẩu
                </button>
                <button className="w-full px-6 py-2 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors">
                  Xóa Tài Khoản
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>© 2026 Du Lịch Việt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
