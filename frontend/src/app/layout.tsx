import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GCID — Global Conflict Intelligence Dashboard",
  description:
    "Real-time OSINT monitoring platform for global military activity, maritime movement, conflict events, and news.",
  keywords: ["OSINT", "conflict", "intelligence", "dashboard", "military", "maritime"],
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased overflow-hidden">{children}</body>
    </html>
  );
}
