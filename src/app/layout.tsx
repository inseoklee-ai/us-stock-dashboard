import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "모두리치 · 미국주식 자산 대시보드",
  description: "내 미국주식 포트폴리오와 관심 종목 소식을 한 곳에서.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 쿠키에 저장된 명시 선택을 서버에서 미리 반영 → 로드 깜빡임/하이드레이션 불일치 없음.
  // 값이 없으면 속성 미설정 → CSS 미디어쿼리로 시스템 자동.
  const theme = (await cookies()).get("theme")?.value;
  const themeAttr = theme === "dark" || theme === "light" ? theme : undefined;

  return (
    <html
      lang="ko"
      data-theme={themeAttr}
      className={`${notoSansKr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppHeader />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
