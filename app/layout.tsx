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
  title: "한평생원격교육원 실습비 결제",
  description: "한평생원격교육원 실습비 결제 페이지입니다. 이름과 휴대폰 번호를 입력하고 나이스페이로 안전하게 결제하세요.",
  openGraph: {
    title: "한평생원격교육원 실습비 결제",
    description: "한평생원격교육원 실습비 결제 페이지입니다. 이름과 휴대폰 번호를 입력하고 나이스페이로 안전하게 결제하세요.",
    images: [
      {
        url: "/og-image.png",
        width: 800,
        height: 540,
        alt: "한평생원격교육원 실습비 결제",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "한평생원격교육원 실습비 결제",
    description: "한평생원격교육원 실습비 결제 페이지입니다. 이름과 휴대폰 번호를 입력하고 나이스페이로 안전하게 결제하세요.",
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
