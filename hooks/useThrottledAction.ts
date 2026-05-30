import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook chống spam action. Trả về hàm `throttle(callback)` — khi gọi sẽ
 * thực thi callback ngay lần đầu, rồi block trong khoảng cooldownMs.
 *
 * Khác với cách truyền action vào constructor, cách này linh hoạt hơn:
 * component truyền callback trực tiếp khi gọi execute.
 *
 * @param cooldownMs - Thời gian cooldown (ms) sau khi gọi action
 * @returns { execute, isBlocked, remainingMs, reset }
 *
 * @example
 * const { execute, isBlocked } = useThrottledAction(2000);
 * <button onClick={() => execute(() => handleSend(text))} disabled={isBlocked}>Gửi</button>
 */
export function useThrottledAction(cooldownMs: number) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blockedRef = useRef(false); // Sync ref to avoid stale closure in rapid calls

  const execute = useCallback(
    (callback: () => any) => {
      if (blockedRef.current) return;

      blockedRef.current = true;
      setIsBlocked(true);
      setRemainingMs(cooldownMs);

      // Countdown interval — cập nhật mỗi 100ms để hiển thị countdown nếu cần
      intervalRef.current = setInterval(() => {
        setRemainingMs((prev) => Math.max(0, prev - 100));
      }, 100);

      // Mở khoá sau cooldown
      timerRef.current = setTimeout(() => {
        blockedRef.current = false;
        setIsBlocked(false);
        setRemainingMs(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }, cooldownMs);

      // Gọi callback
      return callback();
    },
    [cooldownMs]
  );

  // Reset — cho phép component chủ động mở khoá
  const reset = useCallback(() => {
    blockedRef.current = false;
    setIsBlocked(false);
    setRemainingMs(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { execute, isBlocked, remainingMs, reset };
}
