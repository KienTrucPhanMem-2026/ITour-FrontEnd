"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const bookings = JSON.parse(localStorage.getItem("userBookings") || "[]");
    const foundBooking = bookings.find((b: any) => b.id === bookingId);
    setBooking(foundBooking);
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
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
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-20">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center mb-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Thanh Toán Thành Công!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Đơn đặt tour của bạn đã được xác nhận. Chúng tôi sẽ liên hệ sớm để
            xác nhận thêm.
          </p>

          {/* Booking Details */}
          {booking && (
            <div className="bg-gray-50 rounded-2xl p-8 mb-8 text-left">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Chi Tiết Đặt Tour
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Mã đơn:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {booking.id}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Tour:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.tourTitle}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Ngày khởi hành:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.checkIn).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Số người:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.participants} người
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
                    {booking.status === "confirmed" ? "✓ Xác nhận" : "Chờ xử lý"}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-bold text-gray-900">
                    Tổng cộng:
                  </span>
                  <span className="text-3xl font-bold text-[#00D084]">
                    {(booking.totalPrice / 1000000).toFixed(1)}M₫
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Important Info */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">ℹ️</span> Thông Tin Quan Trọng
            </h3>
            <ul className="space-y-2 text-sm text-blue-900">
              <li>
                ✓ Bạn sẽ nhận email xác nhận tại địa chỉ email đăng ký
              </li>
              <li>✓ Hướng dẫn viên sẽ liên hệ 24 giờ trước tour</li>
              <li>✓ Vui lòng đến điểm tập trung 15 phút trước giờ khởi hành</li>
              <li>✓ Hủy tour miễn phí trước 7 ngày</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard"
              className="py-3 bg-[#0EA5E9] hover:bg-[#0185B8] text-white font-bold rounded-lg transition-colors"
            >
              Xem Đơn Hàng
            </Link>
            <Link
              href="/tours"
              className="py-3 border-2 border-[#0EA5E9] text-[#0EA5E9] hover:bg-blue-50 font-bold rounded-lg transition-colors"
            >
              Xem Tour Khác
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <p className="text-gray-600 mb-3">Cần hỗ trợ thêm?</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="tel:+84901234567"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              📞 Hotline: 0901234567
            </a>
            <a
              href="mailto:support@dulichviet.com"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              📧 Email: support@dulichviet.com
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  const isReady = useProtectedRoute(); // Bảo vệ trang - redirect nếu chưa login

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8F8]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]"></div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]\"></div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
