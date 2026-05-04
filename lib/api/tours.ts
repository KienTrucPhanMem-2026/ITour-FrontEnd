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
