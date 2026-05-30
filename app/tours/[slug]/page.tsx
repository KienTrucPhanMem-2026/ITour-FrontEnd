"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getTourByIdAPI, getTourItinerariesAPI } from "@/lib/api/tours";
import { getStoredUser } from "@/lib/auth";
import { getMyBookingsAPI, createBookingAPI } from "@/lib/api/bookings";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import type { TourDTO, UserProfile } from "@/types/api";
import Header from "@/components/Header";

interface Venue {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  price?: number;
}

interface ItineraryDetail {
  id: string;
  timeFrame: string;
  activityType: "TRANSPORT" | "DINING" | "VISIT" | "CHECKIN" | string;
  title: string;
  note?: string;
  location?: { id: string; name: string };
  hotel?: Venue;
  restaurant?: Venue;
  service?: Venue;
}

interface TourItinerary {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  itineraryDetails: ItineraryDetail[];
}

type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; type: ToastType; message: string }

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
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
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ─────────────────────────
function formatPrice(price?: number): string {
  if (!price) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(price)
    .replace("₫", "đ");
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TourDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourId = searchParams.get("id") || "";

  const [tour, setTour] = useState<TourDTO | null>(null);
  const [loadingTour, setLoadingTour] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [specialNote, setSpecialNote] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showGuestPopover, setShowGuestPopover] = useState(false);
  const guestPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (guestPopoverRef.current && !guestPopoverRef.current.contains(event.target as Node)) {
        setShowGuestPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [selectedImage, setSelectedImage] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [itineraries, setItineraries] = useState<TourItinerary[]>([]);
  const [loadingItineraries, setLoadingItineraries] = useState(true);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  const showToast = (message: string, type: ToastType = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  };
  const dismissToast = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));

  const getMinDepartureDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    return minDate.toISOString().split("T")[0];
  };

  const schedules = tour?.schedules || [];
  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
  const maxSlots = selectedSchedule ? (selectedSchedule.availableSlot ?? 0) : Infinity;
  const isMaxReached = (adults + children) >= maxSlots;

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    if (tourId) {
      fetchTourData(tourId);
      if (user?.id) fetchUserBookings(user.id);
    }
  }, [tourId]);

  const fetchTourData = async (id: string) => {
    try {
      setLoadingTour(true);
      const tourData = await getTourByIdAPI(id);
      setTour(tourData);
      setSelectedImage(0);

      // Tải thông tin kịch bản lịch trình chi tiết
      try {
        setLoadingItineraries(true);
        const itinData = await getTourItinerariesAPI(id);
        if (itinData) {
          const sorted = [...itinData]
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map(itin => ({
              ...itin,
              itineraryDetails: [...(itin.itineraryDetails ?? [])].sort((a, b) =>
                (a.timeFrame ?? "").localeCompare(b.timeFrame ?? "")
              ),
            }));
          setItineraries(sorted);
          if (sorted.length > 0) {
            setSelectedDayNumber(sorted[0].dayNumber);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch trình tour:", err);
      } finally {
        setLoadingItineraries(false);
      }
    } catch {
      setError("Không thể tải thông tin tour.");
    } finally {
      setLoadingTour(false);
    }
  };

  // Use tour images if available, otherwise use placeholder
  const images = tour?.images && tour.images.length > 0 
    ? tour.images 
    : [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "https://images.unsplash.com/photo-1493558103817-58b2924bce98",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      ];

  const fetchUserBookings = async (customerId: string) => {
    try {
      setLoadingBookings(true);
      const bookings = await getMyBookingsAPI(customerId);
      setUserBookings(bookings);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách booking:", err);
      setUserBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleBooking = () => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    if (!selectedScheduleId) return alert("Vui lòng chọn lịch khởi hành!");

    if (selectedSchedule) {
      const maxSlotsVal = selectedSchedule.availableSlot ?? 0;
      if (adults + children > maxSlotsVal) {
        return alert(`Số lượng khách vượt quá số chỗ còn trống (${maxSlotsVal} chỗ)!`);
      }
    }

    const params = new URLSearchParams({
      tourId,
      scheduleId: selectedScheduleId,
      adults: adults.toString(),
      children: children.toString(),
    });
    router.push(`/payment?${params.toString()}`);
  };

  const isPrivate = tour?.tourType === "PRIVATE";

  const privatePricing = useMemo(() => {
    if (!isPrivate || !tour) return null;
    const totalGuests = adults + children;
    const tiers = tour.pricingTiers || [];
    const matchedTier = tiers.find(
      (tier) => totalGuests >= tier.minPax && totalGuests <= tier.maxPax
    );

    if (!matchedTier) {
      return {
        matched: false,
        pricePerAdult: 0,
        pricePerChild: 0,
        totalPrice: 0,
        message: `Khung giá riêng của tour yêu cầu từ ${
          tiers.length > 0 ? Math.min(...tiers.map(t => t.minPax)) : 1
        } đến ${
          tiers.length > 0 ? Math.max(...tiers.map(t => t.maxPax)) : 50
        } khách. Vui lòng chọn lại số lượng khách.`,
      };
    }

    const pricePerAdult = matchedTier.pricePerAdult;
    const pricePerChild = matchedTier.pricePerChild ?? pricePerAdult * 0.7;
    const total = pricePerAdult * adults + pricePerChild * children;

    return {
      matched: true,
      pricePerAdult,
      pricePerChild,
      totalPrice: total,
      minPax: matchedTier.minPax,
      maxPax: matchedTier.maxPax,
    };
  }, [isPrivate, tour, adults, children]);

  const handlePrivateBooking = async () => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!departureDate) {
      showToast("Vui lòng chọn ngày khởi hành!", "error");
      return;
    }

    if (!privatePricing || !privatePricing.matched) {
      showToast("Số lượng khách không phù hợp với các khung giá tour riêng. Vui lòng thay đổi số lượng khách!", "error");
      return;
    }

    // Lấy template schedule đầu tiên của tour
    const baseScheduleId = tour?.schedules?.[0]?.id;
    if (!baseScheduleId) {
      showToast("Hệ thống chưa thiết lập lịch trình mẫu cho tour này. Vui lòng quay lại sau!", "error");
      return;
    }

    try {
      setSubmittingBooking(true);
      
      const payload = {
        customerId: currentUser.id || "",
        tourId: tour?.id || "",
        tourScheduleId: baseScheduleId,
        adults: adults,
        children: children,
        paymentMethod: "MOMO" as const, // default payment method
        departureDate: departureDate,
        note: specialNote,
      };

      const result = await createBookingAPI(payload);
      
      showToast(result.message || "Yêu cầu của bạn đã được gửi thành công. Chuyên viên của ITour sẽ liên hệ và xác nhận lịch trình trong vòng 24h tới.", "success");
      
      // Chuyển hướng sang trang profile sau 3 giây để người dùng đọc thông báo
      setTimeout(() => {
        router.push("/profile");
      }, 3000);
    } catch (err: any) {
      console.error("Lỗi đặt tour riêng:", err);
      showToast(err.message || "Có lỗi xảy ra khi gửi yêu cầu đặt tour. Vui lòng thử lại!", "error");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const tourBookings = useMemo(() => {
    return userBookings.filter(
      (booking) => booking.tourId === tourId && booking.status?.toUpperCase() !== "CANCELLED"
    );
  }, [userBookings, tourId]);

  const [unreviewedBookings, setUnreviewedBookings] = useState<any[]>([]);

  useEffect(() => {
    setUnreviewedBookings(tourBookings.filter((b) => !b.reviewed));
  }, [tourBookings]);

  const hasBookedThisTour = tourBookings.length > 0;

  if (loadingTour) return <div className="p-20 text-center text-slate-400 animate-pulse font-medium">Đang chuẩn bị hành trình của bạn...</div>;
  if (error || !tour) return <div className="p-20 text-center text-red-500 font-bold">{error || "Tour không tồn tại"}</div>;

  const unitPrice = selectedSchedule?.price ?? tour?.price ?? 0;
  const totalPrice = unitPrice * adults + unitPrice * 0.7 * children;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Header */}
      
      <Header></Header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Gallery Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10">
          <div className="lg:col-span-8 h-[300px] md:h-[500px] rounded-3xl overflow-hidden relative group shadow-sm">
            <img 
              src={images[selectedImage]} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              alt="Tour main"
            />
          </div>
          <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-4">
            {images.map((img, i) => (
              <div 
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`cursor-pointer rounded-2xl overflow-hidden h-[100px] md:h-[155px] border-2 transition-all ${
                  selectedImage === i ? "border-sky-500 scale-[0.98]" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Info & Reviews */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-sky-50 text-sky-600 text-xs font-bold rounded-full uppercase tracking-wider">Trọn gói cao cấp</span>
                <span className="text-slate-400 text-sm font-medium">• ★ 4.8 (120 đánh giá)</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">{tour.name}</h1>
              <p className="text-lg text-slate-600 leading-relaxed font-light">{tour.description}</p>
            </div>

            <hr className="my-10 border-slate-100" />

            {/* Schedules Section */}
            {isPrivate ? (
              <section className="mb-12 p-8 bg-sky-50/40 rounded-3xl border border-sky-100/60 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2.5 text-slate-800">
                  ✨ Lịch trình khởi hành linh hoạt
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Tour này được tổ chức dưới hình thức <strong className="text-sky-600 font-semibold">Tour riêng (Private Tour)</strong>. 
                  Bạn hoàn toàn chủ động chọn ngày đi mong muốn và số lượng khách tham gia. Chúng tôi sẽ điều phối xe riêng và hướng dẫn viên riêng phục vụ hành trình của đoàn.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div className="flex flex-col gap-1 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-lg">🚗</span>
                    <span className="font-bold text-slate-900">Xe đưa đón riêng</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-tight">Xe riêng cao cấp suốt hành trình</span>
                  </div>
                  <div className="flex flex-col gap-1 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-lg">🙋</span>
                    <span className="font-bold text-slate-900">Hướng dẫn viên riêng</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-tight">Chăm sóc chu đáo suốt chuyến đi</span>
                  </div>
                  <div className="flex flex-col gap-1 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-lg">🏨</span>
                    <span className="font-bold text-slate-900">Dịch vụ may đo</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-tight">Tùy chỉnh khách sạn, thực đơn dễ dàng</span>
                  </div>
                </div>
              </section>
            ) : (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  Lịch khởi hành 
                  <span className="text-sm font-normal text-slate-400 font-medium">(Chọn ngày để đặt tour)</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schedules.map((schedule) => {
                    const isSelected = selectedScheduleId === schedule.id;
                    const isFull = (schedule.availableSlot ?? 0) <= 0;
                    return (
                      <button
                        key={schedule.id}
                        onClick={() => {
                          if (!isFull) {
                            setSelectedScheduleId(schedule.id);
                            const maxSlotsVal = schedule.availableSlot ?? 0;
                            if (adults + children > maxSlotsVal) {
                              const newAdults = Math.min(adults, Math.max(1, maxSlotsVal));
                              const newChildren = Math.min(children, Math.max(0, maxSlotsVal - newAdults));
                              setAdults(newAdults);
                              setChildren(newChildren);
                            }
                          }
                        }}
                        disabled={isFull}
                        className={`p-5 rounded-2xl border-2 transition-all text-left relative group ${
                          isFull ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100" :
                          isSelected ? "border-sky-500 bg-sky-50/50 ring-4 ring-sky-50 shadow-sm" : "border-slate-100 hover:border-sky-200"
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Khởi hành</span>
                          <span className="font-bold text-slate-900 text-lg">{formatDate(schedule.startDate)}</span>
                          <span className={`text-xs font-bold ${isFull ? "text-rose-500" : "text-emerald-600"}`}>
                            {isFull ? "● Đã hết chỗ" : `● Còn ${schedule.availableSlot} chỗ trống`}
                          </span>
                          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-end">
                             <span className="text-xs text-slate-400 font-medium font-mono tracking-tighter uppercase">Giá từ</span>
                             <span className="text-xl font-black text-emerald-500">{formatPrice(schedule.price || tour.price)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <hr className="my-10 border-slate-100" />

            {/* Itinerary Section */}
            {itineraries.length > 0 && (
              <>
                <section className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    🗺️ Lịch trình chi tiết
                  </h2>

                  {/* Day selection badges */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-sky-200">
                    {itineraries.map((day) => {
                      const isActive = day.dayNumber === selectedDayNumber;
                      return (
                        <button
                          key={day.id}
                          onClick={() => setSelectedDayNumber(day.dayNumber)}
                          className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                            isActive
                              ? "bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-100"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          Ngày {day.dayNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Day Itinerary Content */}
                  {(() => {
                    const activeDay = itineraries.find((d) => d.dayNumber === selectedDayNumber);
                    if (!activeDay) return null;

                    const ACT_CONFIG: Record<string, { emoji: string; badge: string; dot: string; border: string; label: string }> = {
                      TRANSPORT: { emoji: "🚌", badge: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",    border: "border-blue-200",   label: "Di chuyển" },
                      DINING:    { emoji: "🍽️", badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-500",  border: "border-amber-200", label: "Ăn uống" },
                      VISIT:     { emoji: "🎟️", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200", label: "Tham quan" },
                      CHECKIN:   { emoji: "🏨", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-500", border: "border-purple-200", label: "Nghỉ dưỡng" },
                    };

                    return (
                      <div className="bg-gradient-to-br from-sky-50/30 to-white rounded-3xl p-6 md:p-8 border border-sky-100/70 shadow-sm">
                        <div className="mb-8">
                          <h3 className="text-xl font-extrabold text-slate-900 mb-1">{activeDay.title}</h3>
                          {activeDay.description && (
                            <p className="text-slate-500 font-light leading-relaxed text-sm">{activeDay.description}</p>
                          )}
                        </div>

                        {activeDay.itineraryDetails && activeDay.itineraryDetails.length > 0 ? (
                          <div className="space-y-4">
                            {activeDay.itineraryDetails.map((detail, idx) => {
                              const cfg = ACT_CONFIG[detail.activityType] ?? { emoji: "📌", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400", border: "border-slate-200", label: detail.activityType };
                              const venue = detail.hotel ?? detail.restaurant ?? detail.service ?? null;

                              return (
                                <div key={detail.id} className="flex gap-4">
                                  {/* Left: Time + connector */}
                                  <div className="flex flex-col items-center flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm border-2 ${cfg.border} bg-white`}>
                                      {cfg.emoji}
                                    </div>
                                    {idx < activeDay.itineraryDetails.length - 1 && (
                                      <div className="w-0.5 flex-1 mt-2 mb-0 bg-gradient-to-b from-slate-200 to-transparent min-h-[20px]" />
                                    )}
                                  </div>

                                  {/* Right: Card */}
                                  <div className="flex-1 pb-4">
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                      {/* Card Header */}
                                      <div className="px-4 pt-4 pb-3">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                          <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${cfg.badge}`}>
                                            {cfg.label}
                                          </span>
                                          <span className="text-[11px] text-slate-400 font-semibold font-mono">{detail.timeFrame}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">{detail.title}</h4>
                                        {detail.note && (
                                          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                                            💬 {detail.note}
                                          </p>
                                        )}
                                      </div>

                                      {/* Venue info card (hotel / restaurant / service) */}
                                      {venue && (
                                        <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex items-start gap-3">
                                          <span className="text-base flex-shrink-0 mt-0.5">
                                            {detail.hotel ? "🏨" : detail.restaurant ? "🍜" : "🎫"}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{venue.name}</p>
                                            {venue.address && (
                                              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                                <span>📍</span>
                                                <span className="truncate">{venue.address}</span>
                                              </p>
                                            )}
                                            {venue.phone && (
                                              <p className="text-[10px] text-sky-600 mt-0.5 flex items-center gap-1">
                                                <span>📞</span>
                                                <span>{venue.phone}</span>
                                              </p>
                                            )}
                                            {detail.service?.price && (
                                              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(detail.service.price)}
                                              </p>
                                            )}
                                          </div>
                                          <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                                            {detail.hotel ? "Khách sạn" : detail.restaurant ? "Nhà hàng" : "Dịch vụ"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-10 text-slate-300">
                            <span className="text-4xl block mb-2">📋</span>
                            <p className="text-sm font-medium">Chưa có thông tin chi tiết cho ngày này.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </section>

                <hr className="my-10 border-slate-100" />
              </>
            )}

             {/* REVIEW FORM SECTION */}
            <section className="mb-10">
              {/* <h2 className="text-2xl font-bold mb-6">Chia sẻ đánh giá của bạn</h2> */}
              {!currentUser ? (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <p className="text-blue-900 font-medium">
                    Vui lòng{" "}
                    <Link href="/login" className="underline hover:text-blue-700 font-bold">
                      đăng nhập
                    </Link>{" "}
                    để gửi đánh giá
                  </p>
                </div>
              ) : loadingBookings ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-600">
                  Đang kiểm tra booking...
                </div>
              ) : hasBookedThisTour ? (
                unreviewedBookings.length > 0 ? (
                  <ReviewForm
                    tourId={tour.id}
                    customerId={currentUser.id || ""}
                    unreviewedBookings={unreviewedBookings}
                    onSuccess={(bookingId) => {
                      setUnreviewedBookings((prev) => prev.filter((b) => b.bookingId !== bookingId));
                      setReviewRefresh((prev) => prev + 1);
                    }}
                  />
                ) : (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <p className="text-emerald-900 font-bold mb-1.5">✓ Đã hoàn tất đánh giá</p>
                    <p className="text-emerald-700 text-xs font-medium">Bạn đã hoàn thành đánh giá cho tất cả {tourBookings.length} chuyến đi của tour này. Cảm ơn bạn!</p>
                  </div>
                )
              ) : (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-amber-900 font-medium mb-2">📋 Bạn phải đặt tour này trước khi có thể đánh giá</p>
                  <p className="text-amber-800 text-sm">Hãy hoàn thành đơn đặt tour để chia sẻ trải nghiệm của bạn</p>
                </div>
              )}
            </section>

            {/* REVIEWS SECTION */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-8">Đánh giá từ khách hàng</h2>
              <ReviewList tourId={tour.id} refreshTrigger={reviewRefresh} />
            </section>

            <hr className="my-10 border-slate-100" />
          </div>

          {/* Right Column: Booking Card */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-2xl shadow-slate-200/50">
              
              {isPrivate ? (
                /* ----------------- Private Tour Booking Card ----------------- */
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-0.5">Dịch vụ Tour riêng</span>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Yêu cầu Đặt Tour Riêng</h3>
                  </div>

                  {/* Input 1: Departure Date picker */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày khởi hành *</label>
                    <input
                      type="date"
                      min={getMinDepartureDate()}
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-semibold text-slate-800"
                    />
                    <p className="text-[9px] text-slate-400 font-medium">Chọn ngày khởi hành (tối thiểu sau 3 ngày nữa)</p>
                  </div>

                  {/* Input 2: Guest Selector via Popover */}
                  <div className="space-y-1.5 relative" ref={guestPopoverRef}>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số lượng hành khách *</label>
                    <button
                      type="button"
                      onClick={() => setShowGuestPopover(!showGuestPopover)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-semibold text-slate-800 text-left flex justify-between items-center cursor-pointer"
                    >
                      <span>
                        {adults} Người lớn{children > 0 ? `, ${children} Trẻ em` : ""}{infants > 0 ? `, ${infants} Em bé` : ""}
                      </span>
                      <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showGuestPopover ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showGuestPopover && (
                      <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-2xl shadow-slate-300/80 z-[100] space-y-3">
                        {/* Adults */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-xs">Người lớn</p>
                            <p className="text-[10px] text-slate-400 font-medium">Từ 12 tuổi trở lên</p>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setAdults(Math.max(1, adults - 1)); }}
                              className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold w-4 text-center text-xs">{adults}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setAdults(adults + 1); }}
                              className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-xs">Trẻ em</p>
                            <p className="text-[10px] text-slate-400 font-medium">Từ 2 - 11 tuổi</p>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setChildren(Math.max(0, children - 1)); }}
                              className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold w-4 text-center text-xs">{children}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setChildren(children + 1); }}
                              className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Infants */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-xs">Em bé</p>
                            <p className="text-[10px] text-slate-400 font-medium">Dưới 2 tuổi (Miễn phí)</p>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setInfants(Math.max(0, infants - 1)); }}
                              className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold w-4 text-center text-xs">{infants}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setInfants(infants + 1); }}
                              className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowGuestPopover(false); }}
                            className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
                          >
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Pricing Display */}
                  <div className="pt-1.5">
                    {privatePricing?.matched ? (
                      <div className="space-y-2 p-3 bg-sky-50/40 rounded-xl border border-sky-100/50 text-[10px] text-slate-600">
                        <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                          🏷️ Đơn giá nhóm (Bậc {privatePricing.minPax}-{privatePricing.maxPax} khách)
                        </div>
                        <div className="flex justify-between">
                          <span>Người lớn:</span>
                          <span className="font-semibold text-slate-800">
                            {adults} × {formatPrice(privatePricing.pricePerAdult)}
                          </span>
                        </div>
                        {children > 0 && (
                          <div className="flex justify-between">
                            <span>Trẻ em (2-11t):</span>
                            <span className="font-semibold text-slate-800">
                              {children} × {formatPrice(privatePricing.pricePerChild)}
                            </span>
                          </div>
                        )}
                        {infants > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>Em bé (&lt;2t):</span>
                            <span>{infants} × Miễn phí</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200/60 pt-2 mt-1.5 flex justify-between font-bold text-slate-800 text-xs">
                          <span>Tổng cộng ({adults + children} khách):</span>
                          <span className="text-emerald-500 font-black text-sm">{formatPrice(privatePricing.totalPrice)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 font-medium">
                        ⚠️ {privatePricing?.message || "Không có khung giá phù hợp cho số lượng khách này."}
                      </div>
                    )}
                  </div>

                  {/* Input 3: Special Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ghi chú đặc biệt (Tùy chọn)</label>
                    <textarea
                      placeholder="VD: Gia đình có người già cần xe gầm thấp, đoàn muốn nâng cấp phòng lên khách sạn 4 sao..."
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-[10px] font-medium text-slate-700 leading-relaxed resize-none"
                    />
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={handlePrivateBooking}
                    disabled={submittingBooking || !privatePricing?.matched}
                    className="w-full py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-xl shadow-sky-100/50 text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submittingBooking ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang gửi yêu cầu...
                      </>
                    ) : (
                      "Gửi Yêu Cầu Đặt Tour"
                    )}
                  </button>
                </div>
              ) : (
                /* ----------------- Standard Tour Booking Card ----------------- */
                <>
                  <div className="mb-4">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Giá tạm tính</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{formatPrice(totalPrice)}</span>
                  </div>

                  {selectedSchedule && (
                    <div className="mb-4 p-2.5 bg-sky-50/70 rounded-xl border border-sky-100/50 flex items-center justify-between text-[10px] text-sky-700 font-medium">
                      <span>Số chỗ còn lại:</span>
                      <span className="font-bold text-[10px] bg-white px-2 py-1 rounded-lg border border-sky-100/30 shadow-sm text-sky-800">
                        {selectedSchedule.availableSlot} chỗ
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    {/* Adults Counter */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Người lớn</p>
                        <p className="text-[10px] text-slate-400 font-medium">Trên 12 tuổi</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs">-</button>
                        <span className="font-bold w-4 text-center text-xs">{adults}</span>
                        <button 
                          onClick={() => {
                            if (adults + children < maxSlots) {
                              setAdults(adults + 1);
                            }
                          }} 
                          disabled={isMaxReached}
                          className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children Counter */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Trẻ em</p>
                        <p className="text-[10px] text-slate-400 font-medium">2 - 11 tuổi (-30%)</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs">-</button>
                        <span className="font-bold w-4 text-center text-xs">{children}</span>
                        <button 
                          onClick={() => {
                            if (adults + children < maxSlots) {
                              setChildren(children + 1);
                            }
                          }} 
                          disabled={isMaxReached}
                          className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-sky-600 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-xl shadow-sky-100 mb-3 text-xs tracking-wide"
                    disabled={!selectedScheduleId}
                  >
                    {selectedScheduleId ? "Đặt hành trình ngay" : "Chọn ngày khởi hành"}
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-chat-tour", {
                    detail: {
                      tourId: tour.id,
                      tourName: tour.name,
                      tourPrice: tour.price
                    }
                  }));
                }}
                className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold rounded-xl active:scale-[0.98] transition-all mb-3 text-xs tracking-wide flex items-center justify-center gap-1.5 border border-sky-100 shadow-sm cursor-pointer"
              >
                💬 Nhận tư vấn về tour này
              </button>
              
              <button className="w-full py-2 text-slate-400 font-bold text-[10px] hover:text-rose-500 transition-colors uppercase tracking-widest">
                ♥ Lưu vào mục yêu thích
              </button>

              <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between gap-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base">🛡️</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-center leading-none">Bảo mật thanh toán</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base">↩️</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-center leading-none">Hủy tour linh hoạt</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base">⚡</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-center leading-none">Xác nhận ngay</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-slate-50 border-t border-slate-100 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Du Lịch Việt</p>
          <p className="text-slate-300 text-[11px] font-medium tracking-wide">© 2026 Toàn bộ bản quyền thuộc về hành trình của bạn.</p>
        </div>
      </footer>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}