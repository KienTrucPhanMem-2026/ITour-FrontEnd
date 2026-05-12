// ============================================================
// Bookings API
// ============================================================
import { apiFetch } from "./config";
import type { ApiResponse, BookingRequestDTO, BookingResponseDTO } from "@/types/api";

/**
 * GET /api/bookings/customer/{customerId} — Lấy danh sách bookings của user
 * Yêu cầu cookie JWT hợp lệ
 */
export async function getMyBookingsAPI(
  customerId: string
): Promise<BookingResponseDTO[]> {
  const res = await apiFetch<ApiResponse<BookingResponseDTO[]>>(
    `/bookings/customer/${customerId}`,
    {
      method: "GET",
    }
  );
  return res.data || [];
}

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

/**
 * POST /api/bookings/{id}/cancel — Hủy booking
 */
export async function cancelBookingAPI(
  bookingId: string
): Promise<BookingResponseDTO> {
  const res = await apiFetch<ApiResponse<BookingResponseDTO>>(
    `/bookings/${bookingId}/cancel`,
    {
      method: "POST",
    }
  );
  return res.data;
}
