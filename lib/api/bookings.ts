// ============================================================
// Bookings API
// ============================================================
import axiosClient from "./axiosClient";
import type { ApiResponse, BookingRequestDTO, BookingResponseDTO } from "@/types/api";

/**
 * GET /api/bookings/customer/{customerId} — Lấy danh sách bookings của user
 */
export async function getMyBookingsAPI(customerId: string): Promise<BookingResponseDTO[]> {
  const res = await axiosClient.get<ApiResponse<BookingResponseDTO[]>>(
    `/bookings/customer/${customerId}`
  );
  return res.data.data || [];
}

/**
 * POST /api/bookings — Tạo booking mới
 */
export async function createBookingAPI(dto: BookingRequestDTO): Promise<BookingResponseDTO> {
  const res = await axiosClient.post<ApiResponse<BookingResponseDTO>>("/bookings", dto);
  return res.data.data;
}

/**
 * POST /api/bookings/{id}/cancel — Hủy booking
 */
export async function cancelBookingAPI(bookingId: string): Promise<BookingResponseDTO> {
  const res = await axiosClient.post<ApiResponse<BookingResponseDTO>>(
    `/bookings/${bookingId}/cancel`
  );
  return res.data.data;
}

/**
 * GET /api/bookings/{id}/payment-url
 */
export async function getBookingPaymentUrlAPI(bookingId: string): Promise<BookingResponseDTO> {
  const res = await axiosClient.get<ApiResponse<BookingResponseDTO>>(
    `/bookings/${bookingId}/payment-url`
  );
  return res.data.data;
}

/**
 * GET /api/bookings/{id} — Lấy chi tiết booking theo ID
 */
export async function getBookingByIdAPI(bookingId: string): Promise<any> {
  const res = await axiosClient.get<any>(`/bookings/${bookingId}`);
  return res.data;
}

/**
 * PUT /api/bookings/{id}/passengers — Cập nhật danh sách hành khách
 */
export async function updateBookingPassengersAPI(
  bookingId: string,
  passengers: any[]
): Promise<any> {
  const res = await axiosClient.put<any>(`/bookings/${bookingId}/passengers`, passengers);
  return res.data;
}

/**
 * POST /api/payment/momo/create?bookingId={bookingId}
 * Khởi tạo liên kết thanh toán MoMo cho booking
 */
export async function createMomoPaymentAPI(
  bookingId: string
): Promise<any> {
  return apiFetch<any>(`/payment/momo/create?bookingId=${bookingId}`, {
    method: "POST",
  });
}

