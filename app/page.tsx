"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TourCard from "@/components/TourCard";
import SearchBar from "@/components/SearchBar";
import { getToursAPI } from "@/lib/api/tours";
import type { TourDTO } from "@/types/api";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

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
    <div className="min-h-screen bg-white">
      <Header></Header>
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
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
            <SearchBar placeholder="Bạn muốn đi đâudsf?" variant="glass" />
          </div>
        </div>
      </section>

      {/* ── Stats (Gọn gàng & Hiện đại) ── */}
      <section className="relative z-20 -mt-16 max-w-5xl mx-auto px-6">
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

      {/* ── Featured Tours (Layout tạp chí) ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6 text-center md:text-left">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Tour Nổi Bật <br />Trong Mùa Này.
            </h2>
            <div className="h-1.5 w-20 bg-sky-600 rounded-full mx-auto md:mx-0" />
          </div>
          <Link href="/tours" className="group text-sm font-bold text-sky-600 flex items-center gap-2">
            XEM TẤT CẢ 
            <span className="w-8 h-8 rounded-full border border-sky-100 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {loadingTours ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="rounded-[2rem] h-[450px] bg-slate-50 animate-pulse" />
            ))
          ) : (
            featuredTours.slice(0, 3).map((tour) => (
              <div key={tour.id} className="transition-all hover:-translate-y-2">
                 <TourCard tour={tour} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Promotional (Minimalist) ── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 text-white p-12 md:p-20">
          <img 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073" 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              Giảm ngay <span className="text-emerald-400">40%</span> <br />cho nhóm đi đông.
            </h2>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              Tạo nên kỷ niệm tuyệt vời cùng gia đình và bạn bè với ưu đãi giá tốt nhất từ trước đến nay.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20">
                Nhận ưu đãi ngay
              </button>
              <button className="px-10 py-4 border border-white/20 hover:bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl transition-all">
                Xem điều kiện
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Destinations (Square Grid) ── */}
      <section className="max-w-7xl mx-auto px-6 py-10 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-16 tracking-tight uppercase tracking-[0.2em]">Điểm đến hàng đầu</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { name: "Hạ Long", img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=600&fit=crop" },
            { name: "Sapa", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop" },
            { name: "Hội An", img: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=600&fit=crop" },
            { name: "Cần Thơ", img: "https://images.unsplash.com/photo-1564760055-e1993d43e54f?w=400&h=600&fit=crop" },
          ].map((dest, idx) => (
            <div key={idx} className="group relative rounded-[2rem] overflow-hidden h-[400px] cursor-pointer">
              <img src={dest.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={dest.name}/>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-8 left-0 w-full text-center">
                <h3 className="text-white font-bold text-xl tracking-wide">{dest.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Us (Iconography mỏng) ── */}
      <section className="bg-slate-50 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
             <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Giá trị chúng tôi mang lại.</h2>
             <p className="text-slate-500">Tận tâm trong từng khâu phục vụ để chuyến đi của bạn trở nên trọn vẹn nhất.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: "01", title: "Giá Cạnh Tranh", desc: "Tối ưu chi phí nhưng không làm giảm chất lượng dịch vụ tiêu chuẩn." },
              { icon: "02", title: "Đội Ngũ Chuyên Gia", desc: "Hướng dẫn viên am hiểu sâu sắc văn hóa và lịch sử địa phương." },
              { icon: "03", title: "An Toàn Tuyệt Đối", desc: "Hệ thống bảo hiểm toàn diện và hỗ trợ 24/7 mọi vấn đề phát sinh." },
            ].map((benefit, idx) => (
              <div key={idx} className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 hover:border-sky-500 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-sky-500/5">
                <div className="text-4xl font-black text-slate-100 group-hover:text-sky-500 transition-colors mb-6">{benefit.icon}</div>
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