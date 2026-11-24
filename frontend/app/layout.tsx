import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Donation Announcement System | Swaminarayan Mandir",
  description: "Devotional donation portal with AI-powered personalized video and Gujarati announcement voiceover.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="gu">
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased bg-[#260101] text-[#FFF8E7] min-h-screen selection:bg-gold-500 selection:text-maroon-900">
        {children}
      </body>
    </html>
  );
}
