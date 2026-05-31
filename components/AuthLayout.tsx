"use client";

import Link from "next/link";
import Header from "@/components/Header";
import type { ReactNode } from "react";

/**
 * Shell dùng chung cho các trang Auth (Login, Register, ForgotPassword).
 * Cung cấp: background ảnh, overlay, Header, glassmorphism card, logo iTour.
 */
interface AuthLayoutProps {
  children: ReactNode;
  /** Tagline dưới logo, mặc định "Thế giới trong tay bạn" */
  tagline?: string;
  /** Chiều rộng tối đa của card, mặc định "max-w-md" */
  cardMaxWidth?: string;
}

export default function AuthLayout({
  children,
  tagline = "Thế giới trong tay bạn",
  cardMaxWidth = "max-w-md",
}: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen w-full relative flex flex-col overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920')",
      }}
    >
      {/* Fix autofill màu nền trắng trên Chrome */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s !important;
          box-shadow: inset 0 0 20px 20px rgba(255,255,255,0.01) !important;
        }
      `}</style>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-20">
        <Header logoSrc="/assets/3-3.png" />
      </div>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div
          className={`relative w-full ${cardMaxWidth} bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-10`}
        >
          {/* Decorative handle bar */}
          <div className="h-1.5 w-32 bg-white/30 rounded-full mx-auto mb-6" />

          {/* Logo + tagline */}
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/">
              <img
                src="/assets/3-5.png"
                alt="iTour Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold mt-3 italic">
              {tagline}
            </span>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
