"use client";

import { useState, useEffect } from "react";
import type { ReviewDTO } from "@/lib/api/reviews";
import { getReviewsByTourAPI } from "@/lib/api/reviews";

interface ReviewListProps {
  tourId: string;
  refreshTrigger?: number;
}

type SortType = "latest" | "rating-high" | "rating-low" | "has-comment";

export default function ReviewList({ tourId, refreshTrigger = 0 }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>("latest");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getReviewsByTourAPI(tourId);
        setReviews(data);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Không thể tải đánh giá";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [tourId, refreshTrigger]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const sortReviews = (reviewsToSort: ReviewDTO[]): ReviewDTO[] => {
    const sorted = [...reviewsToSort];
    
    switch (sortBy) {
      case "latest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      
      case "rating-high":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      case "rating-low":
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      
      case "has-comment":
        return sorted.sort((a, b) => {
          const aHasComment = (a.comment?.trim()?.length || 0) > 0 ? 1 : 0;
          const bHasComment = (b.comment?.trim()?.length || 0) > 0 ? 1 : 0;
          return bHasComment - aHasComment;
        });
      
      default:
        return sorted;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Lỗi: {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">Chưa có đánh giá nào.</p>
        <p className="text-gray-400 text-xs">Hãy là người đầu tiên đánh giá tour này!</p>
      </div>
    );
  }

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : 0;

  const sortedReviews = sortReviews(reviews);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{avgRating}</div>
          <div className="text-xs text-gray-500">trên 5</div>
        </div>
        <div className="flex-1">
          <div className="flex gap-1 mb-2">{renderStars(Math.round(Number(avgRating)))}</div>
          <p className="text-sm text-gray-600">Dựa trên {reviews.length} đánh giá</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">Sắp xếp theo:</p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="latest">Mới nhất</option>
          <option value="rating-high">Đánh giá cao nhất</option>
          <option value="rating-low">Đánh giá thấp nhất</option>
          <option value="has-comment">Có bình luận</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {review.customerName || "Khách hàng"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(review.createdAt)}
                </p>
              </div>
              <div className="flex gap-1">
                {renderStars(review.rating || 0)}
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                "{review.comment}"
              </p>
            )}

            {/* Rating Badge */}
            <div className="inline-block">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                {review.rating}/5 sao
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
