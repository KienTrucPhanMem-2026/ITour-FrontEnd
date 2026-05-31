// ============================================================
// Reviews API
// ============================================================
import axiosClient from "./axiosClient";

export interface ReviewDTO {
  id?: string;
  customerId: string;
  customerName?: string;
  bookingId?: string;
  tourId?: string;
  tourGuideId?: string;
  tourGuideName?: string;
  rating?: number;
  comment?: string;
  tourRating?: number;
  tourComment?: string;
  guideRating?: number;
  guideComment?: string;
  reviewType?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

export const getReviewsByTourAPI = async (tourId: string): Promise<ReviewDTO[]> => {
  const res = await axiosClient.get<ReviewDTO[]>(`/reviews/tour/${tourId}/latest`);
  return res.data;
};

export const getReviewByBookingAPI = async (bookingId: string): Promise<ReviewDTO> => {
  const res = await axiosClient.get<ReviewDTO>(`/reviews/booking/${bookingId}`);
  return res.data;
};

export const createReviewAPI = async (review: ReviewDTO): Promise<ReviewDTO> => {
  const res = await axiosClient.post<ReviewDTO>("/reviews", review);
  return res.data;
};

export const updateReviewAPI = async (id: string, review: ReviewDTO): Promise<ReviewDTO> => {
  const res = await axiosClient.put<ReviewDTO>(`/reviews/${id}`, review);
  return res.data;
};

export const deleteReviewAPI = async (id: string): Promise<void> => {
  await axiosClient.delete(`/reviews/${id}`);
};
