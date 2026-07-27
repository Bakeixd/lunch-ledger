import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "점심정산",
    description: "업체별 점심 주문과 개인별 납부 금액을 함께 관리하세요.",
    openGraph: { title: "점심정산", description: "먹은 만큼만, 정확하게.", images: [image] },
    twitter: { card: "summary_large_image", title: "점심정산", description: "먹은 만큼만, 정확하게.", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
