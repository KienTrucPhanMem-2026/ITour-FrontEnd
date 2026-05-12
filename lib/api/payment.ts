// ============================================================
// Payment API — MoMo Payment Gateway Integration
// ============================================================
import { apiFetch } from "./config";
import type { ApiResponse, MomoCreatePaymentResponse, BookingRequestDTO } from "@/types/api";

/**
 * POST /api/checkout/momo — Create MoMo payment for booking
 * Creates booking + MoMo payment link in single request
 * Returns payUrl for redirect
 */
export async function createMomoPaymentAPI(
  bookingRequest: BookingRequestDTO
): Promise<MomoCreatePaymentResponse> {
  const res = await apiFetch<ApiResponse<MomoCreatePaymentResponse>>(
    "/checkout/momo",
    {
      method: "POST",
      body: JSON.stringify(bookingRequest),
    }
  );
  return res.data;
}

/**
 * GET /api/checkout/momo/return — MoMo redirect return (for reference)
 * User is redirected here after payment attempt
 */
export function getMomoReturnUrl(): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/payment/confirmation`;
}
