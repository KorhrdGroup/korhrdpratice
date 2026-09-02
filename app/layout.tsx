import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/base.css";
import "../styles/layout.css";
import "../styles/components.css";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "덧셈원격평생교육원",
  description: "덧셈원격평생교육원",
  openGraph: {
    title: "덧셈원격평생교육원",
    description: "덧셈원격평생교육원",
    images: [
      {
        url: "/og-image.png",
        width: 800,
        height: 540,
        alt: "덧셈원격평생교육원",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "덧셈원격평생교육원",
    description: "덧셈원격평생교육원",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
