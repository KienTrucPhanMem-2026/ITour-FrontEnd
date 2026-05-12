// ============================================================
// API Types — khớp với Spring Boot Backend DTOs
// ============================================================

// ---------- Auth ----------
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  address?: string;
}

/** LoginResponse từ backend (accessToken đã bị null bởi server) */
export interface UserProfile {
  id: string;
  userName: string;
  role: string;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  dateOfBirth?: string;
  point?: number; // Add point support for Customer view
  createdAt?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string; // yyyy-MM-dd
}

/** Wrapper chung cho mọi response */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path?: string;
}

// ---------- Tour ----------
export interface TourLocationDTO {
  id: string;
  locationName?: string;       // Location name
  visitOrder?: number;         // Day 1, Day 2, etc
  days?: number;               // How many days at this location
  note?: string;               // Description/activities
}

export interface TourDTO {
  id: string;
  name: string;
  description?: string;
  tourType?: string;
  price?: number;
  priceType?: string;
  rating?: number;
  startDate?: string;        // LocalDate → string (ISO)
  durationDays?: number;
  durationNights?: number;
  maximumSlots?: number;
  minPeople?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  schedules?: TourScheduleDTO[];     // Tour schedules from backend
  startDestinationName?: string;     // Location name for filter
  endDestinationName?: string;       // Location name for filter
  availableSlots?: number;           // Available slots
  vehicleType?: string;              // Vehicle type
  images?: string[];                 // Tour images URLs
  itinerary?: TourLocationDTO[];     // Tour itinerary (day 1, 2, 3 locations)
}

// ---------- TourSchedule ----------
export interface TourScheduleDTO {
  id: string;
  startDate?: string;        // LocalDate (ISO format)
  endDate?: string;          // LocalDate (ISO format)
  price?: number;
  bookedPeople?: number;
  availableSlot?: number;
  isActive?: boolean;
  note?: string;
}

// ---------- Booking ----------
export type PaymentMethod = "VNPAY" | "CREDITCARD" | "MOMO";

export interface BookingRequestDTO {
  customerId: string;
  tourId: string;
  tourScheduleId: string;
  discountId?: string;
  adults: number;
  children: number;
  paymentMethod: PaymentMethod;
}

export interface BookingResponseDTO {
  bookingId: string;
  customerId: string;
  customerName?: string;
  tourId: string;
  tourName?: string;
  tourScheduleId: string;
  discountId?: string;
  discountCode?: string;
  adults: number;
  children: number;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
  paymentMethod: PaymentMethod;
  status: string;
  paymentStatus?: string;
  bookingDate?: string;
  pointEarned?: number;
  customerTotalPoint?: number;
  message?: string;
}
