"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getTourByIdAPI, getTourItinerariesAPI } from "@/lib/api/tours";
import { getStoredUser } from "@/lib/auth";
import { getMyBookingsAPI } from "@/lib/api/bookings";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import type { TourDTO, UserProfile } from "@/types/api";
import Header from "@/components/Header";

interface ItineraryDetail {
  id: string;
  timeFrame: string;
  activityType: "TRANSPORT" | "DINING" | "VISIT" | "CHECKIN" | string;
  title: string;
  note?: string;
}

interface TourItinerary {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  itineraryDetails: ItineraryDetail[];
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [itineraries, setItineraries] = useState<TourItinerary[]>([]);
  const [loadingItineraries, setLoadingItineraries] = useState(true);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

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

  const hasBookedThisTour = userBookings.some(
    (booking) => booking.tourId === tourId && booking.status !== "cancelled"
  );

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
                    return (
                      <div className="bg-gradient-to-br from-sky-50/50 to-slate-50/50 rounded-3xl p-6 md:p-8 border border-sky-100/70 shadow-sm">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {activeDay.title}
                          </h3>
                          {activeDay.description && (
                            <p className="text-slate-600 font-light leading-relaxed text-sm">
                              {activeDay.description}
                            </p>
                          )}
                        </div>

                        {/* Timeline of details */}
                        {activeDay.itineraryDetails && activeDay.itineraryDetails.length > 0 ? (
                          <div className="relative pl-6 border-l-2 border-sky-200 space-y-6 ml-2">
                            {activeDay.itineraryDetails.map((detail) => {
                              // Determine icon and color based on activity type
                              let typeLabel = "Hoạt động";
                              let typeBg = "bg-slate-100 text-slate-600";
                              if (detail.activityType === "TRANSPORT") {
                                typeLabel = "Di chuyển";
                                typeBg = "bg-blue-100 text-blue-600";
                              } else if (detail.activityType === "DINING") {
                                typeLabel = "Ăn uống";
                                typeBg = "bg-amber-100 text-amber-600";
                              } else if (detail.activityType === "VISIT") {
                                typeLabel = "Tham quan";
                                typeBg = "bg-emerald-100 text-emerald-600";
                              } else if (detail.activityType === "CHECKIN") {
                                typeLabel = "Khách sạn";
                                typeBg = "bg-purple-100 text-purple-600";
                              }

                              return (
                                <div key={detail.id} className="relative">
                                  {/* Timeline dot */}
                                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-sky-500 border-2 border-white shadow"></div>

                                  <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-sm transition-all">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${typeBg}`}>
                                        {typeLabel}
                                      </span>
                                      <span className="text-xs text-slate-400 font-semibold">{detail.timeFrame}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-1">{detail.title}</h4>
                                    {detail.note && (
                                      <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2">
                                        💡 {detail.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-sm">Chưa có thông tin kịch bản chi tiết cho ngày này.</div>
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
                <ReviewForm
                  tourId={tour.id}
                  customerId={currentUser.id || ""}
                  onSuccess={() => setReviewRefresh((prev) => prev + 1)}
                />
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
            <div className="sticky top-28 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/50">
              <div className="mb-6">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Giá tạm tính</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{formatPrice(totalPrice)}</span>
              </div>

              {selectedSchedule && (
                <div className="mb-6 p-3.5 bg-sky-50/70 rounded-2xl border border-sky-100/50 flex items-center justify-between text-xs text-sky-700 font-medium">
                  <span>Số chỗ còn lại:</span>
                  <span className="font-bold text-xs bg-white px-2.5 py-1.5 rounded-xl border border-sky-100/30 shadow-sm text-sky-800">
                    {selectedSchedule.availableSlot} chỗ
                  </span>
                </div>
              )}

              <div className="space-y-6 mb-10">
                {/* Adults Counter */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Người lớn</p>
                    <p className="text-[11px] text-slate-400 font-medium">Trên 12 tuổi</p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-sm">-</button>
                    <span className="font-bold w-4 text-center text-sm">{adults}</span>
                    <button 
                      onClick={() => {
                        if (adults + children < maxSlots) {
                          setAdults(adults + 1);
                        }
                      }} 
                      disabled={isMaxReached}
                      className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children Counter */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Trẻ em</p>
                    <p className="text-[11px] text-slate-400 font-medium">2 - 11 tuổi (-30%)</p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-sm">-</button>
                    <span className="font-bold w-4 text-center text-sm">{children}</span>
                    <button 
                      onClick={() => {
                        if (adults + children < maxSlots) {
                          setChildren(children + 1);
                        }
                      }} 
                      disabled={isMaxReached}
                      className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBooking}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-sky-600 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-xl shadow-sky-100 mb-4 text-sm tracking-wide"
                disabled={!selectedScheduleId}
              >
                {selectedScheduleId ? "Đặt hành trình ngay" : "Chọn ngày khởi hành"}
              </button>

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
                className="w-full py-3.5 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold rounded-2xl active:scale-[0.98] transition-all mb-4 text-sm tracking-wide flex items-center justify-center gap-2 border border-sky-100 shadow-sm cursor-pointer"
              >
                💬 Nhận tư vấn về tour này
              </button>
              
              <button className="w-full py-3 text-slate-400 font-bold text-xs hover:text-rose-500 transition-colors uppercase tracking-widest">
                ♥ Lưu vào mục yêu thích
              </button>

              <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">🛡️</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter text-center leading-none">Bảo mật thanh toán</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">↩️</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter text-center leading-none">Hủy tour linh hoạt</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">⚡</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter text-center leading-none">Xác nhận ngay</span>
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
    </div>
  );
}