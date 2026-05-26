import { TourDTO } from "@/types/api";
import Link from "next/link";
import { MapPin, Clock, Car, Users, Star } from "lucide-react";

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
  // Nếu chẵn triệu thì hiển thị 6Mđ, lẻ thì 6.5Mđ
  const millions = price / 1_000_000;
  const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
  return `${formatted}Mđ`;
}

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
  BOAT: "Tàu thủy",
};

export default function TourCard({ tour }: { tour: TourDTO }) {
  const slug = makeSlug(tour);
  const typeLabel = TOUR_TYPE_LABELS[tour.tourType ?? ""] ?? tour.tourType ?? "Du lịch";
  const vehicleLabel = VEHICLE_LABELS[tour.vehicleType ?? ""] ?? tour.vehicleType ?? "Ô tô";

  // Sử dụng ảnh đầu tiên hoặc ảnh mẫu chất lượng cao
  const mainImage = tour.images && tour.images.length > 0 
    ? tour.images[0] 
    : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000";

  return (
    <Link href={`/tours/${slug}?id=${tour.id}`} className="group block focus:outline-none focus:ring-4 focus:ring-sky-500/40 rounded-[2.2rem] transition-all">
      <div className="relative h-[480px] w-full rounded-[2.2rem] overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-500 border border-slate-100/10">
        
        {/* Background Image */}
        <img 
          src={mainImage} 
          alt={tour.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out z-0"
        />

        {/* Gradient Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <span className="bg-slate-900/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
            {typeLabel}
          </span>
        </div>

        {tour.rating && (
          <div className="absolute top-4 right-4 z-20">
            <span className="bg-slate-900/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {tour.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Content Section Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
          
          {/* Dot Indicators (Mock carousel style from photo) */}
          <div className="flex justify-center gap-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
          </div>

          {/* Title */}
          <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight tracking-tight line-clamp-2">
            {tour.name}
          </h3>

          {/* Location */}
          <div className="text-xs text-white/90 font-bold flex items-center gap-1.5 mb-4">
            <MapPin className="w-4 h-4 fill-sky-400 text-sky-400 shrink-0" />
            <span className="line-clamp-1">
              {tour.startDestinationName || "Việt Nam"}
              {tour.endDestinationName && ` → ${tour.endDestinationName}`}
            </span>
          </div>

          {/* Features Specs Separated by | */}
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white py-3 border-t border-b border-white/10 mb-5">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 fill-sky-400 text-sky-400" /> {tour.durationDays}N{tour.durationNights ? `${tour.durationNights}Đ` : ""}</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> {vehicleLabel}</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 fill-purple-400 text-purple-400" /> Còn {tour.availableSlots ?? 10} chỗ</span>
          </div>

          {/* Price + Button Row */}
          <div className="flex items-center gap-3">
            
            {/* Price Pill */}
            <div className="bg-[#2d3a2d]/65 border border-white/15 backdrop-blur-md px-5 py-2.5 rounded-full text-center min-w-[85px] shadow-sm">
              <span className="text-base font-black text-white tracking-tight">
                {formatPrice(tour.price)}
              </span>
            </div>

            {/* Action Button */}
            <div className="flex-1 text-center py-2.5 bg-white text-slate-950 font-black rounded-full text-sm group-hover:bg-sky-500 group-hover:text-white transition duration-300 shadow-sm cursor-pointer select-none">
              Đặt Ngay
            </div>

          </div>

        </div>

      </div>
    </Link>
  );
}