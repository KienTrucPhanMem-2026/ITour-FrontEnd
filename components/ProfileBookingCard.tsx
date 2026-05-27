"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useBookingTimer } from "@/hooks/useBookingTimer";
import type { BookingResponseDTO } from "@/types/api";
import { getBookingPaymentUrlAPI } from "@/lib/api/bookings";
import { Calendar, Users, CreditCard, Clock, AlertCircle, Eye } from "lucide-react";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  "VNPAY": "VNPay",
  "CREDITCARD": "Thẻ tín dụng",
  "MOMO": "Ví MoMo"
};

export default function ProfileBookingCard({ 
  booking, 
  onCancel 
}: { 
  booking: BookingResponseDTO;
  onCancel: (bookingId: string) => void;
}) {
  const isPending = booking.status === "PENDING";
  const isPaid = booking.status === "PAID" || booking.paymentStatus === "PAID" || booking.status === "CONFIRMED" || booking.status === "COMPLETED";
  const isCancelled = booking.status === "CANCELLED";

  const [currentPaymentUrl, setCurrentPaymentUrl] = useState<string | null>(
    booking.paymentUrl || null
  );

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const { formattedTime, isExpired, progressPercent } = useBookingTimer(
    isPending ? booking.expireAt : null
  );

  useEffect(() => {
    if (!isPending || currentPaymentUrl || isExpired) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const data = await getBookingPaymentUrlAPI(booking.bookingId);
        if (data.paymentUrl) {
          setCurrentPaymentUrl(data.paymentUrl);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        // ignore errors silently
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isPending, currentPaymentUrl, isExpired, booking.bookingId]);

  const handlePayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPaymentUrl) window.location.href = currentPaymentUrl;
  };

  const statusBadge = () => {
    if (isPaid)
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
          Đã thanh toán
        </span>
      );
    if (isCancelled || (isPending && isExpired))
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-rose-50 text-rose-700 border border-rose-100">
          Đã hủy
        </span>
      );
    if (isPending)
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-amber-50 text-amber-700 border border-amber-100">
          Đang xử lý
        </span>
      );
    return (
      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-slate-50 text-slate-700 border border-slate-100">
        {booking.status}
      </span>
    );
  };

  return (
    <div className="border border-slate-100 rounded-[1.8rem] p-6 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col bg-white gap-4 relative group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-grow">
          <div className="flex flex-wrap items-center gap-3 mb-2.5">
            <span className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {booking.bookingId}
            </span>
            {statusBadge()}
          </div>
          
          <Link href={`/profile/bookings/${booking.bookingId}`}>
            <h3 className="font-extrabold text-slate-900 text-lg hover:text-sky-600 transition-colors cursor-pointer leading-snug">
              {booking.tourName || "Tên Tour"}
            </h3>
          </Link>
          
          <div className="text-slate-500 text-xs mt-3 flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 fill-sky-400 text-sky-400 shrink-0" />
              Ngày đặt: {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString("vi-VN") : "N/A"}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 fill-purple-400 text-purple-400 shrink-0" />
              Số khách: {booking.quantity} ({booking.adults} NL, {booking.children} TE)
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              {PAYMENT_METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod}
            </span>
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-between items-end gap-3 text-right shrink-0">
          <div>
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
              Tổng tiền
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
              {booking.finalPrice ? booking.finalPrice.toLocaleString("vi-VN") + "đ" : "N/A"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              href={`/profile/bookings/${booking.bookingId}`}
              className="px-3.5 py-1.5 text-xs font-black text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition flex items-center gap-1 border border-slate-100"
            >
              <Eye className="w-3.5 h-3.5" /> Chi tiết
            </Link>

            {booking.status === "COMPLETED" && (
              booking.reviewed ? (
                <span className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-1">
                  ✓ Đã đánh giá
                </span>
              ) : (
                <Link
                  href={`/profile/bookings/${booking.bookingId}?openReview=true`}
                  className="px-3.5 py-1.5 text-xs font-black text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition shadow-md shadow-sky-100 flex items-center gap-1"
                >
                  ★ Đánh giá ngay
                </Link>
              )
            )}

            {isPending && !isExpired && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(booking.bookingId);
                }}
                className="px-3.5 py-1.5 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-100"
              >
                ✕ Hủy Tour
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Countdown & Payment Section for PENDING booking */}
      {isPending && !isExpired && (
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-grow">
            <p className="text-xs text-amber-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
              Thời gian giữ chỗ còn lại: <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-amber-200">{formattedTime}</span>
            </p>
            <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  progressPercent > 80
                    ? "bg-rose-500"
                    : progressPercent > 50
                    ? "bg-orange-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>
          </div>
          <div className="shrink-0">
            {currentPaymentUrl ? (
              <button
                onClick={handlePayNow}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] whitespace-nowrap uppercase tracking-wider"
              >
                Tiến hành thanh toán
              </button>
            ) : (
              <button
                disabled
                className="px-5 py-2.5 bg-slate-200 text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Đang tạo link...
              </button>
            )}
          </div>
        </div>
      )}

      {isPending && isExpired && (
        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
          <p className="text-xs text-rose-700 font-bold">
            Đã hủy tự động do hết hạn thanh toán
          </p>
        </div>
      )}
    </div>
  );
}
