'use client';

import { useState, useEffect, useCallback } from 'react';

interface TimerState {
  /** Số giây còn lại */
  secondsLeft: number;
  /** Đã hết hạn chưa */
  isExpired: boolean;
  /** Chuỗi hiển thị dạng MM:SS */
  formattedTime: string;
  /** % thời gian đã trôi qua (dùng cho progress bar) */
  progressPercent: number;
}

/**
 * Custom hook countdown timer cho booking expiry.
 *
 * @param expireAt - ISO string hoặc Date object của thời điểm hết hạn
 * @param totalDurationSeconds - Tổng thời gian ban đầu (mặc định 900s = 15 phút)
 * @returns TimerState chứa secondsLeft, isExpired, formattedTime, progressPercent
 *
 * @example
 * const { formattedTime, isExpired, progressPercent } = useBookingTimer(booking.expireAt);
 */
export function useBookingTimer(
  expireAt: string | Date | null | undefined,
  totalDurationSeconds: number = 900
): TimerState {
  const calculateSecondsLeft = useCallback((): number => {
    if (!expireAt) return 0;
    const expireDate = expireAt instanceof Date ? expireAt : new Date(expireAt);
    const diff = Math.floor((expireDate.getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [expireAt]);

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateSecondsLeft);

  useEffect(() => {
    if (!expireAt) return;

    // Tính lại ngay khi expireAt thay đổi
    setSecondsLeft(calculateSecondsLeft());

    const interval = setInterval(() => {
      const remaining = calculateSecondsLeft();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expireAt, calculateSecondsLeft]);

  const isExpired = secondsLeft <= 0;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const elapsed = totalDurationSeconds - secondsLeft;
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDurationSeconds) * 100));

  return { secondsLeft, isExpired, formattedTime, progressPercent };
}
