import { TourDTO } from "@/types/api";
import Link from "next/link";

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

export default function TourCard({ tour }: { tour: TourDTO }) {

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





  const slug = makeSlug(tour);
  const typeLabel = TOUR_TYPE_LABELS[tour.tourType ?? ""] ?? tour.tourType;
  const vehicleLabel = VEHICLE_LABELS[tour.vehicleType ?? ""] ?? tour.vehicleType;

  return (
    <Link href={`/tours/${slug}?id=${tour.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">

        {/* Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {tour.images && tour.images.length > 0 ? (
            <img 
              src={tour.images[0]} 
              alt={tour.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth={1}
                  d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
            </div>
          )}

          {/* Badge left */}
          {tour.tourType && (
            <span className="absolute top-3 left-3 bg-white text-gray-700 text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm">
              {typeLabel}
            </span>
          )}

          {/* Rating */}
          {tour.rating && (
            <span className="absolute top-3 right-3 bg-white text-yellow-600 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
              ★ {tour.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-[15px] leading-snug mb-1 line-clamp-2 group-hover:text-sky-600 transition">
            {tour.name}
          </h3>

          {/* Description */}
          {tour.description && (
            <p className="text-gray-500 text-xs mb-3 line-clamp-2">
              {tour.description}
            </p>
          )}

          {/* Location */}
          {tour.startDestinationName && (
            <p className="text-[11px] text-gray-500 mb-3">
              📍 {tour.startDestinationName}
              {tour.endDestinationName && ` → ${tour.endDestinationName}`}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 mb-3">
            {tour.durationDays && (
              <span className="px-2 py-1 bg-gray-50 rounded-md">
                {tour.durationDays}D{tour.durationNights ? `/${tour.durationNights}N` : ""}
              </span>
            )}
            {vehicleLabel && (
              <span className="px-2 py-1 bg-gray-50 rounded-md">
                {/* {vehicleLabel} */}
                Xe 4 cho
              </span>
            )}
            {tour.startDate && (
              <span className="px-2 py-1 bg-gray-50 rounded-md">
                {new Date(tour.startDate).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>

          {/* Slots */}
          {tour.availableSlots !== undefined && (
            <div className="mb-3 text-[11px] text-gray-600">
              Còn lại <span className="font-semibold text-gray-900">{tour.availableSlots}</span> chỗ
            </div>
          )}

          {/* Price + Button */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(tour.price)}
              </div>
              <div className="text-[10px] text-gray-400">/ người</div>
            </div>

            <span className="text-xs font-medium text-sky-600 group-hover:underline">
              Xem chi tiết →
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
}