// app/admin/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./admin.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Sokoban Admin Panel",
  description: "Admin panel for Sokoban puzzle game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: `${roboto.style.fontFamily}, sans-serif` }}>
        {children}
      </body>
    </html>
  );
}
