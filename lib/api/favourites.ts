// ============================================================
// Favourites API
// ============================================================
import { apiFetch } from "./config";
import type { ApiResponse, TourDTO } from "@/types/api";

/**
 * GET /api/favourites/customer/{customerId}/tours
 */
export async function getFavouriteToursAPI(customerId: string): Promise<TourDTO[]> {
  const res = await apiFetch<TourDTO[]>(`/favourites/customer/${customerId}/tours`, {
    method: "GET",
  });
  // Note: Backend method returns direct List<TourDTO> without wrapped ApiResponse? 
  // Wait, Backend FavouriteController had: public ResponseEntity<List<TourDTO>> findToursByCustomerId
  // Correct, no ApiResponse wrapper there! Wait, let me check FavouriteController.java line 18 code again.
  return res || [];
}

/**
 * POST /api/favourites
 */
export async function addFavouriteAPI(customerId: string, tourId: string): Promise<any> {
  const res = await apiFetch<any>(`/favourites`, {
    method: "POST",
    body: JSON.stringify({
      id: `fav-${Date.now()}`, // Basic client gen or handle in server
      customer: { id: customerId },
      tour: { id: tourId }
    }),
  });
  return res;
}

/**
 * DELETE /api/favourites/remove/{customerId}/{tourId}
 */
export async function removeFavouriteAPI(customerId: string, tourId: string): Promise<void> {
  await apiFetch<void>(`/favourites/remove/${customerId}/${tourId}`, {
    method: "DELETE",
  });
}

/**
 * GET /api/favourites/check/{customerId}/{tourId}
 */
export async function checkIsFavouriteAPI(customerId: string, tourId: string): Promise<boolean> {
  const res = await apiFetch<boolean>(`/favourites/check/${customerId}/${tourId}`, {
    method: "GET",
  });
  return res;
}
