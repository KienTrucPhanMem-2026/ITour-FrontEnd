"use client";

import { useState } from "react";
import Link from "next/link";
import { mockTours } from "@/lib/mockData";
import TourCard from "@/components/TourCard";

export default function ToursPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating">(
    "rating"
  );

  // Filter by category
  const filteredTours = selectedCategory
    ? mockTours.filter((tour) => tour.category === selectedCategory)
    : mockTours;

  // Sort tours
  const sortedTours = [...filteredTours].sort((a, b) => {
    if (sortBy === "price-asc") {
      return a.price - b.price;
    } else if (sortBy === "price-desc") {
      return b.price - a.price;
    } else {
      return b.rating - a.rating;
    }
  });

  const categories = [
    { id: null, name: "Tất cả", label: "Tất cả" },
    { id: "beach", name: "Biển", label: "Biển" },
    { id: "mountain", name: "Núi", label: "Núi" },
    { id: "city", name: "Thành phố", label: "Thành phố" },
    { id: "cultural", name: "Văn hóa", label: "Văn hóa" },
  ];

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

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-[#0EA5E9]">
              Trang chủ
            </Link>
            <Link href="/tours" className="text-[#0EA5E9]">
              Tour du lịch
            </Link>
            <a href="#" className="hover:text-[#0EA5E9]">
              Khách sạn
            </a>
            <a href="#" className="hover:text-[#0EA5E9]">
              Tin tức
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-[#0EA5E9]">
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#0EA5E9] text-white rounded-full text-sm font-semibold hover:bg-[#0284C7]"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page Header ── */}
      <section className="bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Danh Sách Tour Du Lịch</h1>
          <p className="text-blue-100">
            Tìm kiếm từ {mockTours.length} tour du lịch nổi bật
          </p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── Sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              {/* Category filter */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Loại Tour
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === cat.id ? null : cat.id
                        )
                      }
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-[#0EA5E9] text-white font-semibold"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort filter */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Sắp xếp
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "price-asc" | "price-desc" | "rating"
                    )
                  }
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
                {sortedTours.length} Tour
              </h2>
            </div>

            {sortedTours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sortedTours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  Không tìm thấy tour nào phù hợp với tiêu chí của bạn.
                </p>
              </div>
            )}
          </main>
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
