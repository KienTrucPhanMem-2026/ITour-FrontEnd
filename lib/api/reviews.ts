import { API_BASE_URL } from "./config";

export interface ReviewDTO {
  id?: string;
  customerId: string;
  customerName?: string;
  bookingId?: string;
  tourId?: string;
  tourGuideId?: string;
  tourGuideName?: string;
  rating?: number;        // backward compatibility
  comment?: string;       // backward compatibility
  tourRating?: number;
  tourComment?: string;
  guideRating?: number;
  guideComment?: string;
  reviewType?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

export const getReviewsByTourAPI = async (
  tourId: string
): Promise<ReviewDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/reviews/tour/${tourId}/latest`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  return response.json();
};

export const getReviewByBookingAPI = async (
  bookingId: string
): Promise<ReviewDTO> => {
  const response = await fetch(`${API_BASE_URL}/reviews/booking/${bookingId}`);
  if (!response.ok) throw new Error("Failed to fetch review for this booking");
  return response.json();
};

export const createReviewAPI = async (review: ReviewDTO): Promise<ReviewDTO> => {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
  });
  if (!response.ok) throw new Error("Failed to create review");
  return response.json();
};

export const updateReviewAPI = async (
  id: string,
  review: ReviewDTO
): Promise<ReviewDTO> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
  });
  if (!response.ok) throw new Error("Failed to update review");
  return response.json();
};

export const deleteReviewAPI = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete review");
};
