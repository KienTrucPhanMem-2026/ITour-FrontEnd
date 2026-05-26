"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Providers } from "./providers";
import "./globals.css";

import ChatWidget from "@/components/ChatWidget";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Check if user is logged in on client side
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const user = localStorage.getItem("user");
    
    if (isLoggedIn && user) {
      // User is logged in
      console.log("User logged in:", JSON.parse(user));
    }
  }, []);

  return (
    <html lang="vi">
      <head>
        <title>Du Lịch Việt - Khám Phá Đất Nước</title>
        <meta name="description" content="Trang web du lịch Việt Nam" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#F5F8F8]">
        <Providers>
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
