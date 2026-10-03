import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trip Tracker",
  description: "Route, trip summary, and travel planner",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="flex gap-6 border-b px-6 py-3">
          <Link href="/" className="font-medium hover:text-blue-600">
            Route &amp; Checkpoints
          </Link>
          <Link href="/summary" className="font-medium hover:text-blue-600">
            Trip Summary
          </Link>
          <Link href="/planner" className="font-medium hover:text-blue-600">
            Travel Planner
          </Link>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
