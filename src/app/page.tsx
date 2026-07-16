import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

const nav = [
  { href: "/dashboard", title: "대시보드", desc: "총 자산 · 전일 대비 · 종목 비중" },
  { href: "/portfolio", title: "포트폴리오", desc: "보유 종목 입력 · 평가손익" },
  { href: "/feed", title: "관심 & 소식", desc: "뉴스 · 공시 · 실적 일정" },
];

export default async function Home() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let userEmail: string | null = null;
  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">미국주식 자산 대시보드</h1>
          <p className="mt-2 text-gray-500">
            내 포트폴리오 현황과 관심 종목 소식을 한 곳에서.
          </p>
        </div>

        {userEmail ? (
          <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
            <span className="text-gray-500">{userEmail}</span>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded border border-gray-300 px-3 py-1.5 text-sm hover:border-gray-500 dark:border-gray-700"
          >
            로그인
          </Link>
        )}
      </div>

      <nav className="grid gap-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-gray-200 p-5 transition hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600"
          >
            <div className="text-lg font-semibold">{item.title}</div>
            <div className="text-sm text-gray-500">{item.desc}</div>
          </Link>
        ))}
      </nav>

      <p className="text-xs text-gray-400">
        ⚠️ 투자 참고용이며 투자자문이 아닙니다. 시세는 지연될 수 있습니다.
      </p>
    </main>
  );
}
