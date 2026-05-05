"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getToursAPI } from "@/lib/api/tours";
import type { TourDTO } from "@/types/api";

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

function formatPrice(price?: number): string {
  if (!price) return "Liên hệ";
  return `${(price / 1_000_000).toFixed(1)}M₫`;
}

export default function HomePage() {
  const [featuredTours, setFeaturedTours] = useState<TourDTO[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);

  useEffect(() => {
    getToursAPI()
      .then((data) => setFeaturedTours(data.slice(0, 6)))
      .catch(() => setFeaturedTours([]))
      .finally(() => setLoadingTours(false));
  }, []);
  return (
    <div className="min-h-screen bg-[#F5F8F8]">
      {/* ── Header ── */}
      <Header />

      {/* ── Hero Section ── */}
      <section className="relative bg-cover bg-center py-24 overflow-hidden" style={{
        backgroundImage: 'linear-gradient(135deg, rgba(14, 165, 233, 0.85) 0%, rgba(56, 189, 248, 0.85) 100%)'
      }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0EA5E9]/80 to-[#38BDF8]/80" />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Khám Phá Vẻ Đẹp Việt Nam
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Hơn 10 năm kinh nghiệm, hơn 50000 khách hàng hài lòng
          </p>

          {/* Search bar */}
          <div className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Tìm kiếm tour du lịch..."
              className="flex-1 px-6 py-4 rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button className="px-8 py-4 bg-[#00D084] hover:bg-[#00B86F] text-white font-bold rounded-full transition-colors whitespace-nowrap">
              Xem tổng hợp
            </button>
            <button className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-colors whitespace-nowrap">
              Tìm tour
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="bg-white py-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0EA5E9]">10+</div>
              <p className="text-gray-600 text-sm mt-2">Năm Kinh Nghiệm</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0EA5E9]">50k+</div>
              <p className="text-gray-600 text-sm mt-2">Khách Hàng Hài Lòng</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0EA5E9]">200+</div>
              <p className="text-gray-600 text-sm mt-2">Tours Độc Quyền</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400">4.9/5</div>
              <p className="text-gray-600 text-sm mt-2">Đánh Giá Trung Bình</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Tours ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Tour Nổi Bật Mỗi Hé
            </h2>
            <p className="text-gray-600">
              Những tour du lịch được yêu thích nhất
            </p>
          </div>
          <Link
            href="/tours"
            className="text-[#0EA5E9] font-semibold hover:underline"
          >
            Xem thêm →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingTours ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-8 bg-gray-200 rounded w-1/2 mt-4" />
                </div>
              </div>
            ))
          ) : featuredTours.length > 0 ? (
            featuredTours.slice(0, 3).map((tour) => (
              <Link key={tour.id} href={`/tours/${makeSlug(tour)}?id=${tour.id}`} className="group block">
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:-translate-y-1">
                  <div className="relative h-48 bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {tour.rating && (
                      <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-[#00D084]">{formatPrice(tour.price)}</div>
                        <div className="text-xs text-gray-400">/ người</div>
                      </div>
                      <span className="px-3 py-1.5 bg-[#0EA5E9] text-white text-xs font-semibold rounded-full">
                        Xem chi tiết
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <p>Không thể tải tour. <Link href="/tours" className="text-[#0EA5E9] hover:underline">Xem tất cả tour</Link></p>
            </div>
          )}
        </div>
      </section>

      {/* ── Promotional Section ── */}
      <section className="bg-[#E0F7F0] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Ưu đãi lên đến <span className="text-[#00D084]">40%</span>
              </h2>
              <p className="text-lg text-gray-600 mb-2 font-semibold">
                Cho nhóm từ 5 người
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Giảm giá đặc biệt dành cho nhóm khách từ 5 người trở lên. Tận hưởng những chuyến du lịch tuyệt vời với bạn bè, gia đình với giá khoá học nhất.
              </p>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-[#00D084] hover:bg-[#00B86F] text-white font-bold rounded-full transition-colors">
                  Xem ngay
                </button>
                <button className="px-6 py-3 border border-[#00D084] text-[#00D084] font-bold rounded-full hover:bg-white transition-colors">
                  Xem bảng
                </button>
              </div>
            </div>

            {/* Right image */}
            <div className="rounded-2xl overflow-hidden shadow-lg h-80 md:h-full">
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=500&fit=crop"
                alt="Promotional"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Destinations ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Điểm Đến Mỗi Dễ Dàng
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Hạ Long", img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop" },
              { name: "Sapa", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" },
              { name: "Hội An", img: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=300&fit=crop" },
              { name: "Cần Thơ", img: "https://images.unsplash.com/photo-1564760055-e1993d43e54f?w=400&h=300&fit=crop" },
            ].map((dest, idx) => (
              <div
                key={idx}
                className="relative group rounded-2xl overflow-hidden h-64 cursor-pointer"
              >
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-white font-bold text-lg">{dest.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits Section ── */}
      <section className="bg-[#F5F8F8] py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Tại Sao Chọn Du Lịch Việt?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Giá Cạnh Tranh",
                desc: "Giá tốt nhất thị trường, cam kết hoàn trả tiền nếu không hài lòng",
              },
              {
                icon: "👥",
                title: "Hướng Dẫn Chuyên Nghiệp",
                desc: "Đội hướng dẫn viên nhiều kinh nghiệm, nói tiếng nước ngoài",
              },
              {
                icon: "🛡️",
                title: "An Toàn & Bảo Hiểm",
                desc: "Bảo hiểm du lịch toàn diện, hỗ trợ 24/7 khi cần",
              },
              {
                icon: "✈️",
                title: "Vị Trí Chiến Lược",
                desc: "Tour tới những điểm du lịch nổi tiếng nhất Việt Nam",
              },
              {
                icon: "🏨",
                title: "Khách Sạn Chất Lượng",
                desc: "Phòng sạch sẽ, thoải mái, gần các điểm tham quan",
              },
              {
                icon: "🍽️",
                title: "Ăn Uống Tuyệt Vời",
                desc: "Ăn các món ăn đặc sản địa phương, đảm bảo vệ sinh",
              },
            ].map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
