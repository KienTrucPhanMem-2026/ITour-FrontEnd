"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getToursAPI } from "@/lib/api/tours";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { logoutAPI } from "@/lib/api/auth";
import type { TourDTO, UserProfile } from "@/types/api";

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

/** Tạo slug từ tour name để dùng trong URL */
function makeSlug(tour: TourDTO): string {
  const namePart = (tour.name ?? "tour")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return namePart;
}

/** Format giá tour */
function formatPrice(price?: number): string {
  if (!price) return "Liên hệ";
  return `${(price / 1_000_000).toFixed(1)}M₫`;
}

/** Map tourType → label tiếng Việt */
const TOUR_TYPE_LABELS: Record<string, string> = {
  BEACH: "Biển",
  MOUNTAIN: "Núi",
  CITY: "Thành phố",
  CULTURAL: "Văn hóa",
  ADVENTURE: "Phiêu lưu",
  ECO: "Sinh thái",
};

// ────────────────────────────────────────────────
// TourCard
// ────────────────────────────────────────────────
function TourCard({ tour }: { tour: TourDTO }) {
  const slug = makeSlug(tour);
  const typeLabel = tour.tourType ? TOUR_TYPE_LABELS[tour.tourType] ?? tour.tourType : "Tour";

  return (
    <Link href={`/tours/${slug}?id=${tour.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:-translate-y-1">
        {/* Image placeholder */}
        <div className="relative h-48 bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] flex items-center justify-center">
          <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {tour.tourType && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0EA5E9] text-xs font-bold px-3 py-1 rounded-full">
              {typeLabel}
            </span>
          )}
          {tour.rating && (
            <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              ★ {tour.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-[#0EA5E9] transition-colors">
            {tour.name}
          </h3>

          {tour.description && (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{tour.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 flex-wrap">
            {tour.durationDays && (
              <span className="flex items-center gap-1">
                🕐 {tour.durationDays} ngày{tour.durationNights ? `/${tour.durationNights} đêm` : ""}
              </span>
            )}
            {tour.maximumSlots && (
              <span className="flex items-center gap-1">👥 Tối đa {tour.maximumSlots} người</span>
            )}
            {tour.startDate && (
              <span className="flex items-center gap-1">
                📅 {new Date(tour.startDate).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-[#00D084]">{formatPrice(tour.price)}</div>
              <div className="text-xs text-gray-400">/ người</div>
            </div>
            <span className="px-4 py-2 bg-[#0EA5E9] text-white text-sm font-semibold rounded-full hover:bg-[#0284C7] transition-colors">
              Xem chi tiết
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────
export default function ToursPage() {
  const [tours, setTours] = useState<TourDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating">("rating");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getToursAPI();
      setTours(data);
    } catch (err) {
      console.error("Failed to fetch tours:", err);
      setError("Không thể tải danh sách tour. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } finally {
      clearStoredUser();
      window.location.href = "/login";
    }
  };

  // Filter
  const filtered = selectedType
    ? tours.filter((t) => t.tourType === selectedType)
    : tours;

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-asc") return (a.price ?? 0) - (b.price ?? 0);
    if (sortBy === "price-desc") return (b.price ?? 0) - (a.price ?? 0);
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

  // Unique tour types
  const tourTypes = Array.from(new Set(tours.map((t) => t.tourType).filter(Boolean))) as string[];

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

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-[#0EA5E9]">Trang chủ</Link>
            <Link href="/tours" className="text-[#0EA5E9]">Tour du lịch</Link>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <span className="text-sm text-gray-700 font-medium hidden md:block">
                  Xin chào, {currentUser.fullName || currentUser.userName}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-full hover:bg-gray-50"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-[#0EA5E9]">Đăng nhập</Link>
                <Link href="/register"
                  className="px-4 py-2 bg-[#0EA5E9] text-white rounded-full text-sm font-semibold hover:bg-[#0284C7]"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Page Header ── */}
      <section className="bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Danh Sách Tour Du Lịch</h1>
          <p className="text-blue-100">
            {loading ? "Đang tải..." : `Khám phá ${tours.length} tour du lịch hấp dẫn`}
          </p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {error ? (
          /* Error state */
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😞</div>
            <p className="text-gray-600 text-lg mb-4">{error}</p>
            <button
              onClick={fetchTours}
              className="px-6 py-3 bg-[#0EA5E9] text-white rounded-full font-semibold hover:bg-[#0284C7]"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* ── Sidebar ── */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                {/* Type filter */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Loại Tour</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedType(null)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedType === null
                          ? "bg-[#0EA5E9] text-white font-semibold"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Tất cả ({tours.length})
                    </button>
                    {tourTypes.map((type) => {
                      const label = TOUR_TYPE_LABELS[type] ?? type;
                      const count = tours.filter((t) => t.tourType === type).length;
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedType(selectedType === type ? null : type)}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                            selectedType === type
                              ? "bg-[#0EA5E9] text-white font-semibold"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Sắp xếp</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  >
                    <option value="rating">Đánh giá cao nhất</option>
                    <option value="price-asc">Giá thấp nhất</option>
                    <option value="price-desc">Giá cao nhất</option>
                  </select>
                </div>
              </div>
            </aside>

            {/* ── Tours Grid ── */}
            <main className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {loading ? "Đang tải tour..." : `${sorted.length} Tour`}
                </h2>
              </div>

              {loading ? (
                /* Loading skeleton */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                      <div className="h-48 bg-gray-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-8 bg-gray-200 rounded w-1/2 mt-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sorted.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {sorted.map((tour) => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-600 text-lg">
                    Không tìm thấy tour nào phù hợp.
                  </p>
                </div>
              )}
            </main>
          </div>
        )}
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
