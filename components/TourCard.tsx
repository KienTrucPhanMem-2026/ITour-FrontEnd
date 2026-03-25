"use client";

import Link from "next/link";
import { Tour } from "@/lib/mockData";

interface TourCardProps {
  tour: Tour;
}

export default function TourCard({ tour }: TourCardProps) {
  const discountPercent = tour.originalPrice
    ? Math.round(((tour.originalPrice - tour.price) / tour.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image container */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={tour.image}
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Discount badge */}
        {discountPercent > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{discountPercent}%
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-4 left-4 bg-[#0EA5E9] text-white px-3 py-1 rounded-full text-xs font-semibold">
          {tour.category === "beach"
            ? "Biển"
            : tour.category === "mountain"
            ? "Núi"
            : tour.category === "city"
            ? "Thành phố"
            : "Văn hóa"}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {tour.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {tour.location}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {tour.duration}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
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
          <span className="text-sm text-gray-600">
            {tour.rating} ({tour.reviews} đánh giá)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-2 mb-4">
          <div className="text-2xl font-bold text-[#0EA5E9]">
            {(tour.price / 1000000).toFixed(1)}M₫
          </div>
          {tour.originalPrice && (
            <div className="text-sm text-gray-400 line-through">
              {(tour.originalPrice / 1000000).toFixed(1)}M₫
            </div>
          )}
          <div className="text-xs text-gray-500 ml-auto">/người</div>
        </div>

        {/* Button */}
        <Link
          href={`/tours/${tour.slug}`}
          className="w-full block text-center py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold rounded-full transition-colors duration-200"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
