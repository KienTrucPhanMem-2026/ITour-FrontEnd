"use client";

import { useState, useEffect } from "react";
import type { ReviewDTO } from "@/lib/api/reviews";
import { createReviewAPI } from "@/lib/api/reviews";

interface BookingInfo {
  bookingId: string;
  departureDate?: string;
  tourGuideId?: string;
  tourGuideName?: string;
  reviewed?: boolean;
}

interface ReviewFormProps {
  tourId: string;
  customerId: string;
  unreviewedBookings: BookingInfo[];
  onSuccess?: (bookingId: string) => void;
  onError?: (error: string) => void;
}

export default function ReviewForm({
  tourId,
  customerId,
  unreviewedBookings,
  onSuccess,
  onError,
}: ReviewFormProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [tourRating, setTourRating] = useState<number>(5);
  const [tourComment, setTourComment] = useState("");
  const [guideRating, setGuideRating] = useState<number>(5);
  const [guideComment, setGuideComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-select the first booking on mount or list changes
  useEffect(() => {
    if (unreviewedBookings.length > 0) {
      if (!selectedBookingId || !unreviewedBookings.some((b) => b.bookingId === selectedBookingId)) {
        setSelectedBookingId(unreviewedBookings[0].bookingId);
      }
    }
  }, [unreviewedBookings, selectedBookingId]);

  // Reset form when switching to a different booking card
  useEffect(() => {
    setTourRating(5);
    setTourComment("");
    setGuideRating(5);
    setGuideComment("");
    setError(null);
    setSuccess(false);
  }, [selectedBookingId]);

  const selectedBooking = unreviewedBookings.find((b) => b.bookingId === selectedBookingId) || unreviewedBookings[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedBooking) {
      setError("Vui lòng chọn chuyến đi cần đánh giá.");
      return;
    }

    if (!tourComment.trim()) {
      const err = "Vui lòng chia sẻ trải nghiệm về chuyến đi của bạn.";
      setError(err);
      onError?.(err);
      return;
    }

    if (tourComment.trim().length < 5) {
      const err = "Bình luận về tour phải có ít nhất 5 ký tự.";
      setError(err);
      onError?.(err);
      return;
    }

    setLoading(true);

    try {
      const reviewPayload: ReviewDTO = {
        customerId,
        bookingId: selectedBooking.bookingId,
        tourId,
        tourRating: tourRating,
        tourComment: tourComment.trim(),
        rating: tourRating,
        comment: tourComment.trim(),
        ...(selectedBooking.tourGuideId ? {
          tourGuideId: selectedBooking.tourGuideId,
          tourGuideName: selectedBooking.tourGuideName,
          guideRating: guideRating,
          guideComment: guideComment.trim(),
        } : {}),
      };

      console.log("Submitting booking-specific review:", reviewPayload);
      await createReviewAPI(reviewPayload);

      setSuccess(true);
      
      // Delay calling onSuccess to let users read the success message briefly
      const completedBookingId = selectedBooking.bookingId;
      setTimeout(() => {
        onSuccess?.(completedBookingId);
      }, 800);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Không thể gửi đánh giá";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getGuideInitials = (name?: string) => {
    if (!name) return "G";
    const parts = name.split(" ");
    return parts[parts.length - 1]?.[0]?.toUpperCase() ?? "G";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-6">
      <div>
        <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">Đánh giá các chuyến đi của bạn</h3>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Chọn chuyến đi cần đánh giá. Mỗi booking được gửi đánh giá một lần duy nhất.
        </p>
      </div>

      {/* ── Section 1: Horizontal Scroll Booking Cards ── */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 mb-2 scrollbar-thin scroll-smooth">
        {unreviewedBookings.map((booking) => {
          const isActive = booking.bookingId === selectedBookingId;
          const formattedDate = booking.departureDate
            ? new Date(booking.departureDate).toLocaleDateString("vi-VN")
            : "—";
          return (
            <div
              key={booking.bookingId}
              onClick={() => setSelectedBookingId(booking.bookingId)}
              className={`relative flex-shrink-0 w-44 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                isActive
                  ? "border-sky-500 bg-sky-50/20 shadow-md translate-y-[-2px] scale-[1.01]"
                  : "border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:translate-y-[-1px]"
              }`}
            >
              {isActive && (
                <span className="absolute top-2.5 right-2.5 text-emerald-500 bg-white rounded-full p-0.5 shadow-sm border border-emerald-100 animate-in zoom-in-50 duration-200">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block">Mã chuyến đi</span>
                <span className="text-xs font-black text-slate-800 font-mono mt-0.5 uppercase">{booking.bookingId}</span>
                
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block mt-3">Ngày khởi hành</span>
                <span className="text-xs font-extrabold text-slate-700 mt-0.5">{formattedDate}</span>
                
                <span className="text-[10px] text-slate-500 mt-4 font-bold border-t border-slate-100 pt-2 flex items-center gap-1.5 truncate">
                  👨‍✈️ HDV: {booking.tourGuideName || "Chưa phân công"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Section 2: Review Input Form ── */}
      {selectedBooking && (
        <form onSubmit={handleSubmit} className="space-y-5 pt-2 border-t border-slate-100">
          <div className="bg-slate-50/50 rounded-2xl p-4 md:p-5 border border-slate-100 space-y-6">
            <h4 className="font-extrabold text-sm text-slate-700">
              Đánh giá trải nghiệm ngày {selectedBooking.departureDate ? new Date(selectedBooking.departureDate).toLocaleDateString("vi-VN") : "—"}
            </h4>

            {/* Dynamic Tour Guide Rating (only show if guide is assigned) */}
            {selectedBooking.tourGuideName && (
              <div className="bg-white rounded-xl p-4 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center font-extrabold text-sm shadow-sm select-none">
                    {getGuideInitials(selectedBooking.tourGuideName)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">HDV {selectedBooking.tourGuideName}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tư vấn & Hướng dẫn đoàn</p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Chấm điểm HDV:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setGuideRating(star)}
                          className="text-xl transition-all focus:outline-none hover:scale-110 active:scale-95 cursor-pointer"
                          title={`${star} sao`}
                        >
                          <span className={star <= guideRating ? "text-yellow-400" : "text-slate-200"}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Viết nhận xét ngắn về HDV (tùy chọn)..."
                    value={guideComment}
                    onChange={(e) => setGuideComment(e.target.value)}
                    className="w-full md:w-64 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50 text-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Tour Rating */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Đánh giá chất lượng dịch vụ Tour *
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTourRating(star)}
                      className="text-2xl transition-all focus:outline-none hover:scale-110 active:scale-95 cursor-pointer"
                      title={`${star} sao`}
                    >
                      <span className={star <= tourRating ? "text-yellow-400" : "text-slate-200"}>★</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nội dung bình luận chuyến đi *
                </label>
                <textarea
                  value={tourComment}
                  onChange={(e) => setTourComment(e.target.value)}
                  placeholder="Hãy chia sẻ những trải nghiệm thực tế của bạn về lịch trình, phương tiện, bữa ăn, và dịch vụ khách sạn..."
                  maxLength={500}
                  className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-700 leading-relaxed resize-none h-24"
                  required
                />
                <p className="text-[9px] text-slate-400 text-right font-medium">
                  {tourComment.length}/500 ký tự (tối thiểu 5 ký tự)
                </p>
              </div>
            </div>
          </div>

          {/* Feedback states */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600 animate-in fade-in duration-200">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-2 animate-in fade-in duration-200">
              <span>✓</span>
              <span>Đánh giá chuyến đi đã được gửi thành công! Đang chuẩn bị chuyển tiếp...</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-xl transition-all duration-200 text-xs shadow-lg shadow-sky-100/50 active:scale-[0.98] cursor-pointer"
          >
            {loading ? "Đang xử lý..." : "Gửi Đánh Giá Chuyến Đi"}
          </button>
        </form>
      )}
    </div>
  );
}
