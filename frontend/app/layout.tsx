import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Research Agent",
  description: "Give a topic, get back a structured research brief.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <nav
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "1.5rem 1.5rem 0",
            display: "flex",
            gap: "1.5rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <Link href="/" style={{ fontWeight: 600, textDecoration: "none", color: "inherit" }}>
            Research Agent
          </Link>
          <Link href="/reports" style={{ textDecoration: "none", color: "inherit" }}>
            My reports
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
