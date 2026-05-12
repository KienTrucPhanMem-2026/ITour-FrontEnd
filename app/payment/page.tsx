"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBookingAPI } from "@/lib/api/bookings";
import { createMomoPaymentAPI } from "@/lib/api/payment";
import { getTourByIdAPI } from "@/lib/api/tours";
import { useCurrentUser } from "@/hooks/useAuth";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { ApiError } from "@/lib/api/config";
import type { TourDTO, TourScheduleDTO, PaymentMethod } from "@/types/api";

function formatPrice(amount: number): string {
  return `${(amount / 1_000_000).toFixed(1)}M₫`;
}

function formatDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

// ─────────────────────────────────────────────────────────────
function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReady = useProtectedRoute(); // Bảo vệ trang - redirect nếu chưa login
  const currentUser = useCurrentUser();

  const tourId = searchParams.get("tourId") ?? "";
  const scheduleId = searchParams.get("scheduleId") ?? "";
  const adults = parseInt(searchParams.get("adults") ?? "1");
  const children = parseInt(searchParams.get("children") ?? "0");

  const [tour, setTour] = useState<TourDTO | null>(null);
  const [schedule, setSchedule] = useState<TourScheduleDTO | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("VNPAY");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fill user info once loaded
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      }));
    }
  }, [currentUser]);

  // Fetch tour + schedule từ embedded schedules
  useEffect(() => {
    if (!isReady || !tourId) return;
    const load = async () => {
      try {
        setLoadingData(true);
        const tourData = await getTourByIdAPI(tourId);
        setTour(tourData);
        // Lấy schedule từ tour.schedules thay vì gọi API riêng
        if (scheduleId && tourData.schedules) {
          const found = tourData.schedules.find((s) => s.id === scheduleId);
          setSchedule(found ?? null);
        }
      } catch {
        setApiError("Không thể tải thông tin tour. Vui lòng quay lại.");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [isReady, tourId, scheduleId]);

  if (!isReady) return null;

  // Price calculation
  const unitPrice = schedule?.price ?? tour?.price ?? 0;
  const adultTotal = unitPrice * adults;
  const childTotal = unitPrice * 0.7 * children;
  const totalPrice = adultTotal + childTotal;

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên";
    if (!formData.phone.match(/^[0-9]{10,20}$/)) errs.phone = "Số điện thoại không hợp lệ";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    if (!currentUser || !tour || !scheduleId) return;

    setLoading(true);
    try {
      const bookingRequest = {
        customerId: currentUser.id,
        tourId: tour.id,
        tourScheduleId: scheduleId,
        adults,
        children,
        paymentMethod,
      };

      if (paymentMethod === "MOMO") {
        // MoMo payment flow: create booking + payment in one call
        const momoResponse = await createMomoPaymentAPI(bookingRequest);
        
        if (momoResponse.resultCode === 0 && momoResponse.payUrl) {
          // Redirect to MoMo payment page
          window.location.href = momoResponse.payUrl;
        } else {
          setApiError("Không thể tạo liên kết thanh toán MoMo. Vui lòng thử lại.");
        }
      } else {
        // Other payment methods: create booking + redirect to confirmation
        const result = await createBookingAPI(bookingRequest);
        
        // Lưu kết quả tạm để trang confirmation dùng
        sessionStorage.setItem("lastBooking", JSON.stringify(result));
        router.push(`/payment/confirmation?bookingId=${result.bookingId}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError("Đặt tour thất bại. Vui lòng thử lại.");
      }
      console.error("Booking error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{apiError || "Tour không tìm thấy"}</p>
          <Link href="/tours" className="text-[#0EA5E9] hover:underline">Quay lại danh sách tour</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#0EA5E9] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Du Lịch Việt</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Xác Nhận Đặt Tour</h1>
          <div className="text-right">
            <p className="text-xs text-gray-500">Đặt tour với tư cách</p>
            <p className="font-semibold text-gray-900 text-sm">{currentUser?.fullName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* API error */}
        {apiError && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Form ── */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Contact info */}
              <div className="bg-white rounded-2xl shadow-sm p-7 mb-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Thông Tin Liên Hệ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ Tên *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: "" }); }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${formErrors.fullName ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số Điện Thoại *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => { setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") }); if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" }); }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${formErrors.phone ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-none"
                      placeholder="Yêu cầu đặc biệt..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-2xl shadow-sm p-7 mb-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Phương Thức Thanh Toán</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    { id: "VNPAY", label: "VNPay", icon: "🏦" },
                    { id: "CREDITCARD", label: "Thẻ Tín Dụng", icon: "💳" },
                    { id: "MOMO", label: "Momo", icon: "💰" },
                  ] as { id: PaymentMethod; label: string; icon: string }[]).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-4 border-2 rounded-xl transition-all text-center ${
                        paymentMethod === m.id
                          ? "border-[#0EA5E9] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{m.icon}</div>
                      <p className="text-xs font-semibold text-gray-700">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#00D084] hover:bg-[#00B86F] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Xác Nhận Đặt Tour — ${formatPrice(totalPrice)}`
                )}
              </button>
            </form>
          </div>

          {/* ── Summary sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Tóm Tắt Đơn</h3>

              <div className="space-y-3 text-sm mb-5">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Tour</p>
                  <p className="font-semibold text-gray-900">{tour.name}</p>
                </div>
                {schedule && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Lịch khởi hành</p>
                    <p className="font-semibold text-gray-900">{formatDate(schedule.startDate)}</p>
                    {schedule.endDate && <p className="text-gray-500 text-xs">→ {formatDate(schedule.endDate)}</p>}
                  </div>
                )}
                {tour.durationDays && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Thời gian</p>
                    <p className="font-semibold text-gray-900">{tour.durationDays}N{tour.durationNights ? `/${tour.durationNights}Đ` : ""}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Người lớn × {adults}</span>
                  <span>{formatPrice(adultTotal)}</span>
                </div>
                {children > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Trẻ em × {children}</span>
                    <span>{formatPrice(childTotal)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Tổng cộng</span>
                  <span className="font-bold text-[#00D084] text-xl">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="mt-5 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                <p className="text-xs text-green-700">🔒 Thanh toán an toàn 100%</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
