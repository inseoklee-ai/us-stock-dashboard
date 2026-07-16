import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { WeightDonut } from "@/components/WeightDonut";
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
  v > 0 ? "text-red-600" : v < 0 ? "text-blue-600" : "text-gray-500";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← 홈
      </Link>
      <h1 className="mt-4 text-2xl font-bold">대시보드</h1>
      <div className="mt-6 space-y-6">{children}</div>
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
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
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

  return (
    <Shell>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{user.email}</span>
        <div className="flex gap-4">
          <Link href="/portfolio" className="text-blue-600 hover:underline">
            포트폴리오 관리
          </Link>
          <SignOutButton />
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400 dark:border-gray-700">
          보유 종목이 없습니다.{" "}
          <Link href="/portfolio" className="text-blue-600 hover:underline">
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

          <p className="text-xs text-gray-400">
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
