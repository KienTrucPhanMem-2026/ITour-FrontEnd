"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import ProfileBookingCard from "@/components/ProfileBookingCard";
import { getStoredUser, setStoredUser, clearStoredUser } from "@/lib/auth";
import { getUserProfileAPI, updateUserProfileAPI, getUserVouchersAPI } from "@/lib/api/users";
import { getMyBookingsAPI, cancelBookingAPI } from "@/lib/api/bookings";
import { getFavouriteToursAPI, removeFavouriteAPI } from "@/lib/api/favourites";
import type { UserProfile, BookingResponseDTO, TourDTO, UpdateProfileRequest } from "@/types/api";
import {
  User as UserIcon, Calendar, Heart, Ticket, Eye, Clock, Phone, Award,
  ShieldAlert, Sparkles, CheckCircle, Trash2, ShieldCheck, Zap
} from "lucide-react";
import { useThrottledAction } from "@/hooks/useThrottledAction";

type TabType = "info" | "bookings" | "schedules" | "vouchers" | "favourites";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [scheduleTab, setScheduleTab] = useState<"pending" | "awaiting_payment" | "upcoming" | "in_progress" | "completed" | "cancelled">("pending");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [favTours, setFavTours] = useState<TourDTO[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);

  // Edit Profile states
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateProfileRequest>({});
  const [updateMsg, setUpdateMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.push("/login");
      return;
    }
    loadAllData(stored.id);
  }, [router]);

  // React to search param changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "schedules") {
      setActiveTab("bookings");
    } else if (
      tabParam === "info" ||
      tabParam === "bookings" ||
      tabParam === "vouchers" ||
      tabParam === "favourites"
    ) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  const loadAllData = async (userId: string) => {
    setIsLoading(true);
    try {
      const [pData, bData, fData, vData] = await Promise.all([
        getUserProfileAPI(userId).catch((err) => {
          console.error("Erro ao carregar perfil:", err);
          return null;
        }),
        getMyBookingsAPI(userId).catch((err) => {
          console.error("Erro ao carregar bookings:", err);
          return [];
        }),
        getFavouriteToursAPI(userId).catch((err) => {
          console.error("Erro ao carregar favoritos:", err);
          return [];
        }),
        getUserVouchersAPI(userId).catch((err) => {
          console.error("Error loading vouchers:", err);
          return [];
        })
      ]);

      // Se profile não encontrado (404), usuário foi deletado
      if (pData === null) {
        alert("Sua sessão expirou. Por favor, faça login novamente.");
        // Logout e redireciona para login
        clearStoredUser();
        router.push("/login");
        return;
      }

      if (pData) {
        setProfile(pData);
        setUpdateForm({
          fullName: pData.fullName || "",
          phone: pData.phone || "",
          address: pData.address || "",
          dateOfBirth: pData.dateOfBirth || "",
          identityNumber: pData.identityNumber || "",
        });
      }

      // Sort bookings descending by date (newest first)
      const sortedBookings = (bData || []).sort((a: any, b: any) => {
        return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
      });
      setBookings(sortedBookings);
      setFavTours(fData || []);
      setVouchers(vData || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      alert("Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  // Cancel Confirmation Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingIdToCancel, setBookingIdToCancel] = useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Rate Limiting hook
  const { execute: throttledSubmit, isBlocked } = useThrottledAction(2000);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsUpdating(true);
    setUpdateMsg(null);

    try {
      const updated = await updateUserProfileAPI(profile.id, updateForm);
      setProfile(updated);
      setStoredUser(updated); // update sync
      setUpdateMsg({ text: "Cập nhật thành công!", type: "success" });
    } catch (err: any) {
      setUpdateMsg({ text: err.message || "Lỗi khi cập nhật profile.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBooking = (booking: any) => {
    setBookingToCancel(booking);
    setBookingIdToCancel(booking.bookingId);
    setCancelModalOpen(true);
  };

  const confirmCancelBooking = () => {
    if (!bookingIdToCancel || isBlocked) return;
    
    throttledSubmit(async () => {
      setIsCancelling(true);
      try {
        await cancelBookingAPI(bookingIdToCancel);
        // Reload bookings list
        if (profile) {
          const bData = await getMyBookingsAPI(profile.id);
          const sorted = (bData || []).sort((a: any, b: any) => {
            return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
          });
          setBookings(sorted);
          // reload profile to update points if reversed
          const pData = await getUserProfileAPI(profile.id);
          setProfile(pData);
        }
      } catch (err: any) {
        alert(err.message || "Không thể hủy đơn này.");
      } finally {
        setIsCancelling(false);
        setCancelModalOpen(false);
        setBookingIdToCancel(null);
        setBookingToCancel(null);
      }
    });
  };

  const handleRemoveFav = async (tourId: string) => {
    if (!profile) return;
    try {
      await removeFavouriteAPI(profile.id, tourId);
      setFavTours(prev => prev.filter(t => t.id !== tourId));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#F5F8F8] flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        {/* Page Hero / Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white text-4xl font-bold shadow-lg shrink-0">
            {profile.fullName?.charAt(0).toUpperCase() || profile.userName.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-grow">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.fullName || profile.userName}</h1>
            <div className="text-gray-500 text-sm flex flex-wrap justify-center md:justify-start gap-4">
              <span>✉ {profile.email}</span>
              {profile.phone && <span>📞 {profile.phone}</span>}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-wider rounded-full border border-sky-100">
              ⭐ Cấp bậc: Khách hàng
            </div>
          </div>

          {/* Stats boxes */}
          <div className="flex gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center w-28">
              <div className="text-emerald-600 font-black text-xl">{profile.point || 0}</div>
              <div className="text-gray-500 text-[10px] font-bold uppercase mt-1">Điểm thưởng</div>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center w-28">
              <div className="text-orange-600 font-black text-xl">{bookings.length}</div>
              <div className="text-gray-500 text-[10px] font-bold uppercase mt-1">Booking</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex flex-col gap-1 sticky top-24">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'info' ? 'bg-sky-50 text-[#0EA5E9]' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <UserIcon className="w-4 h-4 shrink-0" /> Thông tin tài khoản
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'bookings' ? 'bg-sky-50 text-[#0EA5E9]' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Calendar className="w-4 h-4 shrink-0" /> Chuyến đi của tôi
              </button>
              <button
                onClick={() => setActiveTab("vouchers")}
                className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'vouchers' ? 'bg-sky-50 text-[#0EA5E9]' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Ticket className="w-4 h-4 shrink-0" /> Ví voucher của tôi
              </button>
              <button
                onClick={() => setActiveTab("favourites")}
                className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'favourites' ? 'bg-sky-50 text-[#0EA5E9]' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Heart className="w-4 h-4 shrink-0" /> Tour đã yêu thích
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3">

            {/* -- TAB: INFO -- */}
            {activeTab === "info" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
                  Chỉnh sửa thông tin cá nhân
                </h2>

                {updateMsg && (
                  <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${updateMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {updateMsg.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 text-xs text-gray-400 font-medium uppercase tracking-widest mb-[-12px]">Thông tin cơ bản</div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Tên đăng nhập</label>
                    <input type="text" disabled value={profile.userName} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email</label>
                    <input type="email" disabled value={profile.email} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed" />
                  </div>

                  <div className="md:col-span-2 h-px bg-gray-100 my-2"></div>
                  <div className="md:col-span-2 text-xs text-gray-400 font-medium uppercase tracking-widest mb-[-12px]">Thông tin có thể thay đổi</div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={updateForm.fullName}
                      onChange={e => setUpdateForm({ ...updateForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      value={updateForm.phone}
                      onChange={e => setUpdateForm({ ...updateForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Ngày sinh</label>
                    <input
                      type="date"
                      value={updateForm.dateOfBirth}
                      onChange={e => setUpdateForm({ ...updateForm, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Địa chỉ</label>
                    <input
                      type="text"
                      value={updateForm.address}
                      onChange={e => setUpdateForm({ ...updateForm, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                      Số CMND / CCCD / Hộ chiếu
                      <span className="ml-1.5 text-gray-400 font-normal normal-case">(dùng tự động điền khi đặt tour)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập số giấy tờ tùy thân"
                      value={updateForm.identityNumber || ""}
                      onChange={e => setUpdateForm({ ...updateForm, identityNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm outline-none transition"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end mt-4">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-8 py-3 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 shadow-lg shadow-sky-200 disabled:opacity-50 disabled:shadow-none transition"
                    >
                      {isUpdating ? "Đang xử lý..." : "💾 Lưu Thay Đổi"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* -- TAB: MY TRIPS (CHUYẾN ĐI CỦA TÔI) -- */}
            {activeTab === "bookings" && (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const pendingTrips = bookings.filter(b =>
                b.status === "PENDING" &&
                b.paymentStatus !== "PAID"
              );

              const awaitingPaymentTrips = bookings.filter(b =>
                b.status === "AWAITING_PAYMENT" &&
                b.paymentStatus !== "PAID"
              );

              const upcomingTrips = bookings.filter(b =>
                (b.status === "CONFIRMED" || b.status === "PAID") &&
                new Date(b.startDate || b.bookingDate) > today
              );

              const inProgressTrips = bookings.filter(b =>
                (b.status === "CONFIRMED" || b.status === "PAID") &&
                new Date(b.startDate || b.bookingDate) <= today &&
                new Date(b.endDate || b.bookingDate) >= today
              );

              const completedTrips = bookings.filter(b =>
                b.status === "COMPLETED" ||
                ((b.status === "CONFIRMED" || b.status === "PAID") && new Date(b.endDate || b.bookingDate) < today)
              );

              const cancelledTrips = bookings.filter(b =>
                b.status === "CANCELLED"
              );

              const counts = {
                pending: pendingTrips.length,
                awaiting_payment: awaitingPaymentTrips.length,
                upcoming: upcomingTrips.length,
                in_progress: inProgressTrips.length,
                completed: completedTrips.length,
                cancelled: cancelledTrips.length,
              };

              const currentTripList =
                scheduleTab === "pending" ? pendingTrips :
                  scheduleTab === "awaiting_payment" ? awaitingPaymentTrips :
                    scheduleTab === "upcoming" ? upcomingTrips :
                      scheduleTab === "in_progress" ? inProgressTrips :
                        scheduleTab === "completed" ? completedTrips : cancelledTrips;

              const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
                const [timeText, setTimeText] = useState("");
                useEffect(() => {
                  const updateTime = () => {
                    const diff = new Date(targetDate).getTime() - Date.now();
                    if (diff <= 0) { setTimeText("Đến giờ khởi hành!"); return; }
                    const d = Math.floor(diff / 86400000);
                    const h = Math.floor((diff % 86400000) / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    setTimeText(`Khởi hành sau: ${d} ngày ${h} giờ ${m} phút`);
                  };
                  updateTime();
                  const timer = setInterval(updateTime, 60000);
                  return () => clearInterval(timer);
                }, [targetDate]);

                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-extrabold text-[10px] uppercase rounded-full border border-amber-100 shadow-sm shrink-0">
                    <Clock className="w-3.5 h-3.5 fill-amber-500 text-white shrink-0" />
                    {timeText}
                  </span>
                );
              };

              const PaymentExpiryTimer = ({ targetDate }: { targetDate: string }) => {
                const [timeText, setTimeText] = useState("");
                const [isExpired, setIsExpired] = useState(false);

                useEffect(() => {
                  const updateTime = () => {
                    const diff = new Date(targetDate).getTime() - Date.now();
                    if (diff <= 0) {
                      setTimeText("Hết hạn giữ chỗ!");
                      setIsExpired(true);
                      return;
                    }
                    const totalSecs = Math.floor(diff / 1000);
                    const hours = Math.floor(totalSecs / 3600);
                    const mins = Math.floor((totalSecs % 3600) / 60);
                    const secs = totalSecs % 60;

                    if (hours > 0) {
                      setTimeText(`Giữ chỗ còn: ${hours}h ${mins}m`);
                    } else {
                      setTimeText(`Giữ chỗ còn: ${mins}m ${String(secs).padStart(2, "0")}s`);
                    }
                  };
                  updateTime();
                  const timer = setInterval(updateTime, 1000);
                  return () => clearInterval(timer);
                }, [targetDate]);

                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-extrabold text-[10px] uppercase rounded-full border shadow-sm shrink-0 ${isExpired ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isExpired ? 'fill-rose-500 text-white' : 'fill-amber-500 text-white animate-pulse'}`} />
                    {timeText}
                  </span>
                );
              };

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
                    Chuyến đi của tôi ({bookings.length})
                  </h2>

                  {/* Sub Tabs Bar */}
                  <div className="flex border-b border-slate-100 gap-6 mb-6 overflow-x-auto scrollbar-none">
                    {[
                      { id: "pending", label: "Chờ duyệt", count: counts.pending, color: "text-amber-500" },
                      { id: "awaiting_payment", label: "Chờ thanh toán", count: counts.awaiting_payment, color: "text-amber-600" },
                      { id: "upcoming", label: "Sắp khởi hành", count: counts.upcoming, color: "text-[#0EA5E9]" },
                      { id: "in_progress", label: "Đang diễn ra", count: counts.in_progress, color: "text-emerald-600" },
                      { id: "completed", label: "Đã hoàn thành", count: counts.completed, color: "text-purple-600" },
                      { id: "cancelled", label: "Đã hủy", count: counts.cancelled, color: "text-rose-600" }
                    ].map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setScheduleTab(sub.id as any)}
                        className={`pb-3 text-xs font-black uppercase tracking-wider relative transition-all whitespace-nowrap ${scheduleTab === sub.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {sub.label} ({sub.count})
                        {scheduleTab === sub.id && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>

                  {currentTripList.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 text-xs font-bold uppercase tracking-wider">
                      Không có chuyến đi nào ở mục này.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {currentTripList.map(b => {
                        const hasImage = !!b.tourImage;
                        return (
                          <div key={b.bookingId} className="border border-slate-100 rounded-[1.8rem] p-6 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col md:flex-row bg-white gap-5 relative">
                            {/* Trip Image Left side */}
                            <div className="w-full md:w-44 h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 flex items-center justify-center relative">
                              {hasImage ? (
                                <img src={b.tourImage} alt={b.tourName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-slate-300 font-extrabold text-xs uppercase">ITOUR TRIP</span>
                              )}
                              <span className="absolute top-2 left-2 z-10 text-[9px] font-black bg-slate-950/80 text-white px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm">
                                #{b.bookingId}
                              </span>
                            </div>

                            {/* Trip content right side */}
                            <div className="flex-grow flex flex-col justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                  {scheduleTab === "pending" && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-extrabold text-[10px] uppercase rounded-full border border-amber-100 shadow-sm shrink-0">
                                      <Clock className="w-3.5 h-3.5 fill-amber-500 text-white shrink-0" />
                                      Đang chờ duyệt
                                    </span>
                                  )}
                                  {scheduleTab === "awaiting_payment" && b.expireAt && (
                                    <PaymentExpiryTimer targetDate={b.expireAt} />
                                  )}
                                  {scheduleTab === "awaiting_payment" && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] uppercase rounded-full border border-indigo-100 shadow-sm shrink-0">
                                      <Clock className="w-3.5 h-3.5 fill-indigo-500 text-white shrink-0" />
                                      Chờ thanh toán
                                    </span>
                                  )}
                                  {scheduleTab === "upcoming" && b.startDate && (
                                    <CountdownTimer targetDate={b.startDate} />
                                  )}
                                  {scheduleTab === "in_progress" && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase rounded-full border border-emerald-100 animate-pulse">
                                      <Sparkles className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0" />
                                      Đang diễn ra
                                    </span>
                                  )}
                                  {scheduleTab === "completed" && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 font-extrabold text-[10px] uppercase rounded-full border border-sky-100">
                                      <CheckCircle className="w-3.5 h-3.5 fill-sky-500 text-white shrink-0" />
                                      Đã hoàn thành
                                    </span>
                                  )}
                                  {scheduleTab === "cancelled" && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-[10px] uppercase rounded-full border border-rose-100">
                                      <ShieldAlert className="w-3.5 h-3.5 fill-rose-500 text-white shrink-0" />
                                      Đã hủy
                                    </span>
                                  )}
                                </div>

                                <Link href={`/profile/bookings/${b.bookingId}`}>
                                  <h3 className="font-extrabold text-slate-900 text-base md:text-lg hover:text-[#0EA5E9] transition-colors cursor-pointer leading-snug">
                                    {b.tourName || "Tên Tour"}
                                  </h3>
                                </Link>

                                <div className="text-slate-500 text-xs mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-semibold">
                                  {b.startDate && (
                                    <span className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-sky-500 fill-sky-100 shrink-0" />
                                      <span>Khởi hành: <strong className="text-slate-800 font-bold">{new Date(b.startDate).toLocaleDateString("vi-VN")}</strong></span>
                                    </span>
                                  )}
                                  {b.licensePlate && (
                                    <span className="flex items-center gap-2">
                                      <Award className="w-4 h-4 text-indigo-500 fill-indigo-100 shrink-0" />
                                      <span>Biển số xe: <strong className="text-slate-800 font-bold">{b.licensePlate}</strong></span>
                                    </span>
                                  )}
                                  {b.tourGuideName && (
                                    <span className="flex items-center gap-2">
                                      <UserIcon className="w-4 h-4 text-[#0EA5E9] fill-sky-100 shrink-0" />
                                      <span>HDV: <strong className="text-slate-800 font-bold">{b.tourGuideName}</strong></span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Footer row inside content */}
                              <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-50 flex-wrap">
                                <div>
                                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block mb-0.5">Tổng thanh toán</span>
                                  <strong className="text-lg font-black text-slate-900 tracking-tight">
                                    {b.finalPrice ? b.finalPrice.toLocaleString("vi-VN") + "đ" : "—"}
                                  </strong>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/profile/bookings/${b.bookingId}`}
                                    className="px-3.5 py-1.5 text-xs font-black text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition flex items-center gap-1 border border-slate-100"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Chi tiết chuyến đi
                                  </Link>

                                  {scheduleTab === "pending" && (
                                    <button
                                      onClick={() => handleCancelBooking(b)}
                                      className="px-3.5 py-1.5 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center gap-1.5 active:scale-95 border border-rose-100/50 shadow-sm"
                                    >
                                      ✕ Hủy đặt tour
                                    </button>
                                  )}

                                  {scheduleTab === "awaiting_payment" && (
                                    <Link
                                      href={`/profile/bookings/${b.bookingId}`}
                                      className="px-4 py-1.5 text-xs font-black text-white bg-gradient-to-r from-pink-500 to-[#D82D8B] hover:from-pink-600 hover:to-[#B01E6C] rounded-xl transition shadow-md shadow-pink-100/50 flex items-center gap-1.5 active:scale-95"
                                    >
                                      Thanh toán ngay
                                    </Link>
                                  )}

                                  {scheduleTab === "awaiting_payment" && (
                                    <button
                                      onClick={() => handleCancelBooking(b)}
                                      className="px-3.5 py-1.5 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center gap-1.5 active:scale-95 border border-rose-100/50 shadow-sm"
                                    >
                                      ✕ Hủy đặt tour
                                    </button>
                                  )}

                                  {scheduleTab === "upcoming" && (() => {
                                    const start = new Date(b.startDate || b.bookingDate);
                                    const today = new Date();
                                    start.setHours(0, 0, 0, 0);
                                    today.setHours(0, 0, 0, 0);
                                    const diffTime = start.getTime() - today.getTime();
                                    const daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    if (daysBetween <= 0) {
                                      return (
                                        <button
                                          disabled
                                          className="px-3.5 py-1.5 text-xs font-black text-slate-400 bg-slate-100 rounded-xl border border-slate-200 cursor-not-allowed flex items-center gap-1.5 opacity-60"
                                          title="Không thể hủy tour vào ngày khởi hành hoặc sau đó"
                                        >
                                          ✕ Hủy Tour
                                        </button>
                                      );
                                    }

                                    return (
                                      <button
                                        onClick={() => handleCancelBooking(b)}
                                        className="px-3.5 py-1.5 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center gap-1.5 active:scale-95 border border-rose-100/50 shadow-sm"
                                      >
                                        ✕ Hủy Tour
                                      </button>
                                    );
                                  })()}

                                  {scheduleTab === "in_progress" && (
                                    <button
                                      disabled
                                      className="px-3.5 py-1.5 text-xs font-black text-slate-400 bg-slate-100 rounded-xl border border-slate-200 cursor-not-allowed flex items-center gap-1.5 opacity-60"
                                      title="Hành trình đang diễn ra, không thể hủy"
                                    >
                                      ✕ Hủy Tour
                                    </button>
                                  )}

                                  {scheduleTab === "completed" && (
                                    <>
                                      {b.reviewed ? (
                                        <span className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-1">
                                          ✓ Đã đánh giá
                                        </span>
                                      ) : (
                                        <Link
                                          href={`/profile/bookings/${b.bookingId}?openReview=true`}
                                          className="px-4 py-1.5 text-xs font-black text-white bg-gradient-to-r from-[#0EA5E9] to-indigo-500 hover:from-sky-500 hover:to-indigo-600 rounded-xl transition shadow-md shadow-sky-100 flex items-center gap-1.5 active:scale-95 animate-pulse"
                                        >
                                          <Zap className="w-3.5 h-3.5 fill-white text-[#0EA5E9] shrink-0" />
                                          Đánh giá ngay (+50đ)
                                        </Link>
                                      )}
                                      <button
                                        disabled
                                        className="px-3.5 py-1.5 text-xs font-black text-slate-400 bg-slate-100 rounded-xl border border-slate-200 cursor-not-allowed flex items-center gap-1.5 opacity-60"
                                        title="Chuyến đi đã hoàn thành, không thể hủy"
                                      >
                                        ✕ Hủy Tour
                                      </button>
                                    </>
                                  )}

                                  {scheduleTab === "cancelled" && (
                                    <>
                                      {b.paymentStatus === "PAID" ? (
                                        <span className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5 fill-amber-500 text-white shrink-0" />
                                          Đang hoàn tiền
                                        </span>
                                      ) : (
                                        <span className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-1">
                                          <CheckCircle className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0" />
                                          Đã hoàn tiền
                                        </span>
                                      )}
                                      <button
                                        disabled
                                        className="px-3.5 py-1.5 text-xs font-black text-slate-400 bg-slate-100 rounded-xl border border-slate-200 cursor-not-allowed flex items-center gap-1.5 opacity-60"
                                        title="Đơn đặt tour đã bị hủy"
                                      >
                                        ✕ Hủy Tour
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* -- TAB: VOUCHERS (VÍ VOUCHER) -- */}
            {activeTab === "vouchers" && (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const processedVouchers = vouchers.map(v => {
                const isExpired = new Date(v.discount.endDate) < today;
                const hoursLeft = (new Date(v.discount.endDate).getTime() - Date.now()) / 3600000;
                const isExpiringSoon = !v.isUsed && !isExpired && hoursLeft <= 24;

                return { ...v, isExpired, isExpiringSoon };
              }).sort((a, b) => {
                const scoreA = (a.isUsed || a.isExpired) ? 1 : 0;
                const scoreB = (b.isUsed || b.isExpired) ? 1 : 0;
                if (scoreA !== scoreB) return scoreA - scoreB;

                const expA = a.isExpiringSoon ? 1 : 0;
                const expB = b.isExpiringSoon ? 1 : 0;
                return expB - expA;
              });

              // Copy helper component inside voucher tab context
              const VoucherCard = ({ v }: { v: any }) => {
                const [copied, setCopied] = useState(false);
                const handleCopy = () => {
                  navigator.clipboard.writeText(v.discount.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                };

                const cardBg = v.isUsed || v.isExpired
                  ? "grayscale bg-slate-50/10 border-slate-200/40 opacity-75"
                  : v.isExpiringSoon
                    ? "border-rose-400/40"
                    : "border-indigo-400/30";

                const glassStyle = v.isUsed || v.isExpired
                  ? { background: "linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(203, 213, 225, 0.1) 100%)", backdropFilter: "blur(12px)" }
                  : v.isExpiringSoon
                    ? { background: "linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)", backdropFilter: "blur(12px)" }
                    : { background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(168, 85, 247, 0.15) 100%)", backdropFilter: "blur(12px)" };

                return (
                  <div
                    className={`relative rounded-3xl p-6 flex flex-col justify-between min-h-[160px] border shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden ${cardBg}`}
                    style={glassStyle}
                  >
                    {/* Glassmorphic ticket cutout circles */}
                    <div className="absolute top-1/2 -left-3.5 w-7 h-7 rounded-full bg-[#F5F8F8] -translate-y-1/2 shadow-inner border-r border-slate-100"></div>
                    <div className="absolute top-1/2 -right-3.5 w-7 h-7 rounded-full bg-[#F5F8F8] -translate-y-1/2 shadow-inner border-l border-slate-100"></div>

                    {/* Dotted cutting line */}
                    <div className="absolute top-1/2 left-3.5 right-3.5 h-0 border-t-2 border-dashed border-slate-200/50 -translate-y-1/2 pointer-events-none"></div>

                    {/* Top Section */}
                    <div className="relative z-10 pb-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Mã giảm giá</span>
                          <h3 className="font-extrabold text-slate-800 text-lg leading-tight uppercase">{v.discount.name}</h3>
                        </div>
                        <div className="shrink-0 text-right">
                          {v.isUsed ? (
                            <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">Đã dùng</span>
                          ) : v.isExpired ? (
                            <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">Hết hạn</span>
                          ) : v.isExpiringSoon ? (
                            <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase animate-pulse">Sắp hết hạn</span>
                          ) : (
                            <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase">Khả dụng</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-snug">{v.discount.description}</p>
                    </div>

                    {/* Bottom Section */}
                    <div className="relative z-10 pt-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Hạn dùng</div>
                        <div className="text-xs text-slate-700 font-extrabold">{new Date(v.discount.endDate).toLocaleDateString("vi-VN")}</div>
                      </div>

                      {!(v.isUsed || v.isExpired) && (
                        <button
                          onClick={handleCopy}
                          className={`px-4 py-1.5 text-xs font-black rounded-xl border transition-all active:scale-95 shrink-0 ${copied
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : v.isExpiringSoon
                                ? "bg-rose-500 border-rose-500 text-white hover:bg-rose-600"
                                : "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                            }`}
                        >
                          {copied ? "Đã chép! ✓" : v.discount.code}
                        </button>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                    Ví Voucher của bạn
                  </h2>

                  {processedVouchers.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 text-xs font-bold uppercase tracking-wider">
                      Ví voucher hiện tại đang trống.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {processedVouchers.map(v => (
                        <VoucherCard key={v.id} v={v} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* -- TAB: FAVOURITES -- */}
            {activeTab === "favourites" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                    Tour bạn đã lưu ({favTours.length})
                  </h2>
                </div>

                {favTours.length === 0 ? (
                  <div className="bg-white text-center py-16 text-gray-500 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-4xl mb-3 opacity-50">🤍</div>
                    Danh sách yêu thích của bạn đang trống.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favTours.map(tour => (
                      <div key={tour.id} className="relative">
                        <TourCard tour={tour} />
                        <button
                          onClick={() => handleRemoveFav(tour.id)}
                          className="absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition"
                          title="Bỏ yêu thích"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />

      {/* Custom Cancel Confirmation Modal */}
      {cancelModalOpen && bookingToCancel && (() => {
        const isPending = bookingToCancel.status === "PENDING";

        let title = "Xác nhận hủy đặt tour";
        let description = "Bạn có chắc chắn muốn hủy đơn đặt tour này không? Slot giữ chỗ sẽ được hoàn lại và không thể hoàn tác.";
        let buttonText = "Hủy đặt tour";
        let cannotCancel = false;

        if (!isPending) {
          const start = new Date(bookingToCancel.startDate || bookingToCancel.bookingDate);
          const today = new Date();
          start.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const diffTime = start.getTime() - today.getTime();
          const daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let penaltyPercentage = 0.0;
          let ruleText = "";

          if (daysBetween <= 0) {
            title = "Không thể hủy tour";
            description = "Chuyến đi khởi hành vào hôm nay hoặc đã diễn ra. Theo chính sách của iTour, bạn không thể hủy tour vào ngày khởi hành hoặc sau đó!";
            buttonText = "Đóng";
            cannotCancel = true;
          } else {
            if (daysBetween >= 1 && daysBetween <= 3) {
              penaltyPercentage = 1.0;
              ruleText = "hủy trước từ 1 đến 3 ngày, mức phí phạt là 100%";
            } else if (daysBetween >= 4 && daysBetween <= 7) {
              penaltyPercentage = 0.9;
              ruleText = "hủy trước từ 4 đến 7 ngày, mức phí phạt là 90%";
            } else if (daysBetween >= 8 && daysBetween <= 15) {
              penaltyPercentage = 0.6;
              ruleText = "hủy trước từ 8 đến 15 ngày, mức phí phạt là 60%";
            } else if (daysBetween >= 16 && daysBetween <= 29) {
              penaltyPercentage = 0.3;
              ruleText = "hủy trước từ 16 đến 29 ngày, mức phí phạt là 30%";
            } else if (daysBetween >= 30 && daysBetween <= 45) {
              penaltyPercentage = 0.1;
              ruleText = "hủy trước từ 30 đến 45 ngày, mức phí phạt là 10%";
            } else {
              penaltyPercentage = 0.0;
              ruleText = "hủy trước trên 45 ngày, bạn được miễn phí hủy (phí phạt 0%)";
            }

            const finalPrice = bookingToCancel.finalPrice || 0;
            const refundAmount = finalPrice * (1.0 - penaltyPercentage);
            description = `Theo chính sách, bạn hủy trước ${daysBetween} ngày, ${ruleText}. Số tiền bạn được hoàn lại vào ví MoMo là: ${refundAmount.toLocaleString("vi-VN")}đ. Bạn có chắc chắn muốn hủy?`;
            buttonText = "Đồng ý, hủy tour";
          }
        } else {
          description = "Đơn đặt tour này chưa thanh toán. Bạn có chắc chắn muốn hủy đặt tour này không? Slot giữ chỗ sẽ được hoàn trả và không mất phí phạt nào.";
        }

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100/80 animate-in zoom-in-95 duration-200 text-center">
              <div className={`w-12 h-12 ${cannotCancel ? "bg-amber-50 text-amber-500 border-amber-100" : "bg-rose-50 text-rose-500 border-rose-100"} rounded-full flex items-center justify-center mx-auto mb-4 border`}>
                <span className="text-xl">{cannotCancel ? "⚠️" : "⚠️"}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {description}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCancelModalOpen(false);
                    setBookingIdToCancel(null);
                    setBookingToCancel(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all active:scale-[0.98]"
                >
                  {cannotCancel ? "Quay lại" : "Không, giữ lại"}
                </button>
                {!cannotCancel && (
                  <button
                    onClick={confirmCancelBooking}
                    disabled={isCancelling || isBlocked}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-rose-100 flex items-center justify-center gap-1.5"
                  >
                    {isCancelling ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      buttonText
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
