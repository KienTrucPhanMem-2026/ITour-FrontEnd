"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBookingAPI, getBookingPaymentUrlAPI } from "@/lib/api/bookings";
import { getTourByIdAPI, getDiscountsByTourAPI } from "@/lib/api/tours";
import { getUserVouchersAPI } from "@/lib/api/users";
import { useCurrentUser } from "@/hooks/useAuth";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useBookingTimer } from "@/hooks/useBookingTimer";
import { ApiError } from "@/lib/api/config";
import type { TourDTO, TourScheduleDTO, PaymentMethod, BookingResponseDTO } from "@/types/api";
import Header from "@/components/Header";
import { Ticket, Tag, ChevronDown, Check, Percent } from "lucide-react";


function formatPrice(amount: number): string {
  return `${(amount / 1_000_000).toFixed(1)}M₫`;
}

function formatDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function makeSlug(tourName: string): string {
  return (tourName ?? "tour")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MOMO");

  // ── Discount & Voucher state ──
  const [tourDiscounts, setTourDiscounts] = useState<any[]>([]);
  const [userVouchers, setUserVouchers] = useState<any[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<any | null>(null);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [tempSelectedDiscount, setTempSelectedDiscount] = useState<any | null>(null);

  // ── Async booking workflow state ──
  const [pendingBooking, setPendingBooking] = useState<BookingResponseDTO | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const { formattedTime, isExpired, progressPercent } = useBookingTimer(
    pendingBooking?.expireAt
  );
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

  // Fetch discounts & vouchers
  useEffect(() => {
    if (!isReady || !tourId || !currentUser) return;
    const loadDiscountsAndVouchers = async () => {
      try {
        setLoadingDiscounts(true);
        const [discountsData, vouchersData] = await Promise.all([
          getDiscountsByTourAPI(tourId).catch((err) => {
            console.error("Lỗi khi tải discounts của tour:", err);
            return [];
          }),
          getUserVouchersAPI(currentUser.id).catch((err) => {
            console.error("Lỗi khi tải vouchers của user:", err);
            return [];
          }),
        ]);
        setTourDiscounts(discountsData || []);
        setUserVouchers(vouchersData || []);
      } catch (err) {
        console.error("Lỗi chung khi tải discount/voucher:", err);
      } finally {
        setLoadingDiscounts(false);
      }
    };
    loadDiscountsAndVouchers();
  }, [isReady, tourId, currentUser]);

  // ── Polling logic: poll GET /bookings/{id}/payment-url mỗi 2 giây ──
  useEffect(() => {
    if (!pendingBooking || paymentUrl || isExpired) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    setIsPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const data = await getBookingPaymentUrlAPI(pendingBooking.bookingId);
        if (data.paymentUrl) {
          setPaymentUrl(data.paymentUrl);
          setIsPolling(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // ignore polling errors silently
      }
    }, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pendingBooking, paymentUrl, isExpired]);

  // ── Auto redirect when paymentUrl is available ──
  useEffect(() => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  }, [paymentUrl]);

  // Price calculation
  const unitPrice = schedule?.price ?? tour?.price ?? 0;
  const adultTotal = unitPrice * adults;
  const childTotal = unitPrice * 0.7 * children;
  const totalPrice = adultTotal + childTotal;

  // Calculate discount amount
  let discountAmount = 0;
  if (selectedDiscount) {
    if (selectedDiscount.discountType === "PERCENT") {
      discountAmount = (totalPrice * selectedDiscount.discountAmount) / 100;
    } else if (selectedDiscount.discountType === "AMOUNT") {
      discountAmount = selectedDiscount.discountAmount;
    }
  }
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const availableDiscounts = tourDiscounts.map((d) => {
    const userVoucher = userVouchers.find((uv) => uv.discount?.id === d.id);
    let status: "PUBLIC" | "VOUCHER" | "USED" = "PUBLIC";
    if (userVoucher) {
      const isUsed = userVoucher.used === true || userVoucher.isUsed === true;
      status = isUsed ? "USED" : "VOUCHER";
    }
    return { ...d, status, userVoucherId: userVoucher?.id };
  }).filter((d) => d.status !== "USED");

  const handleApplyPromoCode = (code: string) => {
    setPromoError(null);
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setPromoError("Vui lòng nhập mã giảm giá");
      return;
    }
    const found = availableDiscounts.find((d) => d.code.toUpperCase() === cleaned);
    if (found) {
      setSelectedDiscount(found);
      setTempSelectedDiscount(found);
      setPromoCodeInput("");
      setPromoError(null);
      setIsVoucherModalOpen(false);
    } else {
      setPromoError("Mã giảm giá không tồn tại hoặc không áp dụng cho tour này");
    }
  };

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên";
    if (!formData.phone.match(/^[0-9]{10,20}$/)) errs.phone = "Số điện thoại không hợp lệ";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePayNow = () => {
    if (paymentUrl) window.location.href = paymentUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    if (!currentUser || !tour || !scheduleId) return;

    setLoading(true);
    try {
      const bookingRequest: any = {
        customerId: currentUser.id,
        tourId: tour.id,
        tourScheduleId: scheduleId,
        adults,
        children,
        paymentMethod,
        discountId: selectedDiscount?.id || null,
      };

      // Tất cả phương thức đều dùng createBookingAPI — trả về 201 ngay lập tức
      // Consumer sẽ bất đồng bộ tạo payment URL rồi cập nhập vào DB
      const result = await createBookingAPI(bookingRequest);

      if (paymentMethod === "MOMO") {
        // Hiển thị màn hình đặt tôr thành công + countdown + chờ payment URL
        setPendingBooking(result);
      } else {
        // Phương thức khác: lưu và chuyển hướng
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

  if (!isReady || loadingData || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]" />
      </div>
    );
  }

  // ── Màn hình "Đang chuyển hướng thanh toán" hoặc "Hết hạn" ──
  if (pendingBooking) {
    if (isExpired) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-100">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Hết hạn thanh toán!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Giao dịch giữ chỗ đã quá hạn 15 phút và bị tự động hủy. Vui lòng đặt lại tour.
            </p>
            <Link
              href={`/tours/${makeSlug(tour?.name || "tour")}?id=${pendingBooking.tourId}`}
              className="block w-full py-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold rounded-xl text-center transition-colors shadow-md hover:shadow-lg"
            >
              Đặt lại tour
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-100">
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            {/* Spinning gradient border */}
            <div className="absolute inset-0 rounded-full border-4 border-t-[#D82D8B] border-r-indigo-500 border-b-purple-500 border-l-pink-300 animate-spin" />
            {/* Inner icon/logo container */}
            <div className="w-16 h-16 bg-[#D82D8B] rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">MoMo</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đang kết nối đến MoMo...</h2>
          <p className="text-gray-500 text-sm mb-6">
            Hệ thống đang chuẩn bị giao dịch và tạo liên kết thanh toán an toàn cho tour:
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left">
            <span className="text-xs font-semibold text-gray-400 uppercase">Tên Tour</span>
            <p className="text-gray-800 font-bold line-clamp-2 mt-0.5">{pendingBooking.tourName || tour?.name}</p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200/60">
              <span className="text-sm font-semibold text-gray-500">Tổng tiền</span>
              <span className="text-lg font-extrabold text-[#D82D8B]">
                {pendingBooking.finalPrice ? formatPrice(pendingBooking.finalPrice) : "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-[#D82D8B] animate-ping" />
            <span>Vui lòng không đóng trình duyệt hoặc tải lại trang</span>
          </div>
          <p className="text-xs text-indigo-400 mt-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
            💡 Sau khi thanh toán, bạn có thể bổ sung thông tin hành khách trong trang <strong>Chi tiết đặt tour</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <Header></Header>

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
                    { id: "VNPAY", label: "VNPay", logo: "/assets/vnpay-logo.png" },
                    { id: "CREDITCARD", label: "Thẻ Tín Dụng", logo: "/assets/master-card.png" },
                    { id: "MOMO", label: "Momo", logo: "/assets/momo-logo.png" },
                  ] as { id: PaymentMethod; label: string; logo: string }[]).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-4 border-2 rounded-xl transition-all text-center flex flex-col items-center justify-center min-h-[110px] ${paymentMethod === m.id
                        ? "border-[#0EA5E9] bg-blue-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="w-12 h-8 flex items-center justify-center mb-2 overflow-hidden rounded-md bg-white p-0.5 border border-slate-100 shadow-sm shrink-0">
                        <img src={m.logo} alt={m.label} className="max-w-full max-h-full object-contain" />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>



              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#00D084] hover:bg-[#00B86F] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl active:scale-[0.99] transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Xác Nhận Đặt Tour — ${formatPrice(finalPrice)}`
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

              {/* Khối Chọn Khuyến Mãi ở Sidebar */}
              <div className="border-t border-gray-100 pt-4 pb-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-indigo-600 fill-indigo-50" />
                  Khuyến mãi & Ưu đãi
                </h4>

                {/* Input nhập mã tay */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá..."
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value);
                        setPromoError(null);
                      }}
                      className="flex-grow px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromoCode(promoCodeInput)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[10px] text-rose-500 font-bold">{promoError}</p>
                  )}
                </div>

                {/* Nút mở Modal xem voucher */}
                <button
                  type="button"
                  onClick={() => {
                    setTempSelectedDiscount(selectedDiscount);
                    setIsVoucherModalOpen(true);
                  }}
                  className="w-full mt-3.5 flex items-center justify-between p-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 shrink-0 fill-indigo-100" />
                    <div>
                      <span className="text-xs font-black block">Chọn Voucher của bạn</span>
                      {availableDiscounts.length > 0 ? (
                        <span className="text-[9px] text-indigo-500 font-bold">
                          Có {availableDiscounts.length} ưu đãi khả dụng
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-bold">
                          Chưa có mã giảm giá được chọn
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90 shrink-0 text-indigo-400" />
                </button>

                {/* Hiển thị coupon đang chọn */}
                {selectedDiscount && (
                  <div className="mt-3 flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Mã đã áp dụng</span>
                        <strong className="text-xs font-black text-slate-800 tracking-wider font-mono">{selectedDiscount.code}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDiscount(null);
                        setTempSelectedDiscount(null);
                      }}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-rose-600 uppercase tracking-wider transition-colors px-2 py-1 hover:bg-rose-50 rounded-lg"
                    >
                      Hủy bỏ
                    </button>
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
                {selectedDiscount && (
                  <div className="flex justify-between text-rose-600 font-semibold bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                      Giảm giá ({selectedDiscount.code})
                    </span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Tổng cộng</span>
                  <span className="font-black text-[#00D084] text-2xl">{formatPrice(finalPrice)}</span>
                </div>
              </div>

              <div className="mt-5 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                <p className="text-xs text-green-700">🔒 Thanh toán an toàn 100%</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Voucher Modal ── */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          `}</style>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-[zoomIn_0.2s_ease-out]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                <h3 className="text-lg font-black text-slate-900">Chọn Voucher & Ưu Đãi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content (Body) */}
            <div className="p-6 overflow-y-auto space-y-5 flex-grow">
              {/* Ô nhập mã giảm giá trong Modal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Bạn có mã giảm giá khác?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã ưu đãi của bạn..."
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value);
                      setPromoError(null);
                    }}
                    className="flex-grow px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromoCode(promoCodeInput)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all shrink-0"
                  >
                    Áp dụng
                  </button>
                </div>
                {promoError && (
                  <p className="text-[10px] text-rose-500 font-bold">{promoError}</p>
                )}
              </div>

              {/* Danh sách voucher */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Mã giảm giá khả dụng</p>
                {loadingDiscounts ? (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400 font-bold">Đang tải ưu đãi...</span>
                  </div>
                ) : availableDiscounts.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-3xl block mb-2">🎟️</span>
                    <span className="text-xs text-slate-400 font-bold">Không tìm thấy mã giảm giá nào khả dụng cho chuyến đi này</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {availableDiscounts.map((d) => {
                      const isSelected = tempSelectedDiscount?.id === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setTempSelectedDiscount(isSelected ? null : d)}
                          className={`relative p-4 rounded-2.5xl border-2 transition-all text-left flex items-start gap-3.5 group cursor-pointer w-full ${isSelected
                            ? "border-indigo-600 bg-indigo-50/40 shadow-lg shadow-indigo-50"
                            : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50/30"
                            }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                            }`}>
                            {d.discountType === "PERCENT" ? <Percent className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                          </div>

                          <div className="flex-grow space-y-1 pr-3">
                            <div className="flex items-center justify-between flex-wrap gap-1.5">
                              <span className="text-xs font-black tracking-wider uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-mono border border-slate-150">
                                {d.code}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${d.status === "VOUCHER" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                                }`}>
                                {d.status === "VOUCHER" ? "Voucher" : "Public"}
                              </span>
                            </div>

                            <strong className="text-xs font-black text-slate-800 block pt-0.5 leading-none">
                              {d.discountType === "PERCENT" ? "Giảm " + d.discountAmount + "%" : "Giảm " + formatPrice(d.discountAmount)}
                            </strong>

                            <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                              {d.description || "Ưu đãi đặc biệt cho tour."}
                            </p>

                            {d.endDate && (
                              <span className="text-[9px] text-slate-400 font-extrabold block pt-1">
                                Hạn dùng: {new Date(d.endDate).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>

                          {isSelected && (
                            <div className="absolute top-4 right-4 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow shadow-indigo-150 shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 bg-white hover:bg-slate-50 active:scale-98 text-slate-600 font-black rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDiscount(tempSelectedDiscount);
                  setIsVoucherModalOpen(false);
                }}
                className="flex-1 py-3 bg-[#00D084] hover:bg-[#00B86F] active:scale-98 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-100 font-extrabold"
              >
                Xác nhận áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
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
