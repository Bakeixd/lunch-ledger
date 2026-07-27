import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "도시락 장부",
  description: "날짜별 점심 도시락 식사 기록과 개인별 금액을 간편하게 정산하세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
