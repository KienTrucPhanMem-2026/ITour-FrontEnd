"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getTourByIdAPI } from "@/lib/api/tours";
import { getStoredUser } from "@/lib/auth";
import type { TourDTO } from "@/types/api";

// ─── Helper functions ─────────────────────────
function formatPrice(price?: number): string {
  if (!price) return "Liên hệ";
  return `${(price / 1_000_000).toFixed(1)}M₫`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────
export default function TourDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get ID from query parameter
  const tourId = searchParams.get("id") || "";

  // Data state
  const [tour, setTour] = useState<TourDTO | null>(null);
  const [loadingTour, setLoadingTour] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking form state
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    if (tourId) {
      fetchTourData(tourId);
    }
  }, [tourId]);

  const fetchTourData = async (id: string) => {
    try {
      setLoadingTour(true);
      setError(null);
      const tourData = await getTourByIdAPI(id);
      setTour(tourData);
    } catch {
      setError("Không thể tải thông tin tour. Vui lòng thử lại.");
    } finally {
      setLoadingTour(false);
    }
  };

  const handleBooking = () => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      // Build redirect URL properly - go back to current tour page after login
      if (typeof window !== "undefined") {
        const currentUrl = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      } else {
        router.push(`/login?redirect=/tours/tour?id=${tourId}`);
      }
      return;
    }
    if (!selectedScheduleId) {
      alert("Vui lòng chọn lịch khởi hành!");
      return;
    }

    const searchParams = new URLSearchParams({
      tourId: tourId,
      scheduleId: selectedScheduleId,
      adults: adults.toString(),
      children: children.toString(),
    });
    router.push(`/payment?${searchParams.toString()}`);
  };

  // ── Loading ──
  if (loadingTour) {
    return (
      <div className="min-h-screen bg-[#F5F8F8]">
        <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
          <div className="h-64 bg-gray-200 rounded-2xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8F8]">
        <div className="text-center">
          <div className="text-5xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Tour không tìm thấy"}</h1>
          <Link href="/tours" className="text-[#0EA5E9] hover:underline">
            Quay lại danh sách tour
          </Link>
        </div>
      </div>
    );
  }

  // Tổng số người & giá
  const totalPeople = adults + children;
  const schedules = tour?.schedules || [];
  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
  const unitPrice = selectedSchedule?.price ?? tour?.price ?? 0;
  const totalPrice = unitPrice * adults + (unitPrice * 0.7) * children; // trẻ em 70%

  return (
    <div className="min-h-screen bg-[#F5F8F8]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
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
          <Link href="/tours" className="text-sm font-semibold text-[#0EA5E9] hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tour Header */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Tour type badge */}
              {tour.tourType && (
                <span className="inline-block mb-3 px-3 py-1 bg-[#E0F2FE] text-[#0EA5E9] text-xs font-bold rounded-full uppercase tracking-wide">
                  {tour.tourType}
                </span>
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{tour.name}</h1>

              {/* Rating */}
              {tour.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(tour.rating!) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{tour.rating.toFixed(1)}/5</span>
                </div>
              )}

              {tour.description && (
                <p className="text-gray-700 leading-relaxed mb-4">{tour.description}</p>
              )}

              {/* Quick info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {tour.durationDays && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-[#0EA5E9]">🕐</span>
                    <span>{tour.durationDays} ngày{tour.durationNights ? ` / ${tour.durationNights} đêm` : ""}</span>
                  </div>
                )}
                {tour.maximumSlots && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-[#0EA5E9]">👥</span>
                    <span>Tối đa {tour.maximumSlots} người</span>
                  </div>
                )}
                {tour.startDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-[#0EA5E9]">📅</span>
                    <span>Khởi hành: {formatDate(tour.startDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price card */}
            <div className="text-center p-6 bg-gradient-to-br from-[#E0F7F0] to-[#F0FFFE] rounded-xl border border-[#00D084]">
              <div className="text-sm text-gray-600 mb-2">Giá từ</div>
              <div className="text-4xl font-bold text-[#00D084] mb-1">{formatPrice(tour.price)}</div>
              <div className="text-sm text-gray-600">/ người lớn</div>
              {tour.durationDays && (
                <div className="mt-3 text-sm font-semibold text-gray-700">
                  {tour.durationDays} ngày {tour.durationNights ? `${tour.durationNights} đêm` : ""}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Tour Info ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description detail */}
            {tour.description && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Mô Tả Tour</h2>
                <p className="text-gray-700 leading-relaxed">{tour.description}</p>
              </div>
            )}

            {/* Schedules list */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Các Lịch Khởi Hành</h2>

              {schedules && schedules.length > 0 ? (
                <div className="space-y-3">
                  {schedules.map((schedule) => {
                    const isSelected = selectedScheduleId === schedule.id;
                    const isFull = (schedule.availableSlot ?? 0) <= 0;
                    return (
                      <button
                        key={schedule.id}
                        onClick={() => !isFull && setSelectedScheduleId(schedule.id)}
                        disabled={isFull}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isFull
                            ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "border-[#0EA5E9] bg-blue-50"
                            : "border-gray-200 bg-white hover:border-[#0EA5E9]/50 hover:bg-blue-50/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Radio indicator */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? "border-[#0EA5E9]" : "border-gray-300"
                            }`}>
                              {isSelected && <div className="w-3 h-3 rounded-full bg-[#0EA5E9]" />}
                            </div>

                            <div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {formatDate(schedule.startDate)}
                                {schedule.endDate && ` → ${formatDate(schedule.endDate)}`}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {isFull ? (
                                  <span className="text-red-500">Hết chỗ</span>
                                ) : (
                                  <span className="text-green-600">Còn {schedule.availableSlot} chỗ trống</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-[#00D084]">
                              {schedule.price ? formatPrice(schedule.price) : formatPrice(tour?.price)}
                            </div>
                            <div className="text-xs text-gray-400">/ người</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>Hiện chưa có lịch khởi hành cho tour này.</p>
                  <p className="text-sm mt-1">Vui lòng liên hệ để biết thêm thông tin.</p>
                </div>
              )}
            </div>

            {/* Static reviews */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Đánh Giá Khách Hàng</h2>
              <div className="space-y-4">
                {[
                  { name: "Hoàng Nam", rating: 5, comment: "Chuyến du lịch tuyệt vời, hướng dẫn viên rất nhiệt tình!", time: "2 ngày trước" },
                  { name: "Trần Thu Hà", rating: 5, comment: "Cảnh đẹp tuyệt vời, dịch vụ chuyên nghiệp.", time: "1 tuần trước" },
                  { name: "Nguyễn Văn B", rating: 4, comment: "Tour tốt, sẽ quay lại lần sau.", time: "2 tuần trước" },
                ].map((review, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] flex items-center justify-center text-white font-bold text-sm">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                          <p className="text-xs text-gray-400">{review.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Booking Card ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Đặt Tour</h3>

              {/* Selected schedule summary */}
              {selectedSchedule ? (
                <div className="mb-5 p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm">
                  <p className="text-[#0EA5E9] font-semibold mb-1">✓ Đã chọn lịch khởi hành</p>
                  <p className="text-gray-700">
                    {formatDate(selectedSchedule.startDate)}
                    {selectedSchedule.endDate && ` → ${formatDate(selectedSchedule.endDate)}`}
                  </p>
                </div>
              ) : (
                <div className="mb-5 p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-sm text-yellow-700">
                  ⚠️ Vui lòng chọn lịch khởi hành bên trái
                </div>
              )}

              {/* Adults */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Người Lớn
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-lg text-gray-900">{adults}</span>
                  <button
                    onClick={() => setAdults(Math.min(tour.maximumSlots ?? 20, adults + 1))}
                    className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">Giá đầy đủ</p>
              </div>

              {/* Children */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trẻ Em <span className="text-gray-400 font-normal">(dưới 12 tuổi)</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-lg text-gray-900">{children}</span>
                  <button
                    onClick={() => setChildren(children + 1)}
                    className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">Giá 70%</p>
              </div>

              {/* Price summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Người lớn × {adults}</span>
                  <span className="font-semibold">{formatPrice(unitPrice * adults)}</span>
                </div>
                {children > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Trẻ em × {children} (70%)</span>
                    <span className="font-semibold">{formatPrice(unitPrice * 0.7 * children)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Tổng cộng</span>
                  <span className="font-bold text-[#00D084] text-lg">{formatPrice(totalPrice)}</span>
                </div>
                <div className="text-xs text-gray-400 text-center">{totalPeople} người</div>
              </div>

              {/* Booking button */}
              <button
                onClick={handleBooking}
                disabled={!selectedScheduleId || !schedules || schedules.length === 0}
                className="w-full py-3.5 bg-[#00D084] hover:bg-[#00B86F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors mb-3 text-sm"
              >
                {!schedules || schedules.length === 0 ? "Chưa có lịch khởi hành" : !selectedScheduleId ? "Chọn lịch khởi hành" : "Đặt Tour Ngay"}
              </button>
              <button className="w-full py-3 border border-[#0EA5E9] text-[#0EA5E9] font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm">
                ♡ Yêu Thích
              </button>

              {/* Trust badges */}
              <div className="mt-5 pt-5 border-t border-gray-200 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>🔒</span><span>Thanh toán an toàn 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>↩️</span><span>Hủy miễn phí trước 7 ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🌐</span><span>Hướng dẫn viên chuyên nghiệp</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
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
