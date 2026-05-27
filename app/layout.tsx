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
        <title>ITour - Thế giới trong tay bạn</title>
        <meta name="description" content="Trang web du lịch Việt Nam" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon_io/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon_io/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon_io/favicon-16x16.png" />
        <link rel="manifest" href="/assets/favicon_io/site.webmanifest" />
        <link rel="shortcut icon" href="/assets/favicon_io/favicon.ico" />
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
