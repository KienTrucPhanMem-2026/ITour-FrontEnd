'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

/**
 * Hook để bảo vệ các trang yêu cầu login
 * Nếu user chưa login, sẽ redirect đến /login với redirect parameter
 * Returns: isReady (boolean) để page biết có render hay không
 */
export function useProtectedRoute() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      // User chưa login → redirect đến login với redirect URL
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      }
    } else {
      // User đã login → cho phép render page
      setIsReady(true);
    }
  }, [router]);

  return isReady;
}
