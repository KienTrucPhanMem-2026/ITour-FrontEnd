"use client";

import { Suspense } from "react";
import LoginPage from "@/components/LoginPage";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
