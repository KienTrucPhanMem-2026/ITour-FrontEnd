"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { getMyBookingsAPI, getBookingPaymentUrlAPI } from "@/lib/api/bookings";
import { useBookingTimer } from "@/hooks/useBookingTimer";
import type { BookingResponseDTO } from "@/types/api";

// ─── Sub-component: một booking card với countdown timer ───────────────────
function BookingCard({ booking }: { booking: BookingResponseDTO }) {
  const isPending = booking.status === "PENDING";
  const isPaid = booking.status === "PAID" || booking.paymentStatus === "PAID";
  const isCancelled = booking.status === "CANCELLED";

  const [currentPaymentUrl, setCurrentPaymentUrl] = useState<string | null>(
    booking.paymentUrl || null
  );

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const { formattedTime, isExpired, progressPercent } = useBookingTimer(
    isPending ? booking.expireAt : null
  );

  useEffect(() => {
    if (!isPending || currentPaymentUrl || isExpired) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const data = await getBookingPaymentUrlAPI(booking.bookingId);
        if (data.paymentUrl) {
          setCurrentPaymentUrl(data.paymentUrl);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        // ignore errors silently
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isPending, currentPaymentUrl, isExpired, booking.bookingId]);

  const handlePayNow = () => {
    if (currentPaymentUrl) window.location.href = currentPaymentUrl;
  };

  const statusBadge = () => {
    if (isPaid)
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
          ✅ Đã thanh toán
        </span>
      );
    if (isCancelled || (isPending && isExpired))
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
          ❌ Đã hủy
        </span>
      );
    if (isPending)
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
          ⏳ Chờ thanh toán
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
        {booking.status}
      </span>
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border ${
        isPending && !isExpired
          ? "border-amber-200"
          : isCancelled || (isPending && isExpired)
          ? "border-red-100"
          : isPaid
          ? "border-green-100"
          : "border-gray-100"
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                {booking.bookingId}
              </span>
              {statusBadge()}
            </div>
            <h3 className="text-lg font-bold text-gray-900 truncate mt-1">
              {booking.tourName || "—"}
            </h3>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
              <span>👤 {booking.adults} người lớn</span>
              {(booking.children ?? 0) > 0 && (
                <span>👦 {booking.children} trẻ em</span>
              )}
              {booking.bookingDate && (
                <span>
                  🗓️{" "}
                  {new Date(booking.bookingDate).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-[#0EA5E9]">
              {booking.finalPrice
                ? `${(booking.finalPrice / 1_000_000).toFixed(1)}M₫`
                : "—"}
            </div>
            {booking.paymentMethod && (
              <div className="text-xs text-gray-400 mt-1">
                {booking.paymentMethod}
              </div>
            )}
          </div>
        </div>

        {/* Countdown + Pay button cho PENDING booking chưa hết hạn */}
        {isPending && !isExpired && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <p className="text-xs text-amber-600 font-semibold mb-1">
                  ⏰ Thời gian giữ chỗ còn lại
                </p>
                <div
                  className={`text-3xl font-mono font-bold tabular-nums ${
                    progressPercent > 80
                      ? "text-red-600"
                      : progressPercent > 50
                      ? "text-orange-500"
                      : "text-amber-700"
                  }`}
                >
                  {formattedTime}
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      progressPercent > 80
                        ? "bg-red-400"
                        : progressPercent > 50
                        ? "bg-orange-400"
                        : "bg-amber-400"
                    }`}
                    style={{ width: `${100 - progressPercent}%` }}
                  />
                </div>
              </div>

              {currentPaymentUrl ? (
                <button
                  onClick={handlePayNow}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] text-white font-bold rounded-xl shadow hover:shadow-md transition-all hover:scale-[1.02] whitespace-nowrap"
                >
                  💳 Thanh toán ngay
                </button>
              ) : (
                <button
                  disabled
                  className="px-5 py-2.5 bg-gray-200 text-gray-500 font-bold rounded-xl cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Đang tạo link...
                </button>
              )}
            </div>
          </div>
        )}

        {/* Expired notice */}
        {isPending && isExpired && (
          <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Đã hủy do hết hạn thanh toán
            </p>
          </div>
        )}

        {/* Paid success badge */}
        {isPaid && (
          <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
            <span className="text-green-600 text-sm font-medium">
              🎉 Đặt tour thành công! Email xác nhận đã được gửi.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const isReady = useProtectedRoute();
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "profile">(
    "overview"
  );

  // User info
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    point?: number;
  } | null>(null);

  // Bookings từ API
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser({
        id: storedUser.id,
        name: storedUser.fullName || storedUser.userName || "",
        email: storedUser.email,
        phone: storedUser.phone,
        address: storedUser.address,
        point: (storedUser as { point?: number }).point ?? 0,
      });
    }
  }, []);

  // Tải bookings khi switch sang tab "bookings"
  useEffect(() => {
    if (activeTab !== "bookings" || !user) return;
    setLoadingBookings(true);
    getMyBookingsAPI(user.id)
      .then((data) => {
        const sorted = (data || []).sort((a: any, b: any) => {
          return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
        });
        setBookings(sorted);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, [activeTab, user]);

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

  const paidCount = bookings.filter((b) => b.status === "PAID").length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const totalSpent = bookings
    .filter((b) => b.status === "PAID")
    .reduce((sum, b) => sum + (b.finalPrice ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F8F8]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#0EA5E9] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
            {(user.point ?? 0) > 0 && (
              <p className="text-sm font-semibold text-[#0EA5E9] mt-1">
                ⭐ {user.point?.toLocaleString("vi-VN")} điểm tích lũy
              </p>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {(
            [
              { key: "overview", label: "Tổng Quan" },
              { key: "bookings", label: `Đơn Đặt Tours${bookings.length > 0 ? ` (${bookings.length})` : ""}` },
              { key: "profile", label: "Thông Tin Cá Nhân" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.key
                  ? "border-[#0EA5E9] text-[#0EA5E9]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Tổng Quan ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-semibold">Đã Thanh Toán</h3>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">✅</div>
              </div>
              <p className="text-4xl font-bold text-gray-900">{paidCount}</p>
              <p className="text-sm text-gray-500 mt-2">đơn thành công</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-semibold">Chờ Thanh Toán</h3>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xl">⏳</div>
              </div>
              <p className="text-4xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500 mt-2">đơn đang chờ</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-semibold">Tổng Chi Tiêu</h3>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">💰</div>
              </div>
              <p className="text-4xl font-bold text-gray-900">
                {(totalSpent / 1_000_000).toFixed(1)}M₫
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
                <button
                  onClick={() => setActiveTab("bookings")}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                >
                  Xem Đơn Đặt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Đơn Đặt Tours ── */}
        {activeTab === "bookings" && (
          <div>
            {loadingBookings ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <BookingCard key={booking.bookingId} booking={booking} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-md">
                <div className="text-6xl mb-4">🧳</div>
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

        {/* ── Tab: Profile ── */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Thông Tin Cá Nhân</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Họ và Tên</label>
                  <input type="text" defaultValue={user.name}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                  <input type="email" defaultValue={user.email}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Số Điện Thoại</label>
                  <input type="tel" defaultValue={user.phone || ""}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Địa Chỉ</label>
                  <input type="text" defaultValue={user.address || ""}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
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
