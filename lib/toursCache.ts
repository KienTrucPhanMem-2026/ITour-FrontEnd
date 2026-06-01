import type { TourDTO } from "@/types/api";

const CACHE_KEY = "itour_all_tours_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

interface ToursCache {
  data: TourDTO[];
  timestamp: number;
}

/** Lưu danh sách tours vào sessionStorage */
export function saveTourCache(tours: TourDTO[]): void {
  if (typeof window === "undefined") return;
  try {
    const cache: ToursCache = { data: tours, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Đọc tours từ sessionStorage.
 * Trả về mảng nếu cache còn hạn, null nếu không có hoặc đã hết hạn.
 */
export function loadTourCache(): TourDTO[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: ToursCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cache.data;
  } catch {
    return null;
  }
}

/** Xoá cache (dùng khi cần force-refresh) */
export function clearTourCache(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CACHE_KEY);
}
