"use client";

import { useState } from "react";
import type { ReviewDTO } from "@/lib/api/reviews";
import { createReviewAPI } from "@/lib/api/reviews";

interface ReviewFormProps {
  tourId: string;
  customerId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ReviewForm({
  tourId,
  customerId,
  onSuccess,
  onError,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [hasComment, setHasComment] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (hasComment && !comment.trim()) {
      const err = "Vui lòng nhập bình luận";
      setError(err);
      onError?.(err);
      return;
    }

    if (hasComment && comment.length < 5) {
      const err = "Bình luận phải có ít nhất 5 ký tự";
      setError(err);
      onError?.(err);
      return;
    }

    setLoading(true);

    try {
      const review: ReviewDTO = {
        customerId,
        tourId,
        rating,
        comment: hasComment ? comment : "",
      };

      console.log("Submitting review:", review);

      await createReviewAPI(review);
      setSuccess(true);
      setComment("");
      setRating(5);
      setHasComment(true);
      onSuccess?.();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Không thể tạo đánh giá";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
    >
      <h3 className="font-bold text-lg text-gray-900">Chia sẻ đánh giá của bạn</h3>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Đánh giá ({rating}/5)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl transition-colors ${
                star <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Comment Toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasComment}
            onChange={(e) => setHasComment(e.target.checked)}
            className="w-4 h-4 text-sky-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            Thêm bình luận (tùy chọn)
          </span>
        </label>
      </div>

      {/* Comment */}
      {hasComment && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chia sẻ trải nghiệm của bạn
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Bình luận của bạn..."
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/500 ký tự
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ Đánh giá của bạn đã được gửi thành công!
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
      >
        {loading ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </form>
  );
}
