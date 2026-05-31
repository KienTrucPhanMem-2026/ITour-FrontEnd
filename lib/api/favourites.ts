// ============================================================
// Favourites API
// ============================================================
import axiosClient from "./axiosClient";
import type { TourDTO } from "@/types/api";

/**
 * GET /api/favourites/customer/{customerId}/tours
 */
export async function getFavouriteToursAPI(customerId: string): Promise<TourDTO[]> {
  const res = await axiosClient.get<TourDTO[]>(`/favourites/customer/${customerId}/tours`);
  return res.data || [];
}

/**
 * POST /api/favourites
 */
export async function addFavouriteAPI(customerId: string, tourId: string): Promise<any> {
  const res = await axiosClient.post<any>(`/favourites`, {
    id: `fav-${Date.now()}`,
    customer: { id: customerId, user_type: "CUSTOMER" },
    tour: { id: tourId },
  });
  return res.data;
}

/**
 * DELETE /api/favourites/remove/{customerId}/{tourId}
 */
export async function removeFavouriteAPI(customerId: string, tourId: string): Promise<void> {
  await axiosClient.delete(`/favourites/remove/${customerId}/${tourId}`);
}

/**
 * GET /api/favourites/check/{customerId}/{tourId}
 */
export async function checkIsFavouriteAPI(customerId: string, tourId: string): Promise<boolean> {
  const res = await axiosClient.get<boolean>(`/favourites/check/${customerId}/${tourId}`);
  return res.data;
}
