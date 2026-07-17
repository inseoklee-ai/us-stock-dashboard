import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { WeightDonut } from "@/components/WeightDonut";
import { AssetHistoryChart } from "@/components/AssetHistoryChart";
import { getQuotes, quotesEnabled } from "@/lib/quotes";
import { getUsdKrwRate } from "@/lib/fx";
import { computePortfolio } from "@/lib/portfolio";
import {
  formatKRW,
  formatPct,
  formatSignedKRW,
  formatSignedUSD,
  formatUSD,
} from "@/lib/format";
import type { Holding } from "@/lib/types";

const gainColor = (v: number) =>
  v > 0 ? "text-up" : v < 0 ? "text-down" : "text-muted";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
      <div className="mt-6 space-y-5">{children}</div>
    </main>
  );
}

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1.5">{children}</div>
    </Card>
  );
}

export default async function DashboardPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!configured) {
    return (
      <Shell>
        <p className="text-sm text-gray-500">Supabase 설정이 필요합니다.</p>
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
        <p className="text-sm text-gray-500">로그인이 필요합니다.</p>
      </Shell>
    );
  }

  const { data } = await supabase
    .from("holdings")
    .select("*")
    .order("created_at", { ascending: true });
  const holdings = (data ?? []) as Holding[];

  const [quotes, fx] = await Promise.all([
    getQuotes(holdings.map((h) => h.ticker)),
    getUsdKrwRate(),
  ]);
  const totals = computePortfolio(holdings, quotes, fx?.rate ?? null);
  const enabled = quotesEnabled();
  const showValue = enabled && totals.valuedAll;
  const mainUsd = showValue ? totals.totalValue : totals.totalCost;
  const krwGain = totals.fxBreakdownAvailable
    ? totals.totalGainKrw
    : fx
      ? totals.totalGain * fx.rate
      : null;

  // 방문 기반 자산 스냅샷: 시세를 모두 구했고 환율이 있을 때 오늘 값 기록 (하루 1건 upsert)
  if (showValue && fx) {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("portfolio_snapshots").upsert(
      {
        user_id: user.id,
        snapshot_date: today,
        total_usd: Math.round(totals.totalValue * 100) / 100,
        total_krw: Math.round(totals.totalValue * fx.rate * 100) / 100,
        fx_rate: fx.rate,
      },
      { onConflict: "user_id,snapshot_date" },
    );
  }

  const { data: snaps } = await supabase
    .from("portfolio_snapshots")
    .select("snapshot_date,total_krw")
    .order("snapshot_date", { ascending: true });
  const historyPoints = (
    (snaps ?? []) as { snapshot_date: string; total_krw: number }[]
  ).map((s) => ({ date: s.snapshot_date, krw: Number(s.total_krw) }));

  return (
    <Shell>
      {holdings.length === 0 ? (
        <div className="themed rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          보유 종목이 없습니다.{" "}
          <Link href="/portfolio" className="font-medium text-brand hover:underline">
            포트폴리오
          </Link>
          에서 종목을 추가하세요.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label={showValue ? "총 자산" : "총 매수금액"}>
              <div className="text-2xl font-bold tabular-nums">
                {formatUSD(mainUsd)}
              </div>
              <div className="text-sm text-gray-500 tabular-nums">
                {fx ? formatKRW(mainUsd * fx.rate) : "원화 환산 불가"}
              </div>
            </StatCard>

            <StatCard label="전일 대비">
              {totals.dayChangeAvailable ? (
                <>
                  <div
                    className={`text-2xl font-bold tabular-nums ${gainColor(
                      totals.dayChange,
                    )}`}
                  >
                    {formatPct(totals.dayChangePct)}
                  </div>
                  <div
                    className={`text-sm tabular-nums ${gainColor(totals.dayChange)}`}
                  >
                    {formatSignedUSD(totals.dayChange)}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold text-gray-400">—</div>
              )}
            </StatCard>

            <StatCard label="총 평가손익">
              {showValue ? (
                <>
                  <div
                    className={`text-2xl font-bold tabular-nums ${gainColor(
                      totals.totalGain,
                    )}`}
                  >
                    {formatPct(totals.totalGainPct)}
                  </div>
                  <div
                    className={`text-sm tabular-nums ${gainColor(totals.totalGain)}`}
                  >
                    {formatSignedUSD(totals.totalGain)}
                    {krwGain !== null ? ` · ${formatSignedKRW(krwGain)}` : ""}
                  </div>
                  {totals.fxBreakdownAvailable && (
                    <div className="mt-0.5 text-xs text-gray-500">
                      환차{" "}
                      <span className={gainColor(totals.totalFxGainKrw)}>
                        {formatSignedKRW(totals.totalFxGainKrw)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-2xl font-bold text-gray-400">—</div>
              )}
            </StatCard>
          </div>

          <WeightDonut rows={totals.rows} />

          <AssetHistoryChart points={historyPoints} />

          <p className="text-xs text-muted/80">
            {fx
              ? `적용 환율: $1 = ${formatKRW(fx.rate)}${fx.date ? ` (${fx.date} 기준)` : ""} · `
              : ""}
            지연 시세 기준(약 15분). 투자 참고용이며 투자자문이 아닙니다.
          </p>
        </>
      )}
    </Shell>
  );
}
