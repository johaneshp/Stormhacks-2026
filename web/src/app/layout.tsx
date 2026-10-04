import type { Metadata } from "next";
import { Abel } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const abel = Abel({
  variable: "--font-abel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Trace | Trip Tracker",
  description: "Route, trip summary, and travel planner",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${abel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="site-nav">
          <Link href="/" className="brand">Trace</Link>
          <div className="nav-links">
            <Link href="/">Your route</Link>
            <Link href="/summary">Memories</Link>
            <Link href="/planner">Plan a trip</Link>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
