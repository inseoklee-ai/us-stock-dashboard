import type { PortfolioTotals } from "@/lib/portfolio";
import type { FxRate } from "@/lib/fx";
import {
  formatKRW,
  formatPct,
  formatSignedKRW,
  formatSignedUSD,
  formatUSD,
} from "@/lib/format";

type Props = {
  totals: PortfolioTotals;
  fx: FxRate | null;
  quotesEnabled: boolean;
};

const gainColor = (v: number) =>
  v > 0 ? "text-red-600" : v < 0 ? "text-blue-600" : "text-gray-500";

export function PortfolioSummary({ totals, fx, quotesEnabled }: Props) {
  const showValue = quotesEnabled && totals.valuedAll;
  const usdMain = showValue ? totals.totalValue : totals.totalCost;
  const mainLabel = showValue ? "총 평가금액" : "총 매수금액";

  // 원화 손익: 환차손익 분해가 가능하면 정확한 총액, 아니면 현재환율 근사
  const krwGain = totals.fxBreakdownAvailable
    ? totals.totalGainKrw
    : fx
      ? totals.totalGain * fx.rate
      : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* 총 평가금액 */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="text-xs text-gray-500">{mainLabel}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {formatUSD(usdMain)}
          </div>
          <div className="text-sm text-gray-500 tabular-nums">
            {fx ? formatKRW(usdMain * fx.rate) : "원화 환산 불가"}
          </div>
        </div>

        {/* 총 평가손익 (+ 환차손익 분해) */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="text-xs text-gray-500">총 평가손익</div>
          {showValue ? (
            <>
              <div
                className={`mt-1 text-2xl font-bold tabular-nums ${gainColor(
                  totals.totalGain,
                )}`}
              >
                {formatSignedUSD(totals.totalGain)}
                <span className="ml-2 text-base">
                  ({formatPct(totals.totalGainPct)})
                </span>
              </div>
              {krwGain !== null && (
                <div className={`text-sm tabular-nums ${gainColor(krwGain)}`}>
                  {formatSignedKRW(krwGain)}
                </div>
              )}
              {totals.fxBreakdownAvailable && (
                <div className="mt-1 flex gap-3 text-xs">
                  <span className="text-gray-500">
                    주식{" "}
                    <span className={gainColor(totals.totalStockGainKrw)}>
                      {formatSignedKRW(totals.totalStockGainKrw)}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    환차{" "}
                    <span className={gainColor(totals.totalFxGainKrw)}>
                      {formatSignedKRW(totals.totalFxGainKrw)}
                    </span>
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-1 text-2xl font-bold text-gray-400">—</div>
          )}
        </div>
      </div>

      {/* 환차손익 계산 불가 안내 */}
      {showValue && fx && !totals.fxBreakdownAvailable && (
        <p className="text-xs text-amber-600">
          ※ 환차손익 분해를 보려면 아래 표에서{" "}
          {totals.missingFxTickers.length > 0
            ? `${totals.missingFxTickers.join(", ")} 의 `
            : ""}
          매수 환율을 입력하세요. (원화 손익은 현재 환율로 근사 표시 중)
        </p>
      )}

      {/* 적용 환율 */}
      <p className="text-xs text-gray-400">
        {fx
          ? `적용 환율: $1 = ${formatKRW(fx.rate)}${fx.date ? ` (${fx.date} 기준)` : ""}`
          : "환율 정보를 가져오지 못했습니다. USD만 표시합니다."}
      </p>
    </div>
  );
}
