import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// 고해상도 SVG 라인 아이콘 (배율 무관 선명, 브랜드 컬러)
const svg = "h-6 w-6";
const IconDashboard = (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M7 15l4-4 3 3 5-6" />
    <path d="M18 8h2v2" />
  </svg>
);
const IconPortfolio = (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
    <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
    <path d="M2.5 12.5h19" />
    <path d="M12 11.5v2.5" />
  </svg>
);
const IconFeed = (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v13a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5Z" />
    <path d="M17 8h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2" />
    <path d="M8 8h5M8 12h5M8 16h3" />
  </svg>
);

const nav = [
  {
    href: "/dashboard",
    title: "대시보드",
    desc: "총 자산 · 전일 대비 · 종목 비중",
    icon: IconDashboard,
  },
  {
    href: "/portfolio",
    title: "포트폴리오",
    desc: "보유 종목 입력 · 평가손익",
    icon: IconPortfolio,
  },
  {
    href: "/feed",
    title: "관심 & 소식",
    desc: "뉴스 · 공시 · 실적 일정",
    icon: IconFeed,
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
          <div className="mt-7 flex justify-center">
            <Link
              href="/login"
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-brand-fg transition hover:bg-brand-strong"
            >
              시작하기
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
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:brightness-105"
              style={{ backgroundColor: "#f7efd2", color: "#1e3a5f" }}
            >
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
