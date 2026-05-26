// ============================================================
// Tours API
// ============================================================
import { apiFetch } from "./config";
import type { TourDTO } from "@/types/api";

/**
 * GET /api/tours — Lấy toàn bộ danh sách tour
 */
export async function getToursAPI(): Promise<TourDTO[]> {
  return apiFetch<TourDTO[]>("/tours");
}

/**
 * GET /api/tours/{id} — Lấy chi tiết tour theo ID
 */
export async function getTourByIdAPI(id: string): Promise<TourDTO> {
  return apiFetch<TourDTO>(`/tours/${id}`);
}

/**
 * GET /api/tour-itineraries/tour/{tourId} — Lấy danh sách kịch bản lịch trình theo tour ID
 */
export async function getTourItinerariesAPI(tourId: string): Promise<any[]> {
  return apiFetch<any[]>(`/tour-itineraries/tour/${tourId}`);
}
