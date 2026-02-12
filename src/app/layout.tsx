import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/lib/auth";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CleanBag - Food Delivery Bag Cleaning Marketplace",
  description: "Professional bag cleaning services for food delivery drivers in Cyprus",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CleanBag",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
