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
