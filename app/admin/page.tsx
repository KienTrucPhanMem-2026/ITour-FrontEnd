"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mockTours, mockBookings, mockAdminAccounts } from "@/lib/mockData";

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "tours" | "bookings" | "users">(
    "dashboard"
  );
  const [showNewTourForm, setShowNewTourForm] = useState(false);
  const [tours, setTours] = useState(mockTours);
  const [bookings, setBookings] = useState(mockBookings);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const authToken = localStorage.getItem("authToken");

    if (!user || !authToken) {
      router.push("/admin/login");
      return;
    }

    const userData = JSON.parse(user);
    
    // Check if user is admin
    const isAdmin = mockAdminAccounts.some(
      (acc) => acc.user.email === userData.email
    );

    if (!isAdmin) {
      router.push("/");
      return;
    }

    setCurrentUser(userData);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    router.push("/admin/login");
  };

  const handleDeleteTour = (id: string) => {
    if (confirm("Bạn chắc chắn muốn xóa tour này?")) {
      setTours(tours.filter((t) => t.id !== id));
    }
  };

  const handleDeleteBooking = (id: string) => {
    if (confirm("Bạn chắc chắn muốn hủy đơn đặt tour này?")) {
      setBookings(
        bookings.map((b) =>
          b.id === id ? { ...b, status: "cancelled" } : b
        )
      );
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500">Du Lịch Việt Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              👤 {currentUser.name}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Đăng Xuất
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {[
            { id: "dashboard", label: "📊 Dashboard" },
            { id: "tours", label: "✈️ Quản Lý Tour" },
            { id: "bookings", label: "📋 Đặt Tour" },
            { id: "users", label: "👥 Người Dùng" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#0EA5E9] text-[#0EA5E9]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Tổng Quan Hệ Thống
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  label: "Tổng Tour",
                  value: tours.length,
                  icon: "✈️",
                  color: "bg-blue-100 text-blue-600",
                },
                {
                  label: "Đơn Đặt Tour",
                  value: bookings.length,
                  icon: "📋",
                  color: "bg-green-100 text-green-600",
                },
                {
                  label: "Doanh Thu",
                  value: `${(
                    bookings.reduce((acc, b) => acc + b.totalPrice, 0) /
                    1000000
                  ).toFixed(0)}M₫`,
                  icon: "💰",
                  color: "bg-yellow-100 text-yellow-600",
                },
                {
                  label: "Khách Hài Lòng",
                  value: "98%",
                  icon: "⭐",
                  color: "bg-purple-100 text-purple-600",
                },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-14 h-14 rounded-full ${stat.color} flex items-center justify-center text-2xl`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Đơn Đặt Tour Gần Đây
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Mã Đơn
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Tour
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Khách
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Trạng Thái
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                          {booking.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.tourTitle}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {booking.participants} người
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {(booking.totalPrice / 1000000).toFixed(1)}M₫
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {booking.status === "confirmed"
                              ? "✓ Xác nhận"
                              : booking.status === "pending"
                              ? "⏳ Chờ"
                              : "✕ Hủy"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tours Management Tab */}
        {activeTab === "tours" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Quản Lý Tour ({tours.length})
              </h2>
              <button
                onClick={() => setShowNewTourForm(!showNewTourForm)}
                className="px-6 py-2 bg-[#0EA5E9] hover:bg-[#0185B8] text-white font-semibold rounded-lg transition-colors"
              >
                ➕ Thêm Tour
              </button>
            </div>

            {showNewTourForm && (
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3">Thêm Tour Mới</h3>
                <p className="text-sm text-gray-600">
                  Tính năng thêm tour sẽ được kích hoạt sau khi backend được
                  cài đặt hoàn tất. Hiện tại đang sử dụng dữ liệu mẫu.
                </p>
              </div>
            )}

            {/* Tours Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <div key={tour.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2">
                      {tour.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>📍 {tour.location}</p>
                      <p>⏱️ {tour.duration}</p>
                      <p className="font-semibold text-[#0EA5E9]">
                        {(tour.price / 1000000).toFixed(1)}M₫
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-sm font-semibold">
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteTour(tour.id)}
                        className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm font-semibold"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Management Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Quản Lý Đặt Tour ({bookings.length})
            </h2>

            <div className="bg-white rounded-xl shadow overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Mã Đơn
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Tour
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Khách
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Ngày
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Giá
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Trạng Thái
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                        {booking.id.slice(0, 12)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.tourTitle}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {booking.participants}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(booking.checkIn).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {(booking.totalPrice / 1000000).toFixed(1)}M₫
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {booking.status === "confirmed"
                            ? "✓ Xác nhận"
                            : booking.status === "pending"
                            ? "⏳ Chờ"
                            : "✕ Hủy"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Hủy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Quản Lý Người Dùng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tài khoản người dùng</p>
                    <p className="text-2xl font-bold text-gray-900">2</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  demo@example.com, user@example.com
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                    👑
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tài khoản admin</p>
                    <p className="text-2xl font-bold text-gray-900">2</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  admin@dulichviet.com, editor@dulichviet.com
                </p>
              </div>
            </div>

            {/* Credentials Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="font-bold text-amber-900 mb-4">
                🔐 Thông Tin Đăng Nhập Test
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-amber-900">Admin Account:</p>
                  <p className="text-amber-800 font-mono">
                    admin@dulichviet.com / admin123
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-amber-900">User Account:</p>
                  <p className="text-amber-800 font-mono">
                    demo@example.com / 123456
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
