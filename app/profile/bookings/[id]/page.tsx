"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getBookingByIdAPI, cancelBookingAPI, getBookingPaymentUrlAPI } from "@/lib/api/bookings";
import { getTourByIdAPI } from "@/lib/api/tours";
import { getStoredUser } from "@/lib/auth";
import { getMyBookingsAPI } from "@/lib/api/bookings";
import { useBookingTimer } from "@/hooks/useBookingTimer";
import { 
  ArrowLeft, Calendar, Users, CreditCard, Clock, 
  AlertCircle, MapPin, Star, User, ShieldCheck, Mail, Phone 
} from "lucide-react";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  "VNPAY": "VNPay",
  "CREDITCARD": "Thẻ tín dụng",
  "MOMO": "Ví MoMo"
};

const STATUS_CONFIG: Record<string, { text: string; bg: string; textClass: string; border: string }> = {
  "PENDING": { text: "Đang chờ thanh toán", bg: "bg-amber-50", textClass: "text-amber-700", border: "border-amber-100" },
  "CONFIRMED": { text: "Đã xác nhận", bg: "bg-emerald-50", textClass: "text-emerald-700", border: "border-emerald-100" },
  "COMPLETED": { text: "Hoàn tất chuyến đi", bg: "bg-sky-50", textClass: "text-sky-700", border: "border-sky-100" },
  "CANCELLED": { text: "Đã hủy đơn", bg: "bg-rose-50", textClass: "text-rose-700", border: "border-rose-100" },
};

export default function BookingDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [booking, setBooking] = useState<any | null>(null);
  const [bookingDto, setBookingDto] = useState<any | null>(null);
  const [tour, setTour] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const isPending = booking?.status === "PENDING";
  const { formattedTime, isExpired, progressPercent } = useBookingTimer(
    isPending ? bookingDto?.expireAt : null
  );

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    if (id) {
      loadDetails(id, user.id);
    }
  }, [id]);

  const loadDetails = async (bookingId: string, customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch raw booking with passenger list
      const rawBooking = await getBookingByIdAPI(bookingId);
      setBooking(rawBooking);
      setPaymentUrl(rawBooking.paymentUrl || null);

      // 2. Fetch bookings list DTO to get tour info and expireAt timer
      const myBookings = await getMyBookingsAPI(customerId);
      const dto = myBookings.find(b => b.bookingId === bookingId);
      
      if (dto) {
        setBookingDto(dto);
        // 3. Fetch tour details
        const tourData = await getTourByIdAPI(dto.tourId);
        setTour(tourData);
      } else {
        // Fallback if not found in list DTO
        setBookingDto(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đặt tour này không?")) return;
    try {
      await cancelBookingAPI(booking.id);
      alert("Đã hủy đơn hàng thành công.");
      const user = getStoredUser();
      if (user) loadDetails(booking.id, user.id);
    } catch (err: any) {
      alert(err.message || "Không thể hủy đơn hàng.");
    }
  };

  const formatPrice = (price?: number) => {
    if (price == null) return "—";
    return price.toLocaleString("vi-VN") + " đ";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F5F8F8]">
        <Header />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
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

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10">
        {/* Back Button */}
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại lịch sử đặt tour
        </Link>

        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-md uppercase tracking-wider">
                Mã đơn: {booking.id}
              </span>
              <span className={`text-xs font-black px-3 py-1 rounded-md border uppercase tracking-wider ${cfg.bg} ${cfg.textClass} ${cfg.border}`}>
                {cfg.text}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2 leading-tight">
              Chi Tiết Đơn Đặt Tour
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT 2 COLUMNS: Info & Passenger List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tour Info Card */}
            {tour && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300">
                <div className="w-full md:w-44 h-28 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                  <img 
                    src={tour.images?.[0] || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"} 
                    className="w-full h-full object-cover" 
                    alt="Tour image" 
                  />
                </div>
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                      {tour.name}
                    </h3>
                    <div className="text-slate-500 text-xs mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 fill-sky-400 text-sky-400" />
                        Khởi hành: {tour.startDestinationName || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                        Điểm đến: {tour.endDestinationName || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                    <span className="text-xs font-bold text-slate-400">
                      ⏱️ Thời gian: {tour.durationDays} ngày {tour.durationNights} đêm
                    </span>
                    {tour.rating && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {tour.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Passenger List Card */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2">
                <Users className="w-5 h-5 fill-purple-400 text-purple-400" />
                Thông tin hành khách đi tour ({booking.quantity} người)
              </h3>

              {booking.passengers && booking.passengers.length > 0 ? (
                <div className="space-y-4">
                  {booking.passengers.map((p: any, idx: number) => (
                    <div 
                      key={p.id} 
                      className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30"
                    >
                      <div className="flex-grow">
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-mono font-bold text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-950 text-base">{p.fullName}</span>
                          {p.isRepresentative && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700">
                              Người liên hệ chính
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 font-semibold">
                          <span className="bg-white border border-slate-100 rounded-md px-2 py-0.5">
                            {p.passengerType === "ADULT" ? "Người lớn" : p.passengerType === "CHILD" ? "Trẻ em" : "Em bé"}
                          </span>
                          <span>Giới tính: {p.gender === "MALE" ? "Nam" : "Nữ"}</span>
                          {p.dob && <span>Ngày sinh: {new Date(p.dob).toLocaleDateString("vi-VN")}</span>}
                          {p.identityNumber && <span>Số giấy tờ: {p.identityNumber}</span>}
                        </div>
                      </div>

                      {p.specialNote && p.specialNote !== "Không có" && (
                        <div className="shrink-0 max-w-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-3 py-2 text-xs font-semibold flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                          <div>
                            <div className="text-[10px] font-black uppercase text-amber-600 mb-0.5">Ghi chú đặc biệt</div>
                            {p.specialNote}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs font-medium">
                  Chưa có thông tin chi tiết hành khách.
                </div>
              )}
            </div>

            {/* Representative Contact Details */}
            {booking.customer && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 fill-sky-400 text-sky-400" />
                  Thông tin người đặt hàng (Liên hệ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-50 flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">Họ và tên</div>
                      <div className="text-slate-800 text-sm font-bold">{booking.customer.fullName}</div>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-50 flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">Số điện thoại</div>
                      <a href={`tel:${booking.customer.phone}`} className="text-blue-600 text-sm font-bold hover:underline">
                        {booking.customer.phone || "N/A"}
                      </a>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-50 flex items-center gap-3 md:col-span-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">Địa chỉ Email</div>
                      <div className="text-slate-800 text-sm font-bold">{booking.customer.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 1 COLUMN: Payment details & actions */}
          <div className="space-y-6">
            
            {/* Payment Summary */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6">
              <h3 className="text-base font-black text-slate-900 mb-5 pb-3 border-b border-slate-50 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                Chi tiết thanh toán
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span>Giá gốc / khách</span>
                  <span className="text-slate-950 font-bold">{formatPrice(booking.unitPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số lượng</span>
                  <span className="text-slate-950 font-bold">{booking.quantity} người ({booking.adults} NL, {booking.children} TE)</span>
                </div>
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-slate-950 font-bold">{formatPrice(booking.totalPrice)}</span>
                </div>
                
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Khuyến mãi</span>
                    <span>-{formatPrice(booking.discountAmount)}</span>
                  </div>
                )}
                {booking.pointUsed > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Sử dụng điểm</span>
                    <span>-{booking.pointUsed} điểm</span>
                  </div>
                )}

                <div className="h-px bg-slate-50 my-2"></div>

                <div className="flex justify-between items-end">
                  <span className="text-slate-900 font-bold text-sm">Tổng cộng thanh toán</span>
                  <span className="text-2xl font-black text-slate-950 tracking-tight">{formatPrice(booking.finalPrice)}</span>
                </div>

                <div className="h-px bg-slate-50 my-2"></div>

                <div className="flex justify-between">
                  <span>Phương thức</span>
                  <span className="text-slate-950 font-bold">{PAYMENT_METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trạng thái thanh toán</span>
                  <span className={`font-bold ${booking.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
                {booking.paymentDate && (
                  <div className="flex justify-between">
                    <span>Thời gian thanh toán</span>
                    <span className="text-slate-950 font-bold">
                      {new Date(booking.paymentDate).toLocaleString("vi-VN")}
                    </span>
                  </div>
                )}
              </div>

              {/* Booking Actions */}
              <div className="mt-6 space-y-3">
                {isPending && !isExpired && (
                  <>
                    <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl">
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold mb-2">
                        <Clock className="w-4 h-4 fill-amber-500 text-amber-500" />
                        Giữ chỗ kết thúc trong: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{formattedTime}</span>
                      </div>
                      <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-1000"
                          style={{ width: `${100 - progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {paymentUrl ? (
                      <a 
                        href={paymentUrl}
                        className="block w-full text-center py-3.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-100 active:scale-[0.98] transition-all"
                      >
                        Thanh toán ngay
                      </a>
                    ) : (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-400 font-bold rounded-2xl text-xs cursor-not-allowed"
                      >
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Đang chuẩn bị link thanh toán...
                      </button>
                    )}

                    <button
                      onClick={handleCancel}
                      className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-black rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all"
                    >
                      ✕ Hủy đơn đặt tour
                    </button>
                  </>
                )}

                {/* Return Home/Shop Button */}
                <Link
                  href="/tours"
                  className="block w-full text-center py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all"
                >
                  Khám phá thêm tour khác
                </Link>
              </div>
            </div>

            {/* Expired alert */}
            {isPending && isExpired && (
              <div className="p-4 bg-rose-50/70 rounded-[1.8rem] border border-rose-100 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase text-rose-700 mb-0.5">Giữ chỗ hết hạn</h4>
                  <p className="text-xs text-rose-600 leading-relaxed font-semibold">
                    Đơn hàng đã tự động hủy do quá hạn 15 phút chưa thanh toán. Vui lòng đặt lại tour mới nếu bạn vẫn có nhu cầu tham gia.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
