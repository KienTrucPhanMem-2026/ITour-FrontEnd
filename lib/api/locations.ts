// ============================================================
// Locations API
// ============================================================
import axiosClient from "./axiosClient";

export interface LocationDTO {
  id: string;
  name: string;
  type: "COUNTRY" | "CITY_PROVINCE" | "ATTRACTION";
  description?: string;
  address?: string;
  parentId?: string | null;
}

/**
 * GET /api/locations — Lấy toàn bộ danh sách location (mọi type)
 */
export async function getLocationsAPI(): Promise<LocationDTO[]> {
  const res = await axiosClient.get<LocationDTO[]>("/locations");
  return res.data;
}
