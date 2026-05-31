// ============================================================
// Tours API
// ============================================================
import axiosClient from "./axiosClient";
import type { TourDTO } from "@/types/api";

/**
 * GET /api/tours — Lấy toàn bộ danh sách tour
 */
export async function getToursAPI(): Promise<TourDTO[]> {
  const res = await axiosClient.get<TourDTO[]>("/tours");
  return res.data;
}

/**
 * GET /api/tours/{id} — Lấy chi tiết tour theo ID
 */
export async function getTourByIdAPI(id: string): Promise<TourDTO> {
  const res = await axiosClient.get<TourDTO>(`/tours/${id}`);
  return res.data;
}

/**
 * GET /api/tour-itineraries/tour/{tourId}
 */
export async function getTourItinerariesAPI(tourId: string): Promise<any[]> {
  const res = await axiosClient.get<any[]>(`/tour-itineraries/tour/${tourId}`);
  return res.data;
}

/**
 * GET /api/discounts/tour/{tourId}
 */
export async function getDiscountsByTourAPI(tourId: string): Promise<any[]> {
  const res = await axiosClient.get<any[]>(`/discounts/tour/${tourId}`);
  return res.data;
}
