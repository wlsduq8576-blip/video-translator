import type { Metadata } from "next";
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
  title: "비디오 & 링크 한국어 스크립트 번역기 | Antigravity",
  description: "유튜브, 인스타그램 비디오 및 로컬 파일의 대본을 AI로 분석해 한국어로 번역하고 타임스탬프를 제공하는 스크립트 번역기입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
