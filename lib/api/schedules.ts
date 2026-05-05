// ============================================================
// Tour Schedules API
// ============================================================
import { apiFetch } from "./config";
import type { TourScheduleDTO } from "@/types/api";

/**
 * GET /api/tour-schedules/tour/{tourId} — Lấy danh sách schedule theo tourId
 */
export async function getSchedulesByTourIdAPI(tourId: string): Promise<TourScheduleDTO[]> {
  return apiFetch<TourScheduleDTO[]>(`/tour-schedules/tour/${tourId}`);
}

/**
 * GET /api/tour-schedules/active — Lấy danh sách schedule đang active
 */
export async function getActiveSchedulesAPI(): Promise<TourScheduleDTO[]> {
  return apiFetch<TourScheduleDTO[]>("/tour-schedules/active");
}
