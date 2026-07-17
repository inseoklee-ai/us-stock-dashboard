import type { PortfolioTotals } from "@/lib/portfolio";
import { EditableHoldingRow } from "@/components/EditableHoldingRow";
import { formatPct, formatSignedUSD, formatUSD } from "@/lib/format";

type Props = {
  totals: PortfolioTotals;
  quotesEnabled: boolean;
};

const gainColor = (v: number) =>
  v > 0 ? "text-up" : v < 0 ? "text-down" : "text-muted";

export function HoldingsTable({ totals, quotesEnabled }: Props) {
  const { rows, totalCost, totalValue, totalGain, totalGainPct, valuedAll } =
    totals;

  if (rows.length === 0) {
    return (
      <div className="themed rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
        아직 보유 종목이 없습니다. 위 폼에서 추가하세요.
      </div>
    );
  }

  const showTotals = quotesEnabled && valuedAll;

  return (
    <div className="themed overflow-x-auto rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="py-2 pr-4 font-medium">티커</th>
            <th className="py-2 pr-4 text-right font-medium">수량</th>
            <th className="py-2 pr-4 text-right font-medium">평균단가</th>
            <th className="py-2 pr-4 text-right font-medium">매수환율</th>
            <th className="py-2 pr-4 text-right font-medium">현재가</th>
            <th className="py-2 pr-4 text-right font-medium">평가금액</th>
            <th className="py-2 pr-4 text-right font-medium">평가손익</th>
            <th className="py-2 pl-4 text-right font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <EditableHoldingRow key={r.holding.id} row={r} />
          ))}
        </tbody>
        <tfoot>
          <tr className="font-medium">
            <td className="py-2 pr-4" colSpan={5}>
              합계
            </td>
            <td className="py-2 pr-4 text-right tabular-nums">
              {showTotals ? formatUSD(totalValue) : formatUSD(totalCost)}
            </td>
            <td
              className={`py-2 pr-4 text-right tabular-nums ${
                showTotals ? gainColor(totalGain) : "text-muted"
              }`}
            >
              {showTotals ? (
                <>
                  {formatSignedUSD(totalGain)}
                  <span className="ml-1 text-xs">
                    ({formatPct(totalGainPct)})
                  </span>
                </>
              ) : (
                "—"
              )}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>

      {!quotesEnabled ? (
        <p className="mt-3 text-xs text-amber-600">
          ※ 시세 API 키(STOCK_API_KEY)가 없어 현재가·평가손익을 표시할 수 없습니다.
        </p>
      ) : !valuedAll ? (
        <p className="mt-3 text-xs text-amber-600">
          ※ 일부 종목의 시세를 가져오지 못했습니다 (티커 확인 또는 API 한도). 해당
          종목은 매수금액으로 표시됩니다.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted/80">
          ※ 지연 시세 기준(약 15분). 각 행의 &ldquo;수정&rdquo;으로 수량·평균단가·매수환율을
          고칠 수 있습니다.
        </p>
      )}
    </div>
  );
}
