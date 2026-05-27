"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getBookingByIdAPI, cancelBookingAPI, getBookingPaymentUrlAPI,
  updateBookingPassengersAPI, getMyBookingsAPI,
} from "@/lib/api/bookings";
import { getTourByIdAPI } from "@/lib/api/tours";
import { getStoredUser } from "@/lib/auth";
import { getReviewByBookingAPI, createReviewAPI } from "@/lib/api/reviews";
import { useBookingTimer } from "@/hooks/useBookingTimer";
import {
  ArrowLeft, Users, Clock, AlertCircle, MapPin, Star,
  User, ShieldCheck, Mail, Phone, CheckCircle2, XCircle,
  X, ChevronDown, Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface PassengerFormItem {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  identityNumber: string;
  phoneNumber: string;        // SĐT riêng của hành khách
  passengerType: string;
  isRepresentative: boolean;
  specialNote: string;
  /** frontend-only: whether this passenger has been saved successfully */
  _saved: boolean;
}

// ─────────────────────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; type: ToastType; message: string }

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error:   <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    info:    <Info className="w-4 h-4 text-sky-500 shrink-0" />,
  };
  const borders: Record<ToastType, string> = {
    success: "border-l-4 border-l-emerald-400",
    error:   "border-l-4 border-l-rose-400",
    info:    "border-l-4 border-l-sky-400",
  };
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 340 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-100 shadow-2xl shadow-slate-300/40 bg-white text-sm font-semibold text-slate-800 pointer-events-auto ${borders[t.type]}`}
          style={{ animation: "slideInRight 0.25s ease" }}
        >
          {icons[t.type]}
          <span className="flex-grow leading-snug text-xs">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="text-slate-300 hover:text-slate-600 transition-colors ml-1 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);
  const show = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Date.now() + (counterRef.current++);
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, show, dismiss };
}

// ─────────────────────────────────────────────────────────────
// Collapse Component
// ─────────────────────────────────────────────────────────────
function CollapsePanel({
  idx,
  passenger,
  isOpen,
  onToggle,
  onSave,
  onChange,
  onFillSelf,
  canEdit,
  representative,
}: {
  idx: number;
  passenger: PassengerFormItem;
  isOpen: boolean;
  onToggle: () => void;
  onSave: (idx: number) => void;
  onChange: (idx: number, field: string, value: string) => void;
  onFillSelf: (idx: number) => void;
  canEdit: boolean;
  representative: { fullName?: string; email?: string; phone?: string } | null;
}) {
  const [saving, setSaving] = useState(false);

  const typeLabel: Record<string, string> = {
    ADULT: "Người lớn", CHILD: "Trẻ em", INFANT: "Em bé",
  };

  const isComplete = !!(passenger.fullName.trim() && passenger.identityNumber.trim());

  const handleSave = async () => {
    if (!passenger.fullName.trim()) return;
    setSaving(true);
    try {
      await onSave(idx);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOpen
          ? "border-indigo-200 shadow-md shadow-indigo-50"
          : passenger._saved
          ? "border-emerald-100 bg-emerald-50/30"
          : "border-slate-100 bg-white hover:border-slate-200"
      }`}
    >
      {/* Header — clickable */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
          isOpen ? "bg-indigo-50/60" : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Number badge */}
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
              passenger._saved
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {passenger._saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              idx + 1
            )}
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <span className="font-extrabold text-slate-800 text-sm">
              {passenger.fullName || `Hành khách ${idx + 1}`}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {typeLabel[passenger.passengerType] || passenger.passengerType}
              </span>
              {passenger.isRepresentative && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                  Đại diện
                </span>
              )}
              {/* Status tag */}
              {passenger._saved ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Đã hoàn tất
                </span>
              ) : (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 flex items-center gap-0.5">
                  <AlertCircle className="w-2.5 h-2.5" /> Cần cập nhật
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Body — animated collapse */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? 600 : 0, overflow: "hidden" }}
      >
        <div className="px-5 pb-5 pt-1 border-t border-slate-100/80 bg-white">
          {/* "Tôi là người đi" — only for representative (idx 0) */}
          {idx === 0 && representative && canEdit && (
            <button
              type="button"
              onClick={() => onFillSelf(idx)}
              className="mb-4 mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold text-xs hover:bg-indigo-50 hover:border-indigo-300 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              ✨ Tôi là người đi — tự động điền thông tin của tôi
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {/* Họ tên */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                placeholder="Nhập đầy đủ họ và tên"
                value={passenger.fullName}
                onChange={(e) => onChange(idx, "fullName", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm font-semibold outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Ngày sinh
              </label>
              <input
                type="date"
                disabled={!canEdit}
                value={passenger.dob || ""}
                onChange={(e) => onChange(idx, "dob", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm font-semibold outline-none transition-all disabled:bg-slate-50"
              />
            </div>

            {/* CCCD */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Số CMND / CCCD / Hộ chiếu
              </label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="Nhập số giấy tờ tùy thân"
                value={passenger.identityNumber}
                onChange={(e) => onChange(idx, "identityNumber", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm font-semibold outline-none transition-all disabled:bg-slate-50"
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Số điện thoại
              </label>
              <input
                type="tel"
                disabled={!canEdit}
                placeholder="Nhập số điện thoại"
                value={passenger.phoneNumber || ""}
                onChange={(e) => onChange(idx, "phoneNumber", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm font-semibold outline-none transition-all disabled:bg-slate-50"
              />
            </div>


            {/* Giới tính */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Giới tính
              </label>
              <div className="flex gap-4 mt-1">
                {[
                  { val: "MALE", label: "Nam" },
                  { val: "FEMALE", label: "Nữ" },
                ].map(({ val, label }) => (
                  <label key={val} className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name={`gender-${idx}`}
                      value={val}
                      disabled={!canEdit}
                      checked={passenger.gender === val}
                      onChange={() => onChange(idx, "gender", val)}
                      className="accent-indigo-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Loại hành khách */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Loại hành khách
              </label>
              <select
                disabled={!canEdit}
                value={passenger.passengerType}
                onChange={(e) => onChange(idx, "passengerType", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm font-semibold outline-none transition-all disabled:bg-slate-50"
              >
                <option value="ADULT">Người lớn</option>
                <option value="CHILD">Trẻ em</option>
                <option value="INFANT">Em bé</option>
              </select>
            </div>

            {/* Ghi chú */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Ghi chú đặc biệt <span className="text-slate-300 font-normal normal-case">(tùy chọn)</span>
              </label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="Ăn chay, không ăn hải sản, dị ứng thuốc..."
                value={passenger.specialNote}
                onChange={(e) => onChange(idx, "specialNote", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm font-semibold outline-none transition-all disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Save button for this passenger */}
          {canEdit && (
            <div className="flex justify-end mt-5 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !passenger.fullName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-indigo-100 active:scale-95"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Lưu hành khách {idx + 1}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  VNPAY: "VNPay",
  CREDITCARD: "Thẻ tín dụng",
  MOMO: "Ví MoMo",
};

const STATUS_CONFIG: Record<string, { text: string; bg: string; textClass: string; border: string }> = {
  PENDING:   { text: "Đang chờ thanh toán", bg: "bg-amber-50",  textClass: "text-amber-700",  border: "border-amber-100" },
  CONFIRMED: { text: "Đã xác nhận",         bg: "bg-emerald-50",textClass: "text-emerald-700",border: "border-emerald-100" },
  COMPLETED: { text: "Hoàn tất chuyến đi",  bg: "bg-sky-50",   textClass: "text-sky-700",    border: "border-sky-100" },
  CANCELLED: { text: "Đã hủy đơn",          bg: "bg-rose-50",  textClass: "text-rose-700",   border: "border-rose-100" },
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function BookingDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();

  const [booking, setBooking] = useState<any | null>(null);
  const [bookingDto, setBookingDto] = useState<any | null>(null);
  const [tour, setTour] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Review states
  const [review, setReview] = useState<any | null>(null);
  const [tourRating, setTourRating] = useState<number>(5);
  const [tourComment, setTourComment] = useState("");
  const [guideRating, setGuideRating] = useState<number>(5);
  const [guideComment, setGuideComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);

  // Collapse state
  const [passengerForm, setPassengerForm] = useState<PassengerFormItem[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const isPending = booking?.status === "PENDING";
  const { formattedTime, isExpired, progressPercent } = useBookingTimer(
    isPending ? bookingDto?.expireAt : null
  );

  // ── helpers ──
  const isPassengerComplete = (p: any) =>
    !!(p.fullName?.trim() && p.identityNumber?.trim());

  const buildForm = (bookingData: any): PassengerFormItem[] => {
    const existing = bookingData.passengers || [];
    const qty = bookingData.quantity || 1;
    return Array.from({ length: qty }, (_, i) => {
      const src = existing[i];
      return {
        id: src?.id || "",
        fullName: src?.fullName || "",
        dob: src?.dob || "",
        gender: src?.gender || "MALE",
        identityNumber: src?.identityNumber || "",
        phoneNumber: src?.phoneNumber || "",
        passengerType: src?.passengerType || (i < (bookingData.adults || 1) ? "ADULT" : "CHILD"),
        isRepresentative: src?.isRepresentative ?? (i === 0),
        specialNote: src?.specialNote || "",
        _saved: isPassengerComplete(src || {}),
      };
    });
  };

  // ── data loading ──
  const loadDetails = useCallback(async (bookingId: string, customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const rawBooking = await getBookingByIdAPI(bookingId);
      setBooking(rawBooking);
      setPaymentUrl(rawBooking.paymentUrl || null);
      setPassengerForm(buildForm(rawBooking));

      const myBookings = await getMyBookingsAPI(customerId);
      const dto = myBookings.find((b: any) => b.bookingId === bookingId);
      if (dto) {
        setBookingDto(dto);
        const tourData = await getTourByIdAPI(dto.tourId);
        setTour(tourData);
        if (dto.reviewed) {
          try {
            const reviewData = await getReviewByBookingAPI(bookingId);
            setReview(reviewData);
          } catch (err) {
            console.error("Lỗi khi tải review:", err);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.push("/login"); return; }
    if (id) loadDetails(id, user.id);
  }, [id, loadDetails]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("openReview") === "true") {
      const timer = setTimeout(() => {
        reviewRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [bookingDto]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setSubmittingReview(true);
    try {
      const payload = {
        customerId: booking.customer.id,
        bookingId: booking.id,
        tourRating,
        tourComment: tourComment.trim(),
        guideRating: bookingDto?.tourGuideId ? guideRating : undefined,
        guideComment: bookingDto?.tourGuideId ? guideComment.trim() : undefined,
      };
      const createdReview = await createReviewAPI(payload);
      showToast("Đánh giá của bạn đã được gửi thành công!", "success");
      setReview(createdReview);
      
      // Update bookingDto reviewed status locally to prevent form showing
      setBookingDto((prev: any) => prev ? { ...prev, reviewed: true } : null);
    } catch (err: any) {
      showToast(err.message || "Không thể gửi đánh giá. Vui lòng thử lại sau.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── passenger actions ──
  const handleChange = (idx: number, field: string, value: string) => {
    setPassengerForm((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value, _saved: false };
      return next;
    });
  };

  const handleFillSelf = (idx: number) => {
    if (!booking?.customer) return;
    const c = booking.customer;

    // Format dateOfBirth → "YYYY-MM-DD"
    let dobStr = "";
    if (c.dateOfBirth) {
      if (Array.isArray(c.dateOfBirth)) {
        const [y, m, d] = c.dateOfBirth;
        dobStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      } else if (typeof c.dateOfBirth === "string") {
        dobStr = c.dateOfBirth.slice(0, 10);
      }
    }

    setPassengerForm((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        fullName:       c.fullName        || next[idx].fullName,
        dob:            dobStr            || next[idx].dob,
        phoneNumber:    c.phone           || next[idx].phoneNumber,
        identityNumber: c.identityNumber  || next[idx].identityNumber,
        _saved: false,
      };
      return next;
    });

    const filled = [
      "họ tên",
      dobStr            && "ngày sinh",
      c.phone           && "SĐT",
      c.identityNumber  && "CCCD",
    ].filter(Boolean).join(", ");
    showToast(`Đã tự động điền: ${filled}.`, "info");
  };


  const handleSavePassenger = async (idx: number) => {
    if (!booking) return;
    const p = passengerForm[idx];
    if (!p.fullName.trim()) {
      showToast("Vui lòng nhập họ tên trước khi lưu.", "error");
      return;
    }
    // Send full list with latest state
    const payload = passengerForm.map((item) => ({ ...item }));
    try {
      await updateBookingPassengersAPI(booking.id, payload);
      // Mark this passenger as saved
      setPassengerForm((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], _saved: true };
        return next;
      });
      setOpenIdx(null); // auto-close after save
      showToast(`Đã lưu thông tin hành khách ${idx + 1} ✓`, "success");
      // Refresh booking data silently
      const fresh = await getBookingByIdAPI(booking.id);
      setBooking(fresh);
    } catch (err: any) {
      showToast(err.message || "Lỗi khi lưu thông tin hành khách.", "error");
    }
  };

  // ── cancel ──
  const confirmCancel = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      await cancelBookingAPI(booking.id);
      const user = getStoredUser();
      if (user) await loadDetails(booking.id, user.id);
      showToast("Hủy đặt tour thành công.", "success");
    } catch (err: any) {
      showToast(err.message || "Không thể hủy đơn hàng.", "error");
    } finally {
      setIsCancelling(false);
      setCancelModalOpen(false);
    }
  };

  const formatPrice = (price?: number) =>
    price == null ? "—" : price.toLocaleString("vi-VN") + " đ";

  // ── derived ──
  const canEditPassengers =
    booking?.status !== "CANCELLED" && booking?.status !== "COMPLETED";
  const savedCount = passengerForm.filter((p) => p._saved).length;
  const totalCount = passengerForm.length;
  const allSaved = savedCount === totalCount && totalCount > 0;

  // ── loading / error states ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F5F8F8]">
        <Header />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600" />
            <p className="text-sm text-slate-400 font-medium">Đang tải chi tiết đơn hàng...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F5F8F8]">
        <Header />
        <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-slate-500 mb-6 text-sm">{error || "Đơn hàng không tồn tại."}</p>
          <Link href="/profile" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow hover:bg-sky-600 transition-all">
            Quay lại tài khoản
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const status = isExpired && isPending ? "CANCELLED" : booking.status;
  const cfg = STATUS_CONFIG[status] || { text: status, bg: "bg-slate-50", textClass: "text-slate-700", border: "border-slate-100" };

  return (
    <div className="min-h-screen bg-[#F5F8F8] flex flex-col justify-between">
      <Header />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* CSS animation keyframe */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Back */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại lịch sử đặt tour
        </Link>

        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-md uppercase tracking-wider">
                #{booking.id}
              </span>
              <span className={`text-xs font-black px-3 py-1 rounded-full border ${cfg.bg} ${cfg.textClass} ${cfg.border}`}>
                {cfg.text}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2">Chi Tiết Đơn Hàng</h1>
          </div>
          <p className="text-xs text-slate-400 font-semibold">
            Đặt ngày: {booking.bookingDate ? new Date(booking.bookingDate).toLocaleString("vi-VN") : "—"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT 2 cols ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tour card */}
            {tour && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex gap-4">
                  {tour.tourImages?.[0]?.imageUrl && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                      <img src={tour.tourImages[0].imageUrl} alt={tour.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <h2 className="text-base font-black text-slate-900 leading-snug mb-2">{tour.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      {tour.startDestination && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-400 fill-sky-400" /> Khởi hành: {tour.startDestination.name}
                        </span>
                      )}
                      {tour.endDestination && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400 fill-rose-400" /> Điểm đến: {tour.endDestination.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                      <span className="text-xs font-bold text-slate-400">
                        ⏱️ {tour.durationDays} ngày {tour.durationNights} đêm
                      </span>
                      {tour.rating && (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {tour.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════
                PASSENGER SECTION — COLLAPSE UX
            ══════════════════════════════════════════════ */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              {/* Section header */}
              <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 fill-purple-400 text-purple-400" />
                    Thông tin hành khách đi tour
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 ml-7 font-medium">
                    {totalCount} người · {savedCount}/{totalCount} đã hoàn tất
                  </p>
                </div>
                {/* Progress pills */}
                <div className="flex gap-1">
                  {passengerForm.map((p, i) => (
                    <div
                      key={i}
                      className={`w-2 h-6 rounded-full transition-colors ${p._saved ? "bg-emerald-400" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Reminder banner */}
              {canEditPassengers && !allSaved && (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 mt-3">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                    Vui lòng cập nhật đầy đủ thông tin hành khách{" "}
                    <strong>trước ngày khởi hành 3 ngày</strong> để xuất bảo hiểm du lịch.
                  </p>
                </div>
              )}

              {allSaved && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5 mt-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 font-bold">
                    Tuyệt vời! Đã cập nhật đầy đủ thông tin tất cả hành khách.
                  </p>
                </div>
              )}

              {/* Collapse panels */}
              <div className="space-y-3">
                {passengerForm.map((passenger, idx) => (
                  <CollapsePanel
                    key={idx}
                    idx={idx}
                    passenger={passenger}
                    isOpen={openIdx === idx}
                    onToggle={() => setOpenIdx((prev) => (prev === idx ? null : idx))}
                    onSave={handleSavePassenger}
                    onChange={handleChange}
                    onFillSelf={handleFillSelf}
                    canEdit={canEditPassengers}
                    representative={booking?.customer ?? null}
                  />
                ))}
              </div>

              {!canEditPassengers && (
                <p className="text-xs text-slate-400 text-center mt-4 font-medium">
                  Đơn hàng này không còn cho phép chỉnh sửa thông tin hành khách.
                </p>
              )}
            </div>

            {/* Contact info */}
            {booking.customer && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 fill-sky-400 text-sky-400" />
                  Người đặt hàng (Liên hệ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  {[
                    { icon: <User className="w-4 h-4 text-slate-400" />, label: "Họ và tên", value: booking.customer.fullName },
                    { icon: <Mail className="w-4 h-4 text-slate-400" />, label: "Email",     value: booking.customer.email },
                    { icon: <Phone className="w-4 h-4 text-slate-400" />, label: "SĐT",      value: booking.customer.phone },
                  ].filter(r => r.value).map((row) => (
                    <div key={row.label} className="bg-slate-50/50 p-4 rounded-xl border border-slate-50 flex items-center gap-3">
                      {row.icon}
                      <div>
                        <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">{row.label}</div>
                        <div className="text-slate-800 text-sm font-bold">{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Section */}
            {bookingDto?.status === "COMPLETED" && (
              <div ref={reviewRef} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-6">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>★</span> Đánh giá chuyến đi của bạn
                </h3>
                
                {bookingDto.reviewed && review ? (
                  // Review was submitted, show it in readonly view
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-4 py-3">
                      ✓ Bạn đã gửi đánh giá cho chuyến đi này. Cảm ơn phản hồi của bạn!
                    </p>
                    
                    {/* Tour Rating Display */}
                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      <h4 className="text-sm font-bold text-slate-800 mb-2">Đánh giá của bạn về Tour</h4>
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, star) => (
                          <span
                            key={star}
                            className={`text-xl ${star < (review.tourRating || review.rating || 0) ? "text-yellow-400" : "text-gray-200"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      {review.tourComment || review.comment ? (
                        <p className="text-sm text-slate-600 font-medium italic">"{review.tourComment || review.comment}"</p>
                      ) : (
                        <p className="text-xs text-slate-400">Không có bình luận cho Tour</p>
                      )}
                    </div>

                    {/* Guide Rating Display */}
                    {bookingDto.tourGuideName && (review.guideRating != null) && (
                      <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                        <h4 className="text-sm font-bold text-slate-800 mb-2">Đánh giá Hướng dẫn viên: <span className="text-sky-600 font-extrabold">{bookingDto.tourGuideName}</span></h4>
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, star) => (
                            <span
                              key={star}
                              className={`text-xl ${star < (review.guideRating || 0) ? "text-yellow-400" : "text-gray-200"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {review.guideComment ? (
                          <p className="text-sm text-slate-600 font-medium italic">"{review.guideComment}"</p>
                        ) : (
                          <p className="text-xs text-slate-400">Không có bình luận cho Hướng dẫn viên</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Review form to submit
                  <form onSubmit={handleReviewSubmit} className="space-y-6">
                    {/* Tour Rating Stars & Comment */}
                    <div className="space-y-3">
                      <label className="block text-sm font-black text-slate-700">
                        1. Bạn đánh giá chất lượng Tour này thế nào?
                      </label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setTourRating(star)}
                            className={`text-3xl transition-all hover:scale-110 ${star <= tourRating ? "text-yellow-400" : "text-slate-200"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={tourComment}
                        onChange={(e) => setTourComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn về tour diễn ra như thế nào..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm font-semibold outline-none transition-all resize-none"
                        rows={3}
                        maxLength={500}
                      />
                    </div>

                    {/* Guide Rating Stars & Comment */}
                    {bookingDto?.tourGuideName && (
                      <div className="space-y-3 border-t border-slate-50 pt-4">
                        <label className="block text-sm font-black text-slate-700">
                          2. Đánh giá Hướng dẫn viên: <span className="text-sky-600">{bookingDto.tourGuideName}</span>
                        </label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setGuideRating(star)}
                              className={`text-3xl transition-all hover:scale-110 ${star <= guideRating ? "text-yellow-400" : "text-slate-200"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={guideComment}
                          onChange={(e) => setGuideComment(e.target.value)}
                          placeholder="Nhận xét về thái độ, nghiệp vụ của hướng dẫn viên..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm font-semibold outline-none transition-all resize-none"
                          rows={3}
                          maxLength={500}
                        />
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-100 flex items-center gap-1.5"
                      >
                        {submittingReview ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          "Gửi đánh giá"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT 1 col ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6">
              <h3 className="text-base font-black text-slate-900 mb-5 pb-3 border-b border-slate-50 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                Chi tiết thanh toán
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-500">
                {[
                  { label: "Giá gốc / khách",   value: formatPrice(booking.unitPrice) },
                  { label: "Số lượng",           value: `${booking.quantity} người (${booking.adults} NL, ${booking.children} TE)` },
                  { label: "Tạm tính",           value: formatPrice(booking.totalPrice) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span>{label}</span>
                    <span className="text-slate-950 font-bold">{value}</span>
                  </div>
                ))}

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Khuyến mãi</span>
                    <span>-{formatPrice(booking.discountAmount)}</span>
                  </div>
                )}

                <div className="h-px bg-slate-50 my-1" />

                <div className="flex justify-between items-end">
                  <span className="text-slate-900 font-bold text-sm">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-slate-950">{formatPrice(booking.finalPrice)}</span>
                </div>

                <div className="h-px bg-slate-50 my-1" />

                <div className="flex justify-between">
                  <span>Phương thức</span>
                  <span className="text-slate-950 font-bold">{PAYMENT_METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trạng thái TT</span>
                  <span className={`font-bold ${booking.paymentStatus === "PAID" ? "text-emerald-600" : "text-slate-500"}`}>
                    {booking.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </div>
                {booking.paymentDate && (
                  <div className="flex justify-between">
                    <span>Thời gian TT</span>
                    <span className="text-slate-950 font-bold">{new Date(booking.paymentDate).toLocaleString("vi-VN")}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {isPending && !isExpired && (
                  <>
                    <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl">
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold mb-2">
                        <Clock className="w-4 h-4 fill-amber-500 text-amber-500" />
                        Giữ chỗ còn: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{formattedTime}</span>
                      </div>
                      <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500 transition-all duration-1000" style={{ width: `${100 - progressPercent}%` }} />
                      </div>
                    </div>

                    {paymentUrl ? (
                      <a href={paymentUrl} className="block w-full text-center py-3.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-100 active:scale-[0.98] transition-all">
                        Thanh toán ngay
                      </a>
                    ) : (
                      <button disabled className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-400 font-bold rounded-2xl text-xs cursor-not-allowed">
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Đang chuẩn bị link thanh toán...
                      </button>
                    )}

                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-black rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all"
                    >
                      ✕ Hủy đơn đặt tour
                    </button>
                  </>
                )}

                {isPending && isExpired && (
                  <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-100 flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-rose-700 mb-0.5">Giữ chỗ hết hạn</h4>
                      <p className="text-xs text-rose-600 leading-relaxed font-semibold">
                        Đơn đã tự động hủy sau 15 phút chưa thanh toán.
                      </p>
                    </div>
                  </div>
                )}

                <Link href="/tours" className="block w-full text-center py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all">
                  Khám phá thêm tour khác
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100/80 text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <span className="text-xl">⚠️</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Xác nhận hủy đặt tour</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc muốn hủy đơn này không? Slot giữ chỗ sẽ được hoàn trả và không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Không, giữ lại
              </button>
              <button
                onClick={confirmCancel}
                disabled={isCancelling}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-1.5"
              >
                {isCancelling ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Hủy đặt tour"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
