// ============================================================
// Users API — profile actions
// ============================================================
import axiosClient from "./axiosClient";
import type { ApiResponse, UserProfile, UpdateProfileRequest } from "@/types/api";

/**
 * GET /api/users/{id}/profile
 */
export async function getUserProfileAPI(id: string): Promise<UserProfile> {
  const res = await axiosClient.get<ApiResponse<UserProfile>>(`/users/${id}/profile`);
  return res.data.data;
}

/**
 * PUT /api/users/{id}/profile
 */
export async function updateUserProfileAPI(
  id: string,
  data: UpdateProfileRequest
): Promise<UserProfile> {
  const res = await axiosClient.put<ApiResponse<UserProfile>>(`/users/${id}/profile`, data);
  return res.data.data;
}

/**
 * GET /api/users/{id}/vouchers
 */
export async function getUserVouchersAPI(id: string): Promise<any[]> {
  const res = await axiosClient.get<ApiResponse<any[]>>(`/users/${id}/vouchers`);
  return res.data.data;
}
