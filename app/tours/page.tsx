"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getToursAPI } from "@/lib/api/tours";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { logoutAPI } from "@/lib/api/auth";
import type { TourDTO, UserProfile } from "@/types/api";
import TourCard from "@/components/TourCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import { useSearchParams } from "next/navigation";
import { isDomesticTour } from "@/lib/tourHelpers";

const TOUR_TYPE_LABELS: Record<string, string> = {
  BEACH: "Biển",
  MOUNTAIN: "Núi",
  CITY: "Thành phố",
  CULTURAL: "Văn hóa",
  ADVENTURE: "Phiêu lưu",
  ECO: "Sinh thái",
};

const VEHICLE_LABELS: Record<string, string> = {
  BUS: "Xe bus",
  CAR: "Ô tô",
  PLANE: "Máy bay",
  TRAIN: "Tàu hỏa",
  BOAT: "Tàu du lịch",
};

// Price range helper
function getPriceRange(range: string | null): [number, number] {
  switch (range) {
    case "under-5": return [0, 5000000];
    case "5-10": return [5000000, 10000000];
    case "10-20": return [10000000, 20000000];
    case "over-20": return [20000000, 500000000];
    default: return [0, 500000000];
  }
}


export default function ToursPage() {
  const [allTours, setAllTours] = useState<TourDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const searchParams = useSearchParams();
  const [selectedGeo, setSelectedGeo] = useState<"all" | "domestic" | "international">("all");

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [startDateFrom, setStartDateFrom] = useState<string>("");
  const [startDateTo, setStartDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating" | "available">("rating");

  useEffect(() => {
    setCurrentUser(getStoredUser());
    fetchTours();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam === "domestic") {
      setSelectedGeo("domestic");
    } else if (categoryParam === "international") {
      setSelectedGeo("international");
    } else {
      setSelectedGeo("all");
    }
  }, [searchParams]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getToursAPI();
      setAllTours(data);
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

  // Get unique values for filters
  const tourTypes = useMemo(() =>
    Array.from(new Set(allTours.map(t => t.tourType).filter(Boolean))) as string[],
    [allTours]
  );

  const destinations = useMemo(() =>
    Array.from(new Set(allTours.map(t => t.startDestinationName).filter(Boolean))) as string[],
    [allTours]
  );

  const vehicleTypes = useMemo(() =>
    Array.from(new Set(allTours.map(t => t.vehicleType).filter(Boolean))) as string[],
    [allTours]
  );

  // Filter & Sort logic
  const filtered = useMemo(() => {
    const [minPrice, maxPrice] = getPriceRange(priceRange);

    return allTours.filter(tour => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      if (searchTerm && !(
        tour.name?.toLowerCase().includes(searchLower) ||
        tour.startDestinationName?.toLowerCase().includes(searchLower) ||
        tour.endDestinationName?.toLowerCase().includes(searchLower)
      )) {
        return false;
      }

      // Tour type
      if (selectedType && tour.tourType !== selectedType) {
        return false;
      }

      // Geographic category
      if (selectedGeo === "domestic" && !isDomesticTour(tour)) {
        return false;
      }
      if (selectedGeo === "international" && isDomesticTour(tour)) {
        return false;
      }

      // Price range
      if (tour.price && (tour.price < minPrice || tour.price > maxPrice)) {
        return false;
      }

      // Destination
      if (selectedDestination && tour.startDestinationName !== selectedDestination) {
        return false;
      }

      // Vehicle
      if (selectedVehicle && tour.vehicleType !== selectedVehicle) {
        return false;
      }

      // Date range
      if (startDateFrom && tour.startDate && new Date(tour.startDate) < new Date(startDateFrom)) {
        return false;
      }
      if (startDateTo && tour.startDate && new Date(tour.startDate) > new Date(startDateTo)) {
        return false;
      }

      return true;
    });
  }, [allTours, searchTerm, selectedType, priceRange, selectedDestination, selectedVehicle, startDateFrom, startDateTo, selectedGeo]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortBy === "price-asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sortBy === "price-desc") return (b.price ?? 0) - (a.price ?? 0);
      if (sortBy === "available") return (b.availableSlots ?? 0) - (a.availableSlots ?? 0);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
    return copy;
  }, [filtered, sortBy]);

  return (
    <div className="min-h-screen bg-[#F5F8F8]">
      {/* ── Header ── */}
      <Header></Header>

      {/* ── Search Section ── */}
      <section className="relative bg-slate-900 py-20 overflow-hidden">
        {/* Background Decor - Tạo hiệu ứng chiều sâu */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge nhỏ phía trên */}
       

          <div className="flex flex-col items-center text-center justify-center mb-8">

            {/* Badge */}
            <span className="inline-block px-4 py-1 mb-6 text-[10px] font-bold tracking-[0.2em] text-sky-400 uppercase border border-sky-400/30 rounded-full bg-sky-400/5">
              Khám phá thế giới
            </span>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
              Tìm kiếm <span className="text-sky-400">hành trình</span> của bạn
            </h1>

            {/* Paragraph: mx-auto rất quan trọng ở đây vì có max-w-lg */}
            <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto mb-10 font-medium">
              Hơn 500+ tour du lịch khắp Việt Nam đang chờ đón bạn khám phá với ưu đãi tốt nhất.
            </p>

            {/* Search box: Đảm bảo độ rộng hợp lý */}
            <div className="w-full max-w-2xl">
              <SearchBar
                placeholder="Bạn muốn đến đâu hôm nay?"
                onSearch={(value) => setSearchTerm(value)}
                variant="glass"
              />
            </div>
          </div>
          {/* Result Counter - Tinh tế hơn */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {loading ? (
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Kết quả: <span className="text-white">{sorted.length} tour</span> có sẵn
              </p>
            )}
          </div>
        </div>

      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {error ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😞</div>
            <p className="text-gray-600 text-lg mb-4">{error}</p>
            <button onClick={fetchTours}
              className="px-6 py-3 bg-[#0EA5E9] text-white rounded-full font-semibold hover:bg-[#0284C7]">
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* ── Sidebar Filter ── */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-6 sticky top-24">

                {/* Phân loại địa lý */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Phân loại địa lý</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Tất cả", value: "all" as const },
                      { label: "Trong nước", value: "domestic" as const },
                      { label: "Nước ngoài", value: "international" as const },
                    ].map(geo => {
                      const count = allTours.filter(t => {
                        if (geo.value === "all") return true;
                        if (geo.value === "domestic") return isDomesticTour(t);
                        return !isDomesticTour(t);
                      }).length;
                      return (
                        <button
                          key={geo.value}
                          onClick={() => setSelectedGeo(geo.value)}
                          className={`px-3 py-1.5 text-xs rounded-full transition ${selectedGeo === geo.value
                            ? "bg-sky-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}>
                          {geo.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tour Type */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Loại tour</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedType(null)}
                      className={`px-3 py-1.5 text-xs rounded-full transition ${selectedType === null
                        ? "bg-sky-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}>
                      Tất cả ({allTours.length})
                    </button>

                    {tourTypes.map(type => {
                      const count = allTours.filter(t => t.tourType === type).length;
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedType(selectedType === type ? null : type)}
                          className={`px-3 py-1.5 text-xs rounded-full transition ${selectedType === type
                            ? "bg-sky-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}>
                          {TOUR_TYPE_LABELS[type] ?? type} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Ngân sách</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Tất cả", value: null },
                      { label: "Dưới 5tr", value: "under-5" },
                      { label: "5 - 10tr", value: "5-10" },
                      { label: "10 - 20tr", value: "10-20" },
                      { label: "20tr+", value: "over-20" },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => setPriceRange(item.value as any)}
                        className={`px-3 py-1.5 text-xs rounded-full transition ${priceRange === item.value
                          ? "bg-sky-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destination */}
                {destinations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Điểm khởi hành</h3>
                    <select
                      value={selectedDestination ?? ""}
                      onChange={(e) => setSelectedDestination(e.target.value || null)}
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none">
                      <option value="">Tất cả</option>
                      {destinations.map(dest => (
                        <option key={dest} value={dest}>{dest}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Vehicle */}
                {vehicleTypes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Phương tiện</h3>
                    <select
                      value={selectedVehicle ?? ""}
                      onChange={(e) => setSelectedVehicle(e.target.value || null)}
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none">
                      <option value="">Tất cả</option>
                      {vehicleTypes.map(vehicle => (
                        <option key={vehicle} value={vehicle}>
                          {VEHICLE_LABELS[vehicle] ?? vehicle}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Ngày đi</h3>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDateFrom}
                      onChange={(e) => setStartDateFrom(e.target.value)}
                      className="w-full text-sm px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                    {/* <input
                      type="date"
                      value={startDateTo}
                      onChange={(e) => setStartDateTo(e.target.value)}
                      className="w-full text-sm px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    /> */}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Sắp xếp</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none">
                    <option value="rating">Đánh giá cao</option>
                    <option value="price-asc">Giá thấp</option>
                    <option value="price-desc">Giá cao</option>
                    <option value="available">Còn chỗ</option>
                  </select>
                </div>

                {/* Reset */}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType(null);
                    setPriceRange(null);
                    setSelectedDestination(null);
                    setSelectedVehicle(null);
                    setStartDateFrom("");
                    setStartDateTo("");
                    setSortBy("rating");
                    setSelectedGeo("all");
                  }}
                  className="w-full text-sm py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  Xóa bộ lọc
                </button>

              </div>
            </aside>

            {/* ── Tours Grid ── */}
            <main className="lg:col-span-3">
              {loading ? (
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
                  {sorted.map(tour => <TourCard key={tour.id} tour={tour} />)}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 text-lg">
                    Không tìm thấy tour nào phù hợp với bộ lọc của bạn.
                  </p>
                  <button onClick={() => {
                    setSearchTerm("");
                    setSelectedType(null);
                    setPriceRange(null);
                    setSelectedDestination(null);
                    setSelectedVehicle(null);
                    setStartDateFrom("");
                    setStartDateTo("");
                    setSortBy("rating");
                    setSelectedGeo("all");
                  }}
                    className="mt-6 px-6 py-2 bg-[#0EA5E9] text-white rounded-full font-semibold hover:bg-[#0284C7]">
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <Footer></Footer>
    </div>
  );
}
