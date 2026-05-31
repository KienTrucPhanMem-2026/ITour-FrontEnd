// ============================================================
// Payment API — MoMo Payment Gateway Integration
// ============================================================
import axiosClient from "./axiosClient";
import type { ApiResponse, MomoCreatePaymentResponse, BookingRequestDTO } from "@/types/api";

/**
 * POST /api/checkout/momo — Create MoMo payment for booking
 */
export async function createMomoPaymentAPI(
  bookingRequest: BookingRequestDTO
): Promise<MomoCreatePaymentResponse> {
  const res = await axiosClient.post<ApiResponse<MomoCreatePaymentResponse>>(
    "/checkout/momo",
    bookingRequest
  );
  return res.data.data;
}

/**
 * GET /api/checkout/momo/return — MoMo redirect return URL (for reference)
 */
export function getMomoReturnUrl(): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/payment/confirmation`;
}
