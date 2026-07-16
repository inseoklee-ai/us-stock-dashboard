import type { Holding } from "./types";
import type { Quote } from "./quotes";

/** 종목 한 줄의 계산 결과. 시세가 없으면 price/value/gain 은 null. */
export type HoldingRow = {
  holding: Holding;
  cost: number; // 매수금액 (USD)
  price: number | null; // 현재가 (USD)
  value: number | null; // 평가금액 (USD)
  gain: number | null; // 평가손익 (USD)
  gainPct: number | null; // 수익률 (%)
  // 원화 손익 분해 (현재 환율 + 매수 환율이 모두 있을 때만)
  stockGainKrw: number | null; // 주식 손익 (원화)
  fxGainKrw: number | null; // 환차손익 (원화)
  totalGainKrw: number | null; // 총 원화 평가손익
};

export type PortfolioTotals = {
  rows: HoldingRow[];
  totalCost: number; // 총 매수금액 (USD)
  totalValue: number; // 총 평가금액 (USD, 시세 구한 종목 합)
  totalGain: number; // 총 평가손익 (USD)
  totalGainPct: number; // 총 수익률 (%)
  valuedAll: boolean; // 모든 종목의 시세를 구했는지
  dayChange: number; // 전일 대비 손익 (USD)
  dayChangePct: number; // 전일 대비 등락률 (%)
  dayChangeAvailable: boolean;
  // 원화 손익 분해
  totalStockGainKrw: number; // 주식 손익 합 (원화)
  totalFxGainKrw: number; // 환차손익 합 (원화)
  totalGainKrw: number; // 총 원화 평가손익
  fxBreakdownAvailable: boolean; // 모든 평가 종목에 매수 환율이 있고 현재 환율도 있는지
  missingFxTickers: string[]; // 매수 환율이 없어 환차손익을 못 구한 종목
};

/**
 * 보유 종목 + 시세(+ 현재 환율)로 행별 계산과 합계를 산출한다.
 * fxRate 를 주면 원화 손익을 주식손익/환차손익으로 분해한다.
 */
export function computePortfolio(
  holdings: Holding[],
  quotes: Record<string, Quote>,
  fxRate?: number | null,
): PortfolioTotals {
  let totalCost = 0;
  let totalValue = 0;
  let valuedAll = true;

  let prevBase = 0;
  let dayChange = 0;
  let hasPrevAll = true;

  let totalStockGainKrw = 0;
  let totalFxGainKrw = 0;
  const missingFxSet = new Set<string>();

  const rows: HoldingRow[] = holdings.map((holding) => {
    const cost = holding.quantity * holding.avg_price;
    totalCost += cost;

    const quote = quotes[holding.ticker];
    if (!quote) {
      valuedAll = false;
      return {
        holding,
        cost,
        price: null,
        value: null,
        gain: null,
        gainPct: null,
        stockGainKrw: null,
        fxGainKrw: null,
        totalGainKrw: null,
      };
    }

    const value = holding.quantity * quote.price;
    totalValue += value;
    const gain = value - cost;

    if (quote.prevClose != null) {
      prevBase += holding.quantity * quote.prevClose;
      dayChange += holding.quantity * (quote.price - quote.prevClose);
    } else {
      hasPrevAll = false;
    }

    // 원화 손익 분해
    let stockGainKrw: number | null = null;
    let fxGainKrw: number | null = null;
    let totalGainKrw: number | null = null;
    if (fxRate != null) {
      if (holding.buy_fx_rate != null) {
        stockGainKrw =
          holding.quantity * (quote.price - holding.avg_price) * fxRate;
        fxGainKrw =
          holding.quantity * holding.avg_price * (fxRate - holding.buy_fx_rate);
        totalGainKrw = stockGainKrw + fxGainKrw;
        totalStockGainKrw += stockGainKrw;
        totalFxGainKrw += fxGainKrw;
      } else {
        missingFxSet.add(holding.ticker);
      }
    }

    return {
      holding,
      cost,
      price: quote.price,
      value,
      gain,
      gainPct: cost > 0 ? (gain / cost) * 100 : 0,
      stockGainKrw,
      fxGainKrw,
      totalGainKrw,
    };
  });

  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const dayChangeAvailable = valuedAll && hasPrevAll && prevBase > 0;
  const dayChangePct = prevBase > 0 ? (dayChange / prevBase) * 100 : 0;

  const fxBreakdownAvailable =
    fxRate != null && valuedAll && missingFxSet.size === 0 && holdings.length > 0;

  return {
    rows,
    totalCost,
    totalValue,
    totalGain,
    totalGainPct,
    valuedAll,
    dayChange,
    dayChangePct,
    dayChangeAvailable,
    totalStockGainKrw,
    totalFxGainKrw,
    totalGainKrw: totalStockGainKrw + totalFxGainKrw,
    fxBreakdownAvailable,
    missingFxTickers: [...missingFxSet],
  };
}
