"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getTourByIdAPI } from "@/lib/api/tours";
import { getStoredUser } from "@/lib/auth";
import type { TourDTO } from "@/types/api";

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

  const images = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1493558103817-58b2924bce98",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  ];

  useEffect(() => {
    if (tourId) fetchTourData(tourId);
  }, [tourId]);

  const fetchTourData = async (id: string) => {
    try {
      setLoadingTour(true);
      const tourData = await getTourByIdAPI(id);
      setTour(tourData);
    } catch {
      setError("Không thể tải thông tin tour.");
    } finally {
      setLoadingTour(false);
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

    const params = new URLSearchParams({
      tourId,
      scheduleId: selectedScheduleId,
      adults: adults.toString(),
      children: children.toString(),
    });
    router.push(`/payment?${params.toString()}`);
  };

  if (loadingTour) return <div className="p-20 text-center text-slate-400 animate-pulse font-medium">Đang chuẩn bị hành trình của bạn...</div>;
  if (error || !tour) return <div className="p-20 text-center text-red-500 font-bold">{error || "Tour không tồn tại"}</div>;

  const schedules = tour?.schedules || [];
  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
  const unitPrice = selectedSchedule?.price ?? tour?.price ?? 0;
  const totalPrice = unitPrice * adults + unitPrice * 0.7 * children;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-200 transition-transform group-hover:scale-105">
              <span className="font-bold text-xs">DL</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Du Lịch Việt</span>
          </Link>
          <Link href="/tours" className="text-sm font-medium text-slate-500 hover:text-sky-600 transition">
            ← Quay lại khám phá
          </Link>
        </div>
      </header>

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
                      onClick={() => !isFull && setSelectedScheduleId(schedule.id)}
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

            {/* REVIEWS SECTION - ĐÃ THÊM LẠI VÀ OPTIMIZE */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Đánh giá từ khách hàng 
                  <span className="text-sky-600 bg-sky-50 px-2 py-1 rounded-lg text-sm ml-2">★ 4.8</span>
                </h2>
                <button className="text-sm font-bold text-sky-600 hover:underline">Xem tất cả</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "Hoàng Nam", rating: 5, comment: "Chuyến du lịch tuyệt vời, hướng dẫn viên rất nhiệt tình và am hiểu kiến thức địa phương!", time: "2 ngày trước", avatar: "N" },
                  { name: "Trần Thu Hà", rating: 5, comment: "Cảnh đẹp tuyệt vời, dịch vụ từ xe đưa đón đến khách sạn đều rất chuyên nghiệp. Rất đáng tiền.", time: "1 tuần trước", avatar: "H" },
                  { name: "Nguyễn Văn B", rating: 4, comment: "Tour tốt, lịch trình hơi dày một chút nhưng bù lại đi được nhiều điểm đẹp. Sẽ quay lại.", time: "2 tuần trước", avatar: "B" },
                  { name: "Minh Anh", rating: 5, comment: "Gia đình mình đã có một kỳ nghỉ rất vui. Cảm ơn đội ngũ tổ chức tour nhiều nhé!", time: "1 tháng trước", avatar: "A" },
                ].map((review, idx) => (
                  <div key={idx} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                          {review.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{review.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{review.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-yellow-400" : "text-slate-200"}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed font-light italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Booking Card */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/50">
              <div className="mb-8">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Giá tạm tính</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{formatPrice(totalPrice)}</span>
              </div>

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
                    <button onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-sm">+</button>
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
                    <button onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-all text-sm">+</button>
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