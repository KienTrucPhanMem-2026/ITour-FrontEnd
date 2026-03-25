"use client";

import { useState } from "react";
import Link from "next/link";
import { mockTours } from "@/lib/mockData";
import { useParams } from "next/navigation";

export default function TourDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const tour = mockTours.find((t) => t.slug === slug);
  const [selectedImage, setSelectedImage] = useState(0);
  const [participants, setParticipants] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tour không tìm thấy</h1>
          <Link href="/tours" className="text-[#0EA5E9] hover:underline">
            Quay lại danh sách tour
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = tour.price * participants;

  const handleBooking = () => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    // Navigate to payment page with booking details
    const params = new URLSearchParams({
      tourSlug: slug,
      date: selectedDate,
      participants: participants.toString(),
    });
    window.location.href = `/payment?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F8F8]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#0EA5E9] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Du Lịch Việt</span>
          </Link>

          <Link
            href="/tours"
            className="text-sm font-semibold text-[#0EA5E9] hover:underline"
          >
            ← Quay lại
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* ── Hero Image Section ── */}
        <div className="mb-8">
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-gray-200 mb-6">
            <img
              src={tour.images[selectedImage]}
              alt={tour.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail images */}
          <div className="flex gap-3 overflow-auto pb-2">
            {tour.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  selectedImage === idx
                    ? "border-[#0EA5E9]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img
                  src={img}
                  alt={`Ảnh ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── Title & Price Header ── */}
        <div className="bg-white rounded-2xl p-8 mb-12 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {tour.title}
              </h1>

              <div className="flex items-center gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(tour.rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {tour.rating}/5
                  </span>
                </div>
                <span className="text-gray-600">({tour.reviews} đánh giá)</span>
              </div>

              <p className="text-gray-700 mb-4">{tour.fullDescription}</p>

              <div className="flex items-center gap-1 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {tour.location}
              </div>
            </div>

            {/* ── Price & Quick Info ── */}
            <div className="lg:col-span-1">
              <div className="text-center p-6 bg-gradient-to-br from-[#E0F7F0] to-[#F0FFFE] rounded-xl border border-[#00D084]">
                <div className="text-sm text-gray-600 mb-2">Giá từ</div>
                <div className="text-4xl font-bold text-[#00D084] mb-4">
                  {(tour.price / 1000000).toFixed(1)}M₫
                </div>
                <div className="text-sm text-gray-700 font-semibold mb-4">
                  / người
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <span className="font-semibold">{tour.duration}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {tour.location}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Content ─ 2 cols ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Highlights */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Điểm Nổi Bật
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tour.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-[#00D084] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Itinerary */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Lịch Trình Chi Tiết
              </h2>
              <div className="space-y-3">
                {tour.itinerary.map((day) => (
                  <div key={day.day} className="overflow-hidden rounded-xl border border-gray-200">
                    <button
                      onClick={() =>
                        setExpandedDay(expandedDay === day.day ? null : day.day)
                      }
                      className="w-full flex items-center justify-between bg-white px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 text-left flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E0F7F0] text-[#00D084] font-bold text-sm flex-shrink-0">
                          {day.day}
                        </div>
                        <h3 className="font-bold text-gray-900">
                          Ngày {day.day}: {day.title}
                        </h3>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                          expandedDay === day.day ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </button>

                    {expandedDay === day.day && (
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <p className="text-gray-700 mb-4">{day.description}</p>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-semibold text-gray-900">📍 Hoạt Động</p>
                            <ul className="text-gray-600 mt-2 space-y-1">
                              {day.activities.map((act, idx) => (
                                <li key={idx}>• {act}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">🍽️ Ăn Uống</p>
                            <p className="text-gray-600 mt-2">{day.meals.join(", ")}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">🏨 Chỗ Ở</p>
                            <p className="text-gray-600 mt-2">{day.accommodation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Included & Excluded */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-[#00D084]">✓</span> Bao Gồm
                </h3>
                <ul className="space-y-2">
                  {tour.includes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-[#00D084] flex-shrink-0 font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-gray-400">✕</span> Không Bao Gồm
                </h3>
                <ul className="space-y-2">
                  {tour.excludes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-gray-400 flex-shrink-0 font-bold">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Đánh Giá Khách Hàng
              </h2>
              <div className="space-y-4">
                {[
                  {
                    name: "Hoàng Nam",
                    rating: 5,
                    comment: "Chuyến du lịch tuyệt vời, hướng dẫn viên rất nhiệt tình và chuyên nghiệp. Du thuyền thoải mái, thức ăn ngon. Rất hài lòng với dịch vụ!",
                    time: "2 ngày trước",
                  },
                  {
                    name: "Trần Thu Hà",
                    rating: 5,
                    comment: "Cảnh đẹp tuyệt cú mèo! Các hoạt động được sắp xếp khôn ngoan, không quá tải.",
                    time: "1 tuần trước",
                  },
                  {
                    name: "Nguyễn Văn B",
                    rating: 4,
                    comment: "Tốt nhưng có thể cải thiện thêm về bữa sáng. Nhìn chung là một trải nghiệm tốt!",
                    time: "2 tuần trước",
                  },
                ].map((review, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] flex items-center justify-center text-white font-bold">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{review.name}</p>
                          <p className="text-xs text-gray-500">{review.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Sidebar: Booking Card ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              {/* Price section - prominent */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Giá bắt đầu từ</div>
                <div className="text-4xl font-bold text-[#00D084] mb-1">
                  {(tour.price / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-500">₫ / người</div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="text-center p-3 bg-[#E0F7F0] rounded-xl">
                  <div className="text-xs text-[#00A87E] font-semibold mb-1">THỜI GIAN</div>
                  <div className="text-sm font-bold text-gray-900">{tour.duration}</div>
                </div>
                <div className="text-center p-3 bg-[#FFF0E5] rounded-xl">
                  <div className="text-xs text-orange-600 font-semibold mb-1">ĐỊA ĐIỂM</div>
                  <div className="text-sm font-bold text-gray-900 truncate">{tour.location}</div>
                </div>
              </div>

              {/* Rating badge */}
              <div className="flex items-center justify-between mb-6 p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(tour.rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">{tour.rating}/5</span>
              </div>

              {/* Booking form */}
              <div className="space-y-4 mb-4">
                {/* Date selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ngày Khởi Hành
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-sm"
                  >
                    <option value="">Chọn ngày</option>
                    {tour.availableDates.map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString("vi-VN")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Participants */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Số Người ({tour.minPeople}-{tour.maxPeople})
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setParticipants(Math.max(tour.minPeople, participants - 1))
                      }
                      className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={participants}
                      onChange={(e) =>
                        setParticipants(
                          Math.min(
                            tour.maxPeople,
                            Math.max(tour.minPeople, parseInt(e.target.value) || tour.minPeople)
                          )
                        )
                      }
                      className="flex-1 text-center py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                    />
                    <button
                      onClick={() =>
                        setParticipants(Math.min(tour.maxPeople, participants + 1))
                      }
                      className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total price */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600">Tổng Cộng ({participants} người)</div>
                  <div className="text-2xl font-bold text-[#00D084]">
                    {(totalPrice / 1000000).toFixed(1)}M₫
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <button
                onClick={handleBooking}
                disabled={!selectedDate}
                className="w-full py-3 bg-[#00D084] hover:bg-[#00B86F] disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed mb-3"
              >
                Đặt Ngay
              </button>
              <button className="w-full py-3 border border-[#0EA5E9] text-[#0EA5E9] font-bold rounded-lg hover:bg-blue-50 transition-colors">
                ♡ Yêu Thích
              </button>

              {/* Info section */}
              <div className="mt-6 space-y-3 text-sm border-t border-gray-200 pt-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0EA5E9] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                  </svg>
                  <span className="text-gray-600">Hủy tour miễn phí trước 7 ngày</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0EA5E9] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Hướng dẫn viên tiếng nước ngoài</span>
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
