import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const nav = [
  {
    href: "/dashboard",
    title: "대시보드",
    desc: "총 자산 · 전일 대비 · 종목 비중",
    icon: "📊",
  },
  {
    href: "/portfolio",
    title: "포트폴리오",
    desc: "보유 종목 입력 · 평가손익",
    icon: "💼",
  },
  {
    href: "/feed",
    title: "관심 & 소식",
    desc: "뉴스 · 공시 · 실적 일정",
    icon: "📰",
  },
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
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* 히어로 */}
      <section className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          미국주식 자산 대시보드
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          내 포트폴리오와 관심 종목 소식을
          <br />한 곳에서.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          보유 자산의 총액·손익·환차손익을 한눈에 보고,
          <br className="hidden sm:block" />
          관심 기업의 뉴스·공시·실적을 자동으로 모아 봅니다.
        </p>

        {!userEmail && (
          <div className="mt-7 flex justify-center gap-2">
            <Link
              href="/login"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg transition hover:bg-brand-strong"
            >
              시작하기
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-2"
            >
              둘러보기
            </Link>
          </div>
        )}
      </section>

      {/* 네비 카드 */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="themed group rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-xl">
              {item.icon}
            </div>
            <div className="mt-4 flex items-center gap-1 text-lg font-bold">
              {item.title}
              <span className="text-brand opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100">
                →
              </span>
            </div>
            <div className="mt-1 text-sm text-muted">{item.desc}</div>
          </Link>
        ))}
      </section>

      <p className="mt-10 text-center text-xs text-muted/80">
        ⚠️ 투자 참고용이며 투자자문이 아닙니다. 시세는 지연될 수 있습니다.
      </p>
    </main>
  );
}
