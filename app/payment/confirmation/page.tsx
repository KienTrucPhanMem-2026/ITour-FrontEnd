"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { getBookingPaymentUrlAPI } from "@/lib/api/bookings";
import { getTourByIdAPI } from "@/lib/api/tours";
import { apiFetch } from "@/lib/api/config";
import Header from "@/components/Header";

function makeSlug(tourName: string): string {
  return (tourName ?? "tour")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  let bookingId = searchParams.get("bookingId");

  const partnerCode = searchParams.get("partnerCode");
  const requestId = searchParams.get("requestId");
  const amount = searchParams.get("amount");
  const orderInfo = searchParams.get("orderInfo");
  const orderType = searchParams.get("orderType");
  const transId = searchParams.get("transId");
  const resultCode = searchParams.get("resultCode");
  const message = searchParams.get("message");
  const payType = searchParams.get("payType");
  const responseTime = searchParams.get("responseTime");
  const extraData = searchParams.get("extraData");
  const signature = searchParams.get("signature");

  // If redirected by MoMo, the booking ID is in the orderId as "BOOKING_bookingId_timestamp"
  if (!bookingId && orderId) {
    const parts = orderId.split("_");
    if (parts.length >= 2 && parts[0] === "BOOKING") {
      bookingId = parts[1];
    }
  }

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repaying, setRepaying] = useState(false);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    try {
      // Fetch booking DTO which has the latest status from database
      const dto = await getBookingPaymentUrlAPI(bookingId);
      if (!dto) {
        throw new Error("Không tìm thấy thông tin đơn hàng.");
      }

      // Fetch tour details to get departure date
      let departureDate = null;
      let tourSlug = "";
      try {
        const tourData = await getTourByIdAPI(dto.tourId);
        const schedule = tourData.schedules?.find((s: any) => s.id === dto.tourScheduleId);
        if (schedule) {
          departureDate = schedule.startDate;
        }
        tourSlug = makeSlug(tourData.name);
      } catch (e) {
        console.error("Lỗi khi tải thông tin tour:", e);
      }

      setBooking({
        id: dto.bookingId,
        tourTitle: dto.tourName,
        checkIn: departureDate || dto.bookingDate,
        participants: dto.quantity,
        status: dto.status,
        paymentStatus: dto.paymentStatus,
        totalPrice: dto.finalPrice,
        tourId: dto.tourId,
        tourSlug,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể tải thông tin đơn hàng.");
    }
  };

  const handleRepay = async () => {
    if (!bookingId) return;
    setRepaying(true);
    try {
      const res = await apiFetch<any>(`/payment/momo/create?bookingId=${bookingId}`, {
        method: "POST",
      });
      if (res && res.payUrl) {
        window.location.href = res.payUrl;
      } else {
        throw new Error("Không lấy được đường dẫn thanh toán mới từ MoMo.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không thể khởi tạo giao dịch thanh toán mới.");
    } finally {
      setRepaying(false);
    }
  };

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const initialize = async () => {
      setLoading(true);
      setError(null);

      // If user was redirected from MoMo, notify the backend callback
      if (resultCode !== null) {
        try {
          const body = {
            partnerCode,
            orderId,
            requestId,
            amount: amount ? parseInt(amount, 10) : 0,
            orderInfo,
            orderType,
            transId: transId ? parseInt(transId, 10) : 0,
            resultCode: resultCode ? parseInt(resultCode, 10) : 0,
            message,
            payType,
            responseTime: responseTime ? parseInt(responseTime, 10) : 0,
            extraData,
            signature,
          };

          await apiFetch("/payment/momo/callback", {
            method: "POST",
            body: JSON.stringify(body),
          });
        } catch (e) {
          console.error("Lỗi khi gửi callback thanh toán cho backend:", e);
        }
      }

      await fetchBookingDetails();
      setLoading(false);
    };

    initialize();
  }, [bookingId, resultCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0EA5E9]"></div>
          <p className="text-sm text-slate-400 font-medium">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full mx-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-slate-500 mb-6 text-sm">{error || "Đơn hàng không tồn tại hoặc thông tin không chính xác."}</p>
          <Link href="/profile" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow hover:bg-[#0EA5E9] transition-all">
            Quay lại lịch sử đặt tour
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = booking.paymentStatus === "PAID" || booking.status === "PAID";
  const isFailed = booking.paymentStatus === "FAILED" || booking.status === "CANCELLED" || (resultCode !== null && resultCode !== "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <Header></Header>

      <main className="max-w-2xl mx-auto px-6 py-20">
        {/* Success/Failure Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Status Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isPaid
            ? 'bg-green-50 border border-green-100'
            : isFailed
              ? 'bg-red-50 border border-red-100'
              : 'bg-amber-50 border border-amber-100'
            }`}>
            {isPaid ? (
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : isFailed ? (
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-10 h-10 text-amber-600 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            {isPaid
              ? "Thanh Toán Thành Công!"
              : isFailed
                ? "Thanh Toán Thất Bại!"
                : "Đang Xử Lý Thanh Toán..."}
          </h1>
          <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            {isPaid
              ? "Đơn đặt tour của bạn đã được thanh toán và xác nhận thành công. Hướng dẫn chi tiết đã được gửi đến email của bạn."
              : isFailed
                ? "Giao dịch thanh toán đã thất bại hoặc bị hủy bỏ. Quý khách vui lòng thanh toán lại hoặc liên hệ bộ phận hỗ trợ."
                : "Chúng tôi đang xác nhận thanh toán từ cổng thanh toán MoMo. Vui lòng tải lại trang hoặc kiểm tra chi tiết đơn hàng."}
          </p>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-slate-100/50">
            <h2 className="text-base font-black text-gray-900 mb-5">
              Chi Tiết Đặt Tour
            </h2>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Mã đơn:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded text-[11px]">
                  {booking.id}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Tour:</span>
                {booking.tourSlug ? (
                  <Link
                    href={`/tours/${booking.tourSlug}?id=${booking.tourId}`}
                    className="font-extrabold text-[#0EA5E9] hover:underline text-right max-w-[70%] line-clamp-1"
                  >
                    {booking.tourTitle}
                  </Link>
                ) : (
                  <span className="font-extrabold text-slate-900 text-right max-w-[70%] line-clamp-1">
                    {booking.tourTitle}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Ngày khởi hành:</span>
                <span className="font-extrabold text-slate-900">
                  {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  }) : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Số người:</span>
                <span className="font-extrabold text-slate-900">
                  {booking.participants} người
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider ${isPaid
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : isFailed
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                  {isPaid ? "✓ Đã thanh toán" : isFailed ? "Thất bại / Đã hủy" : "Đang xử lý"}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <span className="text-sm font-black text-slate-900">
                  Tổng cộng:
                </span>
                <span className="text-xl font-black text-emerald-600">
                  {booking.totalPrice ? `${booking.totalPrice.toLocaleString("vi-VN")} đ` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div className="bg-blue-50/50 border-l-4 border-blue-500 rounded-xl p-5 mb-8 text-left text-xs">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-1.5">
              <span className="text-lg">ℹ️</span> Thông Tin Quan Trọng
            </h3>
            <ul className="space-y-1.5 text-blue-800 font-medium">
              <li>
                ✓ Bạn sẽ nhận email xác nhận chi tiết tại địa chỉ email đăng ký.
              </li>
              <li>✓ Hướng dẫn viên sẽ liên hệ với bạn 24 giờ trước khi tour khởi hành.</li>
              <li>✓ Vui lòng có mặt tại điểm tập trung ít nhất 15 phút trước giờ xuất phát.</li>
              <li>✓ Hỗ trợ hủy tour miễn phí theo chính sách trước 7 ngày khởi hành.</li>
            </ul>
          </div>

          {/* Passenger Info Reminder */}
          {isPaid && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div className="flex-grow">
                  <h3 className="font-black text-indigo-900 text-sm mb-1">Bổ sung thông tin hành khách</h3>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Để hành trình được chuẩn bị tốt nhất, vui lòng cập nhật đầy đủ thông tin hành khách (họ tên, ngày sinh, số CMND/CCCD…) tại trang chi tiết đặt tour.
                  </p>
                  <Link
                    href={`/profile/bookings/${booking.id}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-black text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 transition-all hover:bg-indigo-50"
                  >
                    ✏️ Nhập thông tin hành khách ngay
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isFailed ? (
              <>
                <button
                  onClick={handleRepay}
                  disabled={repaying}
                  className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-center text-sm font-sans flex items-center justify-center gap-2"
                >
                  {repaying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang tạo liên kết...
                    </>
                  ) : (
                    "Thanh Toán Lại"
                  )}
                </button>
                <Link
                  href={`/profile/bookings/${booking.id}`}
                  className="py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all active:scale-95 text-center text-sm font-sans"
                >
                  Chi Tiết Đơn Hàng
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/profile/bookings/${booking.id}`}
                  className="py-3 bg-[#0EA5E9] hover:bg-[#0185B8] text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-center text-sm font-sans"
                >
                  Xem Chi Tiết Đơn Hàng
                </Link>
                <Link
                  href="/tours"
                  className="py-3 border-2 border-[#0EA5E9] hover:bg-sky-50/50 text-[#0EA5E9] font-bold rounded-xl transition-all active:scale-95 text-center text-sm font-sans"
                >
                  Khám Phá Tour Khác
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-3">Cần hỗ trợ thêm?</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="tel:+84901234567"
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-bold text-slate-700 shadow-sm"
            >
              📞 Hotline: 0901234567
            </a>
            <a
              href="mailto:support@itour.com"
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-bold text-slate-700 shadow-sm"
            >
              📧 Email: support@itour.com
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]"></div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
