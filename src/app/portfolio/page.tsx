import { createClient } from "@/lib/supabase/server";
import { AddHoldingForm } from "@/components/AddHoldingForm";
import { HoldingsTable } from "@/components/HoldingsTable";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { getQuotes, quotesEnabled } from "@/lib/quotes";
import { getUsdKrwRate } from "@/lib/fx";
import { computePortfolio } from "@/lib/portfolio";
import type { Holding } from "@/lib/types";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">포트폴리오</h1>
      <p className="mt-2 text-sm text-muted">
        보유 종목(티커 · 수량 · 매수단가)을 입력하고 관리합니다.
      </p>
      <div className="mt-6 space-y-5">{children}</div>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm dark:border-amber-800/60 dark:bg-amber-950/30">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-muted">{body}</p>
    </div>
  );
}

export default async function PortfolioPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!configured) {
    return (
      <Shell>
        <Notice
          title="Supabase 설정이 필요합니다"
          body=".env.local 에 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 를 채우고 supabase/schema.sql 을 실행하세요."
        />
      </Shell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <Notice
          title="로그인이 필요합니다"
          body="포트폴리오는 로그인한 사용자별로 저장됩니다. (로그인 UI는 다음 단계에서 추가 예정)"
        />
      </Shell>
    );
  }

  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <Shell>
        <Notice title="데이터를 불러오지 못했습니다" body={error.message} />
      </Shell>
    );
  }

  const holdings = (data ?? []) as Holding[];

  // 시세와 환율을 병렬로 조회
  const [quotes, fx] = await Promise.all([
    getQuotes(holdings.map((h) => h.ticker)),
    getUsdKrwRate(),
  ]);
  const totals = computePortfolio(holdings, quotes, fx?.rate ?? null);
  const enabled = quotesEnabled();

  return (
    <Shell>
      {holdings.length > 0 && (
        <PortfolioSummary totals={totals} fx={fx} quotesEnabled={enabled} />
      )}
      <AddHoldingForm />
      <HoldingsTable totals={totals} quotesEnabled={enabled} />
    </Shell>
  );
}
