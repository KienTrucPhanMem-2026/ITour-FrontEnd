"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import ProfileBookingCard from "@/components/ProfileBookingCard";
import { getStoredUser, setStoredUser, clearStoredUser } from "@/lib/auth";
import { getUserProfileAPI, updateUserProfileAPI } from "@/lib/api/users";
import { getMyBookingsAPI, cancelBookingAPI } from "@/lib/api/bookings";
import { getFavouriteToursAPI, removeFavouriteAPI } from "@/lib/api/favourites";
import type { UserProfile, BookingResponseDTO, TourDTO, UpdateProfileRequest } from "@/types/api";

type TabType = "info" | "bookings" | "favourites";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [favTours, setFavTours] = useState<TourDTO[]>([]);

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

  const loadAllData = async (userId: string) => {
    setIsLoading(true);
    try {
      const [pData, bData, fData] = await Promise.all([
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
          dateOfBirth: pData.dateOfBirth || ""
        });
      }
      setBookings(bData || []);
      setFavTours(fData || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      alert("Não thể tải dữ liệu hồ sơ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đặt tour này không?")) return;
    try {
      await cancelBookingAPI(bookingId);
      // Reload bookings list
      if (profile) {
        const bData = await getMyBookingsAPI(profile.id);
        setBookings(bData);
        // reload profile to update points if reversed
        const pData = await getUserProfileAPI(profile.id);
        setProfile(pData);
      }
      alert("Đã hủy booking thành công.");
    } catch (err: any) {
      alert(err.message || "Không thể hủy đơn này.");
    }
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
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-col gap-1 sticky top-24">
              <button 
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${activeTab === 'info' ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                👤 Thông tin tài khoản
              </button>
              <button 
                onClick={() => setActiveTab("bookings")}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${activeTab === 'bookings' ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                📄 Lịch sử đặt tour
              </button>
              <button 
                onClick={() => setActiveTab("favourites")}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${activeTab === 'favourites' ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                ❤️ Tour đã yêu thích
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
                    <input type="text" disabled value={profile.userName} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed"/>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email</label>
                    <input type="email" disabled value={profile.email} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed"/>
                  </div>

                  <div className="md:col-span-2 h-px bg-gray-100 my-2"></div>
                  <div className="md:col-span-2 text-xs text-gray-400 font-medium uppercase tracking-widest mb-[-12px]">Thông tin có thể thay đổi</div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Họ và tên</label>
                    <input 
                      type="text" 
                      required
                      value={updateForm.fullName} 
                      onChange={e => setUpdateForm({...updateForm, fullName: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Số điện thoại</label>
                    <input 
                      type="tel" 
                      value={updateForm.phone} 
                      onChange={e => setUpdateForm({...updateForm, phone: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Ngày sinh</label>
                    <input 
                      type="date" 
                      value={updateForm.dateOfBirth} 
                      onChange={e => setUpdateForm({...updateForm, dateOfBirth: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Địa chỉ</label>
                    <input 
                      type="text" 
                      value={updateForm.address} 
                      onChange={e => setUpdateForm({...updateForm, address: e.target.value})}
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

            {/* -- TAB: BOOKINGS -- */}
            {activeTab === "bookings" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                  Lịch sử đặt tour ({bookings.length})
                </h2>

                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Bạn chưa thực hiện đơn đặt tour nào.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {bookings.map(b => (
                      <ProfileBookingCard 
                        key={b.bookingId} 
                        booking={b} 
                        onCancel={handleCancelBooking} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

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
    </div>
  );
}
