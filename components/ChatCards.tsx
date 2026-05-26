"use client";

import React from "react";

// --- Types ---
export interface TourCardProps {
  id: string;
  name: string;
  price: string | number;
  image?: string;
}

export interface HotelCardProps {
  id: string;
  name: string;
  price?: string | number;
  rating?: string | number;
  address?: string;
}

// --- Tour Card Component ---
export function TourCard({ id, name, price, image }: TourCardProps) {
  const formattedPrice = price
    ? `${Number(String(price).replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} đ`
    : "Liên hệ";

  const imageUrl = image || "/assets/3-5.png";

  return (
    <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-100 rounded-2xl p-4 shadow-sm w-full my-1 flex flex-col gap-3 border-l-4 border-l-blue-500 text-left animate-in fade-in duration-300">
      <div className="flex gap-2.5">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0 bg-slate-100">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/assets/3-5.png";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] uppercase font-bold text-blue-700 tracking-wider block">
            Yêu cầu tư vấn Tour
          </span>
          <h5 className="font-extrabold text-slate-800 text-xs leading-snug line-clamp-2 mt-0.5">
            {name}
          </h5>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-blue-100/70 pt-2.5 mt-0.5">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-bold text-slate-400">Giá tham khảo</span>
          <span className="text-xs font-black text-blue-600">{formattedPrice}</span>
        </div>
        {id && (
          <a
            href={`/tours/detail?id=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 text-center cursor-pointer font-sans"
          >
            Xem chi tiết →
          </a>
        )}
      </div>
    </div>
  );
}

// --- Hotel Card Component ---
export function HotelCard({ id, name, price, rating, address }: HotelCardProps) {
  const formattedPrice = price
    ? `${Number(String(price).replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} đ`
    : "Liên hệ";

  const renderStars = (starCount: number | string) => {
    const count = Math.min(5, Math.max(1, Number(starCount) || 5));
    return "⭐".repeat(count);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-100 rounded-2xl p-4 shadow-sm w-full my-1 flex flex-col gap-3 border-l-4 border-l-amber-500 text-left animate-in fade-in duration-300">
      <div className="flex gap-2.5">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0 bg-amber-100 flex items-center justify-center text-lg">
          🏨
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider block">
            Gợi ý Khách Sạn
          </span>
          <h5 className="font-extrabold text-slate-800 text-xs leading-snug line-clamp-2 mt-0.5">
            {name}
          </h5>
          {address && (
            <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
              📍 {address}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-amber-100/70 pt-2.5 mt-0.5">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-bold text-slate-400">
            {rating ? `${renderStars(rating)}` : "Giá từ"}
          </span>
          <span className="text-xs font-black text-amber-600">{formattedPrice}</span>
        </div>
        {id && (
          <a
            href={`/hotels/detail?id=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 text-center cursor-pointer font-sans"
          >
            Xem phòng →
          </a>
        )}
      </div>
    </div>
  );
}

// --- Parse Utility ---
function parseShortcodeParams(paramsStr: string): Record<string, string> {
  const params: Record<string, string> = {};
  const pairs = paramsStr.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      params[key.trim()] = value ? decodeURIComponent(value.trim()) : "";
    }
  }
  return params;
}

// --- Message Bubble Parser Component ---
interface MessageBubbleProps {
  content: string;
  isMe: boolean;
}

export function MessageBubble({ content, isMe }: MessageBubbleProps) {
  if (!content) return null;

  // Regex to split text by shortcodes: [TOUR_CARD:...], [HOTEL_CARD:...], [TOUR_LINK:...]
  const regex = /(\[TOUR_CARD:[^\]]*\]|\[HOTEL_CARD:[^\]]*\]|\[TOUR_LINK:[^\]]*\])/g;
  const parts = content.split(regex);

  return (
    <div className="flex flex-col w-full gap-1">
      {parts.map((part, index) => {
        if (!part) return null;

        // 1. TOUR_CARD matching
        if (part.startsWith("[TOUR_CARD:")) {
          const match = part.match(/\[TOUR_CARD:(.*?)\]/);
          if (match) {
            const params = parseShortcodeParams(match[1]);
            return (
              <TourCard
                key={index}
                id={params.id || ""}
                name={params.name || "Chi tiết Tour"}
                price={params.price || ""}
                image={params.image}
              />
            );
          }
        }

        // 2. HOTEL_CARD matching
        if (part.startsWith("[HOTEL_CARD:")) {
          const match = part.match(/\[HOTEL_CARD:(.*?)\]/);
          if (match) {
            const params = parseShortcodeParams(match[1]);
            return (
              <HotelCard
                key={index}
                id={params.id || ""}
                name={params.name || "Chi tiết Khách sạn"}
                price={params.price || ""}
                rating={params.rating || params.rate}
                address={params.address || params.location}
              />
            );
          }
        }

        // 3. TOUR_LINK matching
        if (part.startsWith("[TOUR_LINK:")) {
          const match = part.match(/\[TOUR_LINK:(.*?)\]/);
          if (match) {
            const params = parseShortcodeParams(match[1]);
            return (
              <TourCard
                key={index}
                id={params.tourId || params.id || ""}
                name={params.name || "Chi tiết Tour"}
                price={params.price || ""}
                image={params.image}
              />
            );
          }
        }

        // 4. Default Text Bubble rendering
        return (
          <div
            key={index}
            className={`px-3 py-2 text-xs shadow-sm ${
              isMe
                ? "bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white rounded-2xl rounded-tr-none self-end"
                : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none self-start"
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{part}</p>
          </div>
        );
      })}
    </div>
  );
}
