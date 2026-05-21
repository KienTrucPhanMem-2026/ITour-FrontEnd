"use client";

import { useState, useEffect, useRef } from "react";
import type { TourDTO } from "@/types/api";
import TourCard from "./TourCard";

interface TourCarouselProps {
  tours: TourDTO[];
}

export default function TourCarousel({ tours }: TourCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cập nhật số lượng card hiển thị tùy theo chiều rộng màn hình
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setVisibleCount(1);
      } else if (w < 768) {
        setVisibleCount(2);
      } else if (w < 1024) {
        setVisibleCount(3);
      } else {
        setVisibleCount(4);
      }
    };

    handleResize(); // Chạy ngay lần đầu
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Thiết lập tính năng tự động lướt (Autoplay)
  useEffect(() => {
    if (tours.length <= visibleCount) return;

    if (!isPaused) {
      autoplayTimerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const maxIndex = tours.length - visibleCount;
          if (prevIndex >= maxIndex) {
            return 0; // Trở lại đầu
          }
          return prevIndex + 1;
        });
      }, 5000); // 5 giây lướt 1 lần
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [tours, visibleCount, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : tours.length - visibleCount));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const maxIndex = tours.length - visibleCount;
      return prev < maxIndex ? prev + 1 : 0;
    });
  };

  if (!tours || tours.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Hiện tại chưa có tour nào khả dụng trong danh mục này.
      </div>
    );
  }

  const maxIndex = Math.max(0, tours.length - visibleCount);
  const showControls = tours.length > visibleCount;

  return (
    <div 
      className="relative group/carousel w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Nút lướt sang trái - chỉ hiển thị trên desktop khi hover */}
      {showControls && (
        <button
          onClick={handlePrev}
          aria-label="Xem tour trước"
          className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white text-slate-800 shadow-xl border border-slate-100 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 duration-300 hover:scale-110 active:scale-95 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <span className="text-lg font-bold">←</span>
        </button>
      )}

      {/* Viewport chứa các Card */}
      <div className="w-full overflow-hidden py-4 px-1">
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`
          }}
        >
          {tours.map((tour) => (
            <div 
              key={tour.id} 
              className="flex-shrink-0 px-3"
              style={{
                width: `${100 / visibleCount}%`
              }}
            >
              <TourCard tour={tour} />
            </div>
          ))}
        </div>
      </div>

      {/* Nút lướt sang phải - chỉ hiển thị trên desktop khi hover */}
      {showControls && (
        <button
          onClick={handleNext}
          aria-label="Xem tour kế tiếp"
          className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white text-slate-800 shadow-xl border border-slate-100 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 duration-300 hover:scale-110 active:scale-95 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <span className="text-lg font-bold">→</span>
        </button>
      )}

      {/* Dots Indicator phía dưới Carousel */}
      {showControls && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(maxIndex + 1)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Chuyển tới trang slide ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === i 
                  ? "bg-slate-800 w-6" 
                  : "bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
