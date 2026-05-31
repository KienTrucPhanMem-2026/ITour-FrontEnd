// ============================================================
// Tour Schedules API
// ============================================================
import axiosClient from "./axiosClient";
import type { TourScheduleDTO } from "@/types/api";

/**
 * GET /api/tour-schedules/tour/{tourId}
 */
export async function getSchedulesByTourIdAPI(tourId: string): Promise<TourScheduleDTO[]> {
  const res = await axiosClient.get<TourScheduleDTO[]>(`/tour-schedules/tour/${tourId}`);
  return res.data;
}

/**
 * GET /api/tour-schedules/active
 */
export async function getActiveSchedulesAPI(): Promise<TourScheduleDTO[]> {
  const res = await axiosClient.get<TourScheduleDTO[]>("/tour-schedules/active");
  return res.data;
}
