// ============================================================
// Users API — profile actions
// ============================================================
import { apiFetch } from "./config";
import type { ApiResponse, UserProfile, UpdateProfileRequest } from "@/types/api";

/**
 * GET /api/users/{id}/profile
 */
export async function getUserProfileAPI(id: string): Promise<UserProfile> {
  const res = await apiFetch<ApiResponse<UserProfile>>(`/users/${id}/profile`, {
    method: "GET",
  });
  return res.data;
}

/**
 * PUT /api/users/{id}/profile
 */
export async function updateUserProfileAPI(
  id: string,
  data: UpdateProfileRequest
): Promise<UserProfile> {
  const res = await apiFetch<ApiResponse<UserProfile>>(`/users/${id}/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}
