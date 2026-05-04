// ============================================================
// Bookings API
// ============================================================
import { apiFetch } from "./config";
import type { ApiResponse, BookingRequestDTO, BookingResponseDTO } from "@/types/api";

/**
 * POST /api/bookings — Tạo booking mới
 * Yêu cầu cookie JWT hợp lệ (tự gửi qua credentials:include).
 */
export async function createBookingAPI(
  dto: BookingRequestDTO
): Promise<BookingResponseDTO> {
  const res = await apiFetch<ApiResponse<BookingResponseDTO>>("/bookings", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return res.data;
}
