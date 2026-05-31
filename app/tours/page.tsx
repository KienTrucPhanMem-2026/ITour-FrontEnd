"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getToursAPI } from "@/lib/api/tours";
import { getLocationsAPI, type LocationDTO } from "@/lib/api/locations";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { logoutAPI } from "@/lib/api/auth";
import type { TourDTO, UserProfile } from "@/types/api";
import TourCard from "@/components/TourCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import type { SearchSuggestion } from "@/components/SearchBar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { isDomesticTour } from "@/lib/tourHelpers";

const TOUR_TYPE_LABELS: Record<string, string> = {
  BEACH: "Biển",
  MOUNTAIN: "Núi",
  CITY: "Thành phố",
  CULTURAL: "Văn hóa",
  ADVENTURE: "Phiêu lưu",
  ECO: "Sinh thái",
  JOIN_IN: "Ghép đoàn",
  PRIVATE: "Tour riêng",
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


interface CollapsePanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsePanel({ title, isOpen, onToggle, children }: CollapsePanelProps) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-slate-800 hover:text-sky-600 transition text-left cursor-pointer"
      >
        <span>{title}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`transition-all duration-200 overflow-hidden ${
          isOpen ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ToursPageContent() {
  const [allTours, setAllTours] = useState<TourDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const searchParams = useSearchParams();
  const [selectedGeo, setSelectedGeo] = useState<"all" | "domestic" | "international">("all");

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    geo: true,      // Địa lý
    type: true,     // Loại tour
    price: false,   // Ngân sách
    location: false, // Địa điểm
    vehicle: false, // Phương tiện
    date: false,    // Ngày đi
    sort: false,    // Sắp xếp
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  // Location filter: phân cấp country → city
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // location id
  const [selectedCity, setSelectedCity] = useState<string | null>(null);       // location id
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [startDateFrom, setStartDateFrom] = useState<string>("");
  const [startDateTo, setStartDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating" | "available">("rating");
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Suggestions cho autocomplete search
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: SearchSuggestion[] = [];

    // Nhóm điểm khởi hành khớp từ khóa
    const destMap = new Map<string, number>();
    allTours.forEach((t) => {
      const dest = t.startDestinationName;
      if (dest?.toLowerCase().includes(q)) {
        destMap.set(dest, (destMap.get(dest) ?? 0) + 1);
      }
    });
    destMap.forEach((count, label) => {
      results.push({ type: "destination", label, count });
    });

    // Nhóm điểm đến khớp từ khóa (nếu khác điểm khởi hành)
    const endMap = new Map<string, number>();
    allTours.forEach((t) => {
      const dest = t.endDestinationName;
      if (dest?.toLowerCase().includes(q) && dest !== t.startDestinationName) {
        endMap.set(dest, (endMap.get(dest) ?? 0) + 1);
      }
    });
    endMap.forEach((count, label) => {
      results.push({ type: "destination", label, count });
    });

    // Tên tour khớp từ khóa (tối đa 5)
    allTours
      .filter((t) => t.name?.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((t) => {
        results.push({
          type: "tour",
          label: t.name ?? "",
          sublabel: [t.startDestinationName, t.endDestinationName]
            .filter(Boolean)
            .join(" → "),
        });
      });

    return results.slice(0, 10);
  }, [allTours, searchTerm]);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    fetchTours();
    getLocationsAPI().then(setLocations).catch(() => {});
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

    // Đọc từ khóa tìm kiếm được truyền từ Homepage
    const qParam = searchParams.get("q");
    if (qParam) {
      setSearchTerm(qParam);
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

  // Hierarchical location tree: chỉ lấy COUNTRY và CITY_PROVINCE, bỏ ATTRACTION
  const locationTree = useMemo(() => {
    const countries = locations.filter(l => l.type === "COUNTRY");
    const cities = locations.filter(l => l.type === "CITY_PROVINCE");
    return countries.map(country => ({
      ...country,
      cities: cities.filter(c => c.parentId === country.id),
    }));
  }, [locations]);

  // Collect all city/country names that appear in tours (start or end)
  const tourLocationNames = useMemo(() => {
    const names = new Set<string>();
    allTours.forEach(t => {
      if (t.startDestinationName) names.add(t.startDestinationName.toLowerCase());
      if (t.endDestinationName) names.add(t.endDestinationName.toLowerCase());
    });
    return names;
  }, [allTours]);

  const vehicleTypes = useMemo(() =>
    Array.from(new Set(allTours.map(t => t.vehicleType).filter(Boolean))) as string[],
    [allTours]
  );

  // Helper: đếm số tour khớp với 1 location node (country hoặc city)
  const countToursForLocation = (loc: LocationDTO, cities?: LocationDTO[]): number => {
    const matchNames = new Set<string>();
    matchNames.add(loc.name.toLowerCase());
    // Nếu là country, cộng thêm tất cả city con
    if (cities) cities.forEach(c => matchNames.add(c.name.toLowerCase()));
    return allTours.filter(t => {
      const start = t.startDestinationName?.toLowerCase() ?? "";
      const end = t.endDestinationName?.toLowerCase() ?? "";
      return matchNames.has(start) || matchNames.has(end);
    }).length;
  };

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

      // Location filter (phân cấp)
      if (selectedCity || selectedCountry) {
        // Ưu tiên city nếu đã chọn
        const activeLocId = selectedCity ?? selectedCountry;
        const activeLoc = locations.find(l => l.id === activeLocId);
        if (activeLoc) {
          // Build tập hợp tên cần khớp
          const matchNames = new Set<string>();
          matchNames.add(activeLoc.name.toLowerCase());
          // Nếu chọn country → cộng thêm tất cả city con
          if (activeLoc.type === "COUNTRY") {
            locations
              .filter(l => l.parentId === activeLoc.id && l.type === "CITY_PROVINCE")
              .forEach(c => matchNames.add(c.name.toLowerCase()));
          }
          const start = tour.startDestinationName?.toLowerCase() ?? "";
          const end = tour.endDestinationName?.toLowerCase() ?? "";
          if (!matchNames.has(start) && !matchNames.has(end)) {
            return false;
          }
        }
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
  }, [allTours, searchTerm, selectedType, priceRange, selectedCountry, selectedCity, selectedVehicle, startDateFrom, startDateTo, selectedGeo, locations]);

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
                variant="glass"
                initialValue={searchTerm}
                onSearch={(value) => setSearchTerm(value)}
                onQueryChange={(value) => setSearchTerm(value)}
                onSelectSuggestion={(s) => setSearchTerm(s.label)}
                suggestions={suggestions}
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
              <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-4 sticky top-24">

                {/* Phân loại địa lý */}
                <CollapsePanel
                  title="Phân loại địa lý"
                  isOpen={expandedSections.geo}
                  onToggle={() => toggleSection("geo")}
                >
                  <div className="flex flex-wrap gap-1.5">
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
                          className={`px-2 py-1 text-[10px] rounded-full transition ${selectedGeo === geo.value
                            ? "bg-sky-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}>
                          {geo.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </CollapsePanel>

                {/* Tour Type */}
                <CollapsePanel
                  title="Loại tour"
                  isOpen={expandedSections.type}
                  onToggle={() => toggleSection("type")}
                >
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedType(null)}
                      className={`px-2 py-1 text-[10px] rounded-full transition ${selectedType === null
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
                          className={`px-2 py-1 text-[10px] rounded-full transition ${selectedType === type
                            ? "bg-sky-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}>
                          {TOUR_TYPE_LABELS[type] ?? type} ({count})
                        </button>
                      );
                    })}
                  </div>
                </CollapsePanel>

                {/* Price */}
                <CollapsePanel
                  title="Ngân sách"
                  isOpen={expandedSections.price}
                  onToggle={() => toggleSection("price")}
                >
                  <div className="flex flex-wrap gap-1.5">
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
                        className={`px-2 py-1 text-[10px] rounded-full transition ${priceRange === item.value
                          ? "bg-sky-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </CollapsePanel>

                {/* Địa điểm (phân cấp) */}
                {locationTree.length > 0 && (
                  <CollapsePanel
                    title="Địa điểm"
                    isOpen={expandedSections.location}
                    onToggle={() => toggleSection("location")}
                  >
                    <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
                      {/* Tất cả */}
                      <button
                        onClick={() => { setSelectedCountry(null); setSelectedCity(null); }}
                        className={`w-full text-left px-2 py-1.5 text-[11px] rounded-lg transition font-medium ${
                          !selectedCountry && !selectedCity
                            ? "bg-sky-50 text-sky-700 font-semibold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          <span>Tất cả</span>
                          <span className="text-[10px] text-gray-400">{allTours.length}</span>
                        </span>
                      </button>

                      {/* Cây phân cấp */}
                      {locationTree
                        .filter(country => countToursForLocation(country, country.cities) > 0)
                        .map(country => {
                          const countryTourCount = countToursForLocation(country, country.cities);
                          const isCountrySelected = selectedCountry === country.id && !selectedCity;
                          const isExpanded = expandedCountries.has(country.id);
                          const activeCities = country.cities.filter(c => countToursForLocation(c) > 0);

                          return (
                            <div key={country.id}>
                              {/* Country row */}
                              <div className="flex items-center gap-0.5">
                                {activeCities.length > 0 ? (
                                  <button
                                    onClick={() => setExpandedCountries(prev => {
                                      const next = new Set(prev);
                                      next.has(country.id) ? next.delete(country.id) : next.add(country.id);
                                      return next;
                                    })}
                                    className="p-0.5 text-gray-400 hover:text-sky-500 transition flex-shrink-0"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                                      style={{ transition: "transform 0.15s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                                    </svg>
                                  </button>
                                ) : (
                                  <div className="w-5 flex-shrink-0" />
                                )}

                                <button
                                  onClick={() => { setSelectedCountry(country.id); setSelectedCity(null); }}
                                  className={`flex-1 text-left px-2 py-1 text-[11px] rounded-lg transition ${
                                    isCountrySelected
                                      ? "bg-sky-100 text-sky-700 font-bold"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <span className="flex items-center justify-between">
                                    <span className="font-semibold">{country.name}</span>
                                    <span className="text-[10px] text-gray-400">{countryTourCount}</span>
                                  </span>
                                </button>
                              </div>

                              {/* City children */}
                              {isExpanded && activeCities.map(city => {
                                const cityCount = countToursForLocation(city);
                                const isCitySelected = selectedCity === city.id;
                                return (
                                  <button
                                    key={city.id}
                                    onClick={() => { setSelectedCity(city.id); setSelectedCountry(country.id); }}
                                    className={`w-full text-left pl-8 pr-2 py-1 text-[10.5px] rounded-lg transition ${
                                      isCitySelected
                                        ? "bg-sky-50 text-sky-600 font-semibold"
                                        : "text-gray-500 hover:bg-gray-50"
                                    }`}
                                  >
                                    <span className="flex items-center justify-between">
                                      <span>└ {city.name}</span>
                                      <span className="text-[10px] text-gray-400">{cityCount}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })
                      }
                    </div>
                  </CollapsePanel>
                )}


                {/* Vehicle */}
                {vehicleTypes.length > 0 && (
                  <CollapsePanel
                    title="Phương tiện"
                    isOpen={expandedSections.vehicle}
                    onToggle={() => toggleSection("vehicle")}
                  >
                    <select
                      value={selectedVehicle ?? ""}
                      onChange={(e) => setSelectedVehicle(e.target.value || null)}
                      className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none">
                      <option value="">Tất cả</option>
                      {vehicleTypes.map(vehicle => (
                        <option key={vehicle} value={vehicle}>
                          {VEHICLE_LABELS[vehicle] ?? vehicle}
                        </option>
                      ))}
                    </select>
                  </CollapsePanel>
                )}

                {/* Date */}
                <CollapsePanel
                  title="Ngày đi"
                  isOpen={expandedSections.date}
                  onToggle={() => toggleSection("date")}
                >
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDateFrom}
                      onChange={(e) => setStartDateFrom(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </CollapsePanel>

                {/* Sort */}
                <CollapsePanel
                  title="Sắp xếp"
                  isOpen={expandedSections.sort}
                  onToggle={() => toggleSection("sort")}
                >
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none">
                    <option value="rating">Đánh giá cao</option>
                    <option value="price-asc">Giá thấp</option>
                    <option value="price-desc">Giá cao</option>
                    <option value="available">Còn chỗ</option>
                  </select>
                </CollapsePanel>

                {/* Reset */}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType(null);
                    setPriceRange(null);
                    setSelectedCountry(null);
                    setSelectedCity(null);
                    setExpandedCountries(new Set());
                    setSelectedVehicle(null);
                    setStartDateFrom("");
                    setStartDateTo("");
                    setSortBy("rating");
                    setSelectedGeo("all");
                  }}
                  className="w-full text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
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
                    setSelectedCountry(null);
                    setSelectedCity(null);
                    setExpandedCountries(new Set());
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

export default function ToursPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8F8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    }>
      <ToursPageContent />
    </Suspense>
  );
}
