"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TourCard from "@/components/TourCard";
import TourCarousel from "@/components/TourCarousel";
import SearchBar from "@/components/SearchBar";
import type { SearchSuggestion } from "@/components/SearchBar";
import { getToursAPI } from "@/lib/api/tours";
import type { TourDTO } from "@/types/api";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { isDomesticTour } from "@/lib/tourHelpers";

export default function HomePage() {
  const router = useRouter();
  const [allTours, setAllTours] = useState<TourDTO[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Tính suggestions từ allTours dựa trên searchQuery
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: SearchSuggestion[] = [];

    // 1. Nhóm theo điểm khởi hành (startDestinationName)
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

    // 2. Nhóm theo điểm đến (endDestinationName)
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

    // 3. Tên tour khớp từ khóa (tối đa 5)
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
  }, [allTours, searchQuery]);

  const handleSearch = (value: string) => {
    const query = value.trim();
    if (query) {
      router.push(`/tours?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/tours");
    }
  };

  useEffect(() => {
    getToursAPI()
      .then((data) => setAllTours(data))
      .catch(() => setAllTours([]))
      .finally(() => setLoadingTours(false));
  }, []);

  const featuredTours = allTours.slice(0, 10);
  const domesticTours = allTours.filter(isDomesticTour);
  const internationalTours = allTours.filter(t => !isDomesticTour(t));

  return (
    <div className="min-h-screen bg-white">
      <Header></Header>

      {/* ── 1. Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center bg-slate-900">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070"
            className="w-full h-full object-cover opacity-50 shadow-2xl"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-white" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-[0.2em] text-white uppercase bg-sky-600 rounded-full">
              Khám phá Việt Nam cùng chuyên gia
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight">
              Hành trình <br />
              <span className="text-sky-400">di sản & cảm xúc.</span>
            </h1>
            <SearchBar
              placeholder="Bạn muốn đi đâu?"
              variant="glass"
              onSearch={handleSearch}
              onQueryChange={setSearchQuery}
              onSelectSuggestion={(s) => handleSearch(s.label)}
              suggestions={suggestions}
            />
          </div>
        </div>
      </section>

      {/* ── 2. Stats Section ── */}
      <section className="relative  -mt-16 max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Kinh nghiệm", value: "10+", sub: "Năm dẫn đầu" },
            { label: "Khách hàng", value: "50k+", sub: "Tin tưởng" },
            { label: "Điểm đến", value: "200+", sub: "Độc quyền" },
            { label: "Đánh giá", value: "4.9/5", sub: "Hài lòng", highlight: true },
          ].map((stat, i) => (
            <div key={i} className="text-center md:border-r last:border-0 border-slate-100">
              <div className={`text-3xl font-black ${stat.highlight ? "text-orange-500" : "text-slate-900"}`}>{stat.value}</div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Điểm Đến Hàng Đầu (Bento Grid) ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-[0.2em] text-sky-600 uppercase bg-sky-50 rounded-full">
            Ý tưởng cho chuyến đi của bạn
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Điểm Đến Hàng Đầu.
          </h2>
          <p className="text-slate-500 text-sm md:text-base">
            Những điểm du lịch nổi tiếng, độc đáo và được khách du lịch lựa chọn nhiều nhất cho kỳ nghỉ của mình.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Card 1: Hạ Long (Spans 2 columns, 2 rows) */}
          <div className="relative rounded-[2.5rem] overflow-hidden md:col-span-2 md:row-span-2 h-[500px] group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=1000&fit=crop"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              alt="Hạ Long"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent" />
            <div className="absolute top-6 left-6 z-10">
              <span className="px-3.5 py-1.5 bg-emerald-500/90 text-white text-[10px] font-bold tracking-widest uppercase rounded-full shadow-md">
                ★ Bán chạy nhất
              </span>
            </div>
            <div className="absolute bottom-8 left-8 right-8 z-10">
              <h3 className="text-white font-black text-3xl mb-2 group-hover:text-sky-300 transition duration-300">
                Vịnh Hạ Long
              </h3>
              <p className="text-slate-200 text-sm font-light mb-4">
                Kỳ quan thiên nhiên thế giới với hàng nghìn đảo đá vôi kỳ vĩ.
              </p>
              <span className="text-xs font-bold text-white tracking-widest uppercase bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl transition duration-300">
                12+ Tours →
              </span>
            </div>
          </div>

          {/* Card 2: Sapa (Spans 2 columns, 1 row) */}
          <div className="relative rounded-[2.5rem] overflow-hidden md:col-span-2 md:row-span-1 h-[238px] group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              alt="Sapa"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent" />
            <div className="absolute top-6 left-6 z-10">
              <span className="px-3.5 py-1.5 bg-sky-500/90 text-white text-[10px] font-bold tracking-widest uppercase rounded-full shadow-md">
                ❄️ Mùa đẹp nhất
              </span>
            </div>
            <div className="absolute bottom-6 left-8 right-8 z-10">
              <h3 className="text-white font-black text-2xl mb-1 group-hover:text-sky-300 transition duration-300">
                Sa Pa
              </h3>
              <p className="text-slate-200 text-xs font-light mb-3">
                Thị trấn mờ sương với ruộng bậc thang đẹp nhất thế giới.
              </p>
              <span className="text-[10px] font-bold text-white tracking-widest uppercase bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition duration-300">
                8+ Tours
              </span>
            </div>
          </div>

          {/* Card 3: Hội An (Spans 1 column, 1 row) */}
          <div className="relative rounded-[2.5rem] overflow-hidden md:col-span-1 md:row-span-1 h-[238px] group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=400&fit=crop"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              alt="Hội An"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent" />
            <div className="absolute top-6 left-6 z-10">
              <span className="px-3 py-1 bg-amber-500/90 text-white text-[9px] font-bold tracking-wider uppercase rounded-full shadow-md">
                🏮 Di sản
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <h3 className="text-white font-black text-xl mb-1 group-hover:text-sky-300 transition duration-300">
                Hội An
              </h3>
              <p className="text-slate-200 text-[11px] font-light mb-3">Phố cổ lung linh sắc đèn lồng.</p>
              <span className="text-[9px] font-bold text-white tracking-widest uppercase bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 transition duration-300">
                6+ Tours
              </span>
            </div>
          </div>

          {/* Card 4: Phú Quốc (Spans 1 column, 1 row) */}
          <div className="relative rounded-[2.5rem] overflow-hidden md:col-span-1 md:row-span-1 h-[238px] group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1564760055-e1993d43e54f?w=400&h=400&fit=crop"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              alt="Phú Quốc"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent" />
            <div className="absolute top-6 left-6 z-10">
              <span className="px-3 py-1 bg-teal-500/90 text-white text-[9px] font-bold tracking-wider uppercase rounded-full shadow-md">
                🏖️ Nghỉ dưỡng
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <h3 className="text-white font-black text-xl mb-1 group-hover:text-sky-300 transition duration-300">
                Phú Quốc
              </h3>
              <p className="text-slate-200 text-[11px] font-light mb-3">Đảo ngọc hoang sơ bãi cát trắng.</p>
              <span className="text-[9px] font-bold text-white tracking-widest uppercase bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 transition duration-300">
                10+ Tours
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Tour Trong Nước (Carousel 4 Card) ── */}
      <section className="bg-slate-50 py-24 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6 text-center md:text-left">
            <div className="max-w-xl">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-[0.2em] text-sky-600 uppercase bg-sky-50 rounded-full">
                Khám phá dải đất hình chữ S
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                Tour Trong Nước.
              </h2>
              <p className="text-slate-500 text-sm">
                Trải nghiệm những danh lam thắng cảnh kỳ vĩ, bờ biển cát trắng và nét văn hóa đặc sắc ba miền.
              </p>
            </div>
            <Link href="/tours?category=domestic" className="group text-sm font-bold text-sky-600 flex items-center gap-2 flex-shrink-0">
              XEM TẤT CẢ TOUR TRONG NƯỚC
              <span className="w-8 h-8 rounded-full border border-sky-100 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all">→</span>
            </Link>
          </div>

          <div className="relative">
            {loadingTours ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-[2.2rem] h-[480px] bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : (
              <TourCarousel tours={domesticTours} />
            )}
          </div>
        </div>
      </section>

      {/* ── 5. Promotional Layout (VIP Group Ticket) ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-950 text-white p-10 md:p-16 border border-slate-800 shadow-2xl">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200')] bg-cover bg-center opacity-[0.06] z-0 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7">
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-[0.2em] text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                🔥 Ưu Đãi Nhóm Lớn
              </span>
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                Đi Càng Đông <br />Giảm Ngay <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">40%</span>.
              </h2>
              <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed font-light">
                Tạo nên những kỉ niệm tuyệt vời cùng người thân và bạn bè với gói chính sách trợ giá tốt nhất chưa từng có.
              </p>

              {/* Group Benefits */}
              <div className="space-y-4 mb-8">
                {[
                  "Áp dụng giảm trực tiếp 40% cho các nhóm đi từ 5 người trở lên.",
                  "Tặng gói đưa đón 2 chiều bằng xe limousine hạng sang.",
                  "Tặng miễn phí hướng dẫn viên riêng hỗ trợ suốt lịch trình.",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                      ✓
                    </span>
                    <span className="text-slate-300 text-sm md:text-base font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <button className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
                  Nhận ưu đãi ngay
                </button>
                <button className="px-10 py-4 border border-white/20 hover:bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl transition-all">
                  Xem điều kiện áp dụng
                </button>
              </div>
            </div>

            {/* Right Content: VIP Ticket Mockup */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-[345px] h-[190px] rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-950 border border-emerald-500/35 shadow-2xl p-6 overflow-hidden flex flex-col justify-between backdrop-blur-lg hover:scale-105 hover:-rotate-1 transition-transform duration-500 group">

                {/* Torn Ticket Cuts */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-slate-950 rounded-full border-r border-emerald-500/20 z-10" />
                <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-slate-950 rounded-full border-l border-emerald-500/20 z-10" />

                {/* Dashed Line Separation */}
                <div className="absolute top-4 bottom-4 left-[245px] w-0 border-l border-dashed border-emerald-500/20" />

                {/* Ticket Body Content */}
                <div className="flex flex-col justify-between h-full pr-[105px]">
                  <div>
                    <span className="text-[9px] font-bold tracking-[0.25em] text-emerald-400 uppercase">
                      ITOUR VIP PASS
                    </span>
                    <h4 className="text-xl font-black text-white mt-1.5 tracking-tight uppercase">
                      SUPER GROUP
                    </h4>
                    <p className="text-[10px] text-white/50 font-medium mt-1">
                      Áp dụng cho mọi hành trình
                    </p>
                  </div>

                  {/* Barcode representation */}
                  <div className="flex items-center gap-[2px] mt-4 h-6 opacity-75">
                    <div className="w-[2px] h-full bg-white" />
                    <div className="w-[1px] h-full bg-white" />
                    <div className="w-[3px] h-full bg-white" />
                    <div className="w-[1px] h-full bg-white" />
                    <div className="w-[4px] h-full bg-white" />
                    <div className="w-[1px] h-full bg-white" />
                    <div className="w-[2px] h-full bg-white" />
                    <div className="w-[3px] h-full bg-white" />
                    <div className="w-[1px] h-full bg-white" />
                    <div className="w-[2px] h-full bg-white" />
                    <div className="w-[4px] h-full bg-white" />
                  </div>
                </div>

                {/* Ticket Stub Content */}
                <div className="absolute top-1/2 left-[282px] -translate-y-1/2 origin-center -rotate-90 text-center w-[120px]">
                  <span className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase block mb-1">
                    VOUCHER CODE
                  </span>
                  <span className="text-sm font-black text-emerald-400 tracking-wider">
                    GROUP40
                  </span>
                </div>

                {/* Price/Discount Tag overlay */}
                <div className="absolute top-5 right-[115px] bg-emerald-500 text-slate-950 font-black text-sm px-2.5 py-1 rounded-lg rotate-[10deg] shadow-lg">
                  -40% OFF
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. Tour Nước Ngoài (Carousel 4 Card) ── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6 text-center md:text-left">
          <div className="max-w-xl">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-[0.2em] text-emerald-600 uppercase bg-emerald-50 rounded-full">
              Hành trình vươn tầm thế giới
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Tour Nước Ngoài.
            </h2>
            <p className="text-slate-500 text-sm">
              Vượt qua mọi giới hạn địa lý để khám phá những kỳ quan nhân tạo, đô thị hiện đại và nền văn hóa đa dạng.
            </p>
          </div>
          <Link href="/tours?category=international" className="group text-sm font-bold text-emerald-600 flex items-center gap-2 flex-shrink-0">
            XEM TẤT CẢ TOUR NƯỚC NGOÀI
            <span className="w-8 h-8 rounded-full border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">→</span>
          </Link>
        </div>

        <div className="relative">
          {loadingTours ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-[2.2rem] h-[480px] bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <TourCarousel tours={internationalTours} />
          )}
        </div>
      </section>

      {/* ── 7. Tour Nổi Bật (Curated grid highlight) ── */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-100">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6 text-center md:text-left">
          <div className="max-w-xl">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-[0.2em] text-orange-600 uppercase bg-orange-50 rounded-full">
              Lựa chọn hàng đầu từ biên tập viên
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Tour Nổi Bật Trong Tuần.
            </h2>
            <p className="text-slate-500 text-sm">
              Trải nghiệm độc đáo với hướng đi riêng và chất lượng dịch vụ lưu trú 5 sao hoàn hảo.
            </p>
          </div>
          <Link href="/tours" className="group text-sm font-bold text-sky-600 flex items-center gap-2 flex-shrink-0">
            XEM TẤT CẢ HÀNH TRÌNH
            <span className="w-8 h-8 rounded-full border border-sky-100 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all">→</span>
          </Link>
        </div>

        <div className="relative">
          {loadingTours ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-[2.2rem] h-[480px] bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <TourCarousel tours={featuredTours} />
          )}
        </div>
      </section>

      {/* ── 8. Why Us (Giá trị chúng tôi mang lại) ── */}
      <section className="bg-slate-50 py-32 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Giá Trị Mang Lại.</h2>
            <p className="text-slate-500">Tận tâm trong từng khâu dịch vụ để hành trình của bạn là duy nhất và đáng nhớ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: "01", title: "Giá Cạnh Tranh", desc: "Tối ưu chi phí nhưng không làm giảm đi chất lượng của dịch vụ tiêu chuẩn." },
              { icon: "02", title: "Đội Ngũ Chuyên Gia", desc: "Hướng dẫn viên am hiểu tường tận văn hóa, hỗ trợ bạn bất kỳ thời điểm nào." },
              { icon: "03", title: "An Toàn Tuyệt Đối", desc: "Hệ thống bảo hiểm toàn cầu toàn diện và giải quyết nhanh chóng mọi sự cố phát sinh." },
            ].map((benefit, idx) => (
              <div key={idx} className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 hover:border-sky-500 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-sky-500/5">
                <div className="text-4xl font-black text-slate-200 group-hover:text-sky-500 transition-colors mb-6">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{benefit.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer></Footer>
    </div>
  );
}