"use client";

import React from "react";
import { MapPin, Hotel, User, Calendar, Star } from "lucide-react";
import Link from "next/link";

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

  const imageUrl = image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600";

  const cardContent = (
    <div className="bg-white border border-slate-100/80 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all w-full my-2 flex flex-col text-left animate-in fade-in duration-300 cursor-pointer hover:border-sky-300 group">
      {/* Tour Image Banner */}
      <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600";
          }}
        />
        <div className="absolute top-3 left-3 bg-[#0EA5E9] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          Tour Gợi Ý
        </div>
      </div>

      {/* Tour Info */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <h5 className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-[#0EA5E9] transition-colors">
          {name}
        </h5>
        
        <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-0.5">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-bold text-slate-400">Giá tốt từ</span>
            <span className="text-sm font-black text-[#0EA5E9]">{formattedPrice}</span>
          </div>
          <span className="px-4 py-2 bg-[#0EA5E9] group-hover:bg-[#0284C7] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-100 group-hover:shadow-sky-200 active:scale-95 text-center font-sans">
            Xem chi tiết →
          </span>
        </div>
      </div>
    </div>
  );

  if (id) {
    return (
      <Link href={`/tours/detail?id=${id}`} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// --- Hotel Card Component ---
export function HotelCard({ id, name, price, rating, address }: HotelCardProps) {
  const formattedPrice = price
    ? `${Number(String(price).replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} đ`
    : "Liên hệ";

  const renderStars = (starCount: number | string) => {
    const count = Math.min(5, Math.max(1, Number(starCount) || 5));
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`w-3 h-3 ${
              idx < count ? "text-amber-500 fill-amber-500" : "text-slate-300 fill-slate-100"
            }`}
          />
        ))}
      </div>
    );
  };

  const cardContent = (
    <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-100 rounded-2xl p-4 shadow-sm w-full my-1 flex flex-col gap-3 border-l-4 border-l-amber-500 text-left animate-in fade-in duration-300 cursor-pointer hover:border-amber-300 group">
      <div className="flex gap-2.5">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0 bg-amber-100 flex items-center justify-center">
          <Hotel className="w-5 h-5 text-amber-600 fill-amber-600/10" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider block">
            Gợi ý Khách Sạn
          </span>
          <h5 className="font-extrabold text-slate-800 text-xs leading-snug line-clamp-2 mt-0.5 group-hover:text-amber-700 transition-colors">
            {name}
          </h5>
          {address && (
            <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {address}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-amber-100/70 pt-2.5 mt-0.5">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-bold text-slate-400">
            {rating ? renderStars(rating) : "Giá từ"}
          </span>
          <span className="text-xs font-black text-amber-600 mt-1">{formattedPrice}</span>
        </div>
        <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-600 group-hover:to-orange-600 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 text-center font-sans">
          Xem phòng →
        </span>
      </div>
    </div>
  );

  if (id) {
    return (
      <Link href={`/hotels/detail?id=${id}`} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
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

// --- Helper to parse and render highlighted bold text ---
function renderHighlightedText(text: string, isMe: boolean) {
  const regex = /(\*\*[^*]+\*\*)/g;
  const subparts = text.split(regex);

  return subparts.map((subpart, subidx) => {
    if (subpart.startsWith("**") && subpart.endsWith("**")) {
      const cleanVal = subpart.slice(2, -2);
      return (
        <span
          key={subidx}
          className={`font-extrabold px-1.5 py-0.5 rounded-lg mx-0.5 inline-block ${
            isMe
              ? "text-white bg-white/20 border border-white/10"
              : "text-[#0284C7] bg-sky-50 border border-sky-100/50"
          }`}
        >
          {cleanVal}
        </span>
      );
    }
    return <span key={subidx}>{subpart}</span>;
  });
}

// --- Invoice Card Component (For future Billing/Invoice rendering) ---
export interface InvoiceCardProps {
  id: string;
  customerName?: string;
  amount?: string | number;
  status?: string;
  date?: string;
}

export function InvoiceCard({ id, customerName, amount, status, date }: InvoiceCardProps) {
  const formattedAmount = amount
    ? `${Number(String(amount).replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} đ`
    : "0 đ";

  const cardContent = (
    <div className="bg-white border border-slate-100/85 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all w-full my-2 flex flex-col gap-2.5 text-left border-l-4 border-l-emerald-500 animate-in fade-in duration-300 cursor-pointer hover:border-emerald-300 group">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider block">
            Hóa Đơn Thanh Toán
          </span>
          <h5 className="font-extrabold text-slate-800 text-xs mt-0.5 group-hover:text-emerald-700 transition-colors">
            Mã HĐ: #{id}
          </h5>
        </div>
        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
          status === "PAID" || status === "success" || status === "completed"
            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
            : "bg-amber-50 text-amber-600 border border-amber-100"
        }`}>
          {status === "PAID" || status === "success" || status === "completed" ? "Đã thanh toán" : "Chờ thanh toán"}
        </span>
      </div>

      <div className="text-[11px] text-slate-600 space-y-1.5 mt-1 border-t border-slate-50 pt-2.5">
        {customerName && (
          <p className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Khách hàng: <span className="font-bold text-slate-700">{customerName}</span>
          </p>
        )}
        {date && (
          <p className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Ngày tạo: <span className="font-bold text-slate-700">{date}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-0.5">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-bold text-slate-400">Tổng tiền</span>
          <span className="text-sm font-black text-emerald-600">{formattedAmount}</span>
        </div>
        <span className="px-3.5 py-2 bg-slate-900 group-hover:bg-slate-850 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 text-center font-sans">
          Chi tiết →
        </span>
      </div>
    </div>
  );

  if (id) {
    return (
      <Link href={`/payment/confirmation?id=${id}`} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// --- Text Bubble Component ---
interface TextBubbleProps {
  content: string;
  isMe: boolean;
}

export function TextBubble({ content, isMe }: TextBubbleProps) {
  return (
    <div
      className={`px-3 py-2 text-xs shadow-sm ${
        isMe
          ? "bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white rounded-2xl rounded-tr-none self-end animate-in slide-in-from-right-2 duration-200"
          : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none self-start animate-in slide-in-from-left-2 duration-200"
      }`}
    >
      <p className="whitespace-pre-wrap leading-relaxed">
        {renderHighlightedText(content, isMe)}
      </p>
    </div>
  );
}

// --- Shortcode Renderer Component ---
interface ShortcodeRendererProps {
  shortcode: string;
}

export function ShortcodeRenderer({ shortcode }: ShortcodeRendererProps) {
  // 1. TOUR_CARD matching
  if (shortcode.startsWith("[TOUR_CARD:")) {
    const match = shortcode.match(/\[TOUR_CARD:(.*?)\]/);
    if (match) {
      const params = parseShortcodeParams(match[1]);
      return (
        <TourCard
          id={params.id || ""}
          name={params.name || "Chi tiết Tour"}
          price={params.price || ""}
          image={params.image}
        />
      );
    }
  }

  // 2. HOTEL_CARD matching
  if (shortcode.startsWith("[HOTEL_CARD:")) {
    const match = shortcode.match(/\[HOTEL_CARD:(.*?)\]/);
    if (match) {
      const params = parseShortcodeParams(match[1]);
      return (
        <HotelCard
          id={params.id || ""}
          name={params.name || "Chi tiết Khách sạn"}
          price={params.price || ""}
          rating={params.rating || params.rate}
          address={params.address || params.location}
        />
      );
    }
  }

  // 3. INVOICE_CARD matching
  if (shortcode.startsWith("[INVOICE_CARD:")) {
    const match = shortcode.match(/\[INVOICE_CARD:(.*?)\]/);
    if (match) {
      const params = parseShortcodeParams(match[1]);
      return (
        <InvoiceCard
          id={params.id || ""}
          customerName={params.customerName || params.customer || ""}
          amount={params.amount || params.price || ""}
          status={params.status || ""}
          date={params.date}
        />
      );
    }
  }

  // 4. TOUR_LINK matching
  if (shortcode.startsWith("[TOUR_LINK:")) {
    const match = shortcode.match(/\[TOUR_LINK:(.*?)\]/);
    if (match) {
      const params = parseShortcodeParams(match[1]);
      return (
        <TourCard
          id={params.tourId || params.id || ""}
          name={params.name || "Chi tiết Tour"}
          price={params.price || ""}
          image={params.image}
        />
      );
    }
  }

  return null;
}

// --- Message Bubble Parser Component ---
interface MessageBubbleProps {
  content: string;
  isMe: boolean;
}

export function MessageBubble({ content, isMe }: MessageBubbleProps) {
  if (!content) return null;

  // Regex to split text by shortcodes: [TOUR_CARD:...], [HOTEL_CARD:...], [INVOICE_CARD:...], [TOUR_LINK...]
  const regex = /(\[TOUR_CARD:[^\]]*\]|\[HOTEL_CARD:[^\]]*\]|\[INVOICE_CARD:[^\]]*\]|\[TOUR_LINK:[^\]]*\])/g;
  const parts = content.split(regex);

  return (
    <div className="flex flex-col w-full gap-1">
      {parts.map((part, index) => {
        if (!part) return null;

        const isShortcode = part.startsWith("[") && part.endsWith("]");
        if (isShortcode) {
          return <ShortcodeRenderer key={index} shortcode={part} />;
        }

        return <TextBubble key={index} content={part} isMe={isMe} />;
      })}
    </div>
  );
}
