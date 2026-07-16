import { cache } from "react";

/**
 * 환율 조회 (USD -> KRW). Frankfurter API (ECB 기준, 키 불필요).
 * ECB 기준 환율이라 영업일 기준 하루 1회 갱신 → 1시간 캐시면 충분.
 */

export type FxRate = {
  rate: number; // 1 USD = rate KRW
  date: string; // 기준일 (YYYY-MM-DD)
};

export const getUsdKrwRate = cache(async (): Promise<FxRate | null> => {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=KRW",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;

    const data: { rates?: { KRW?: number }; date?: string } = await res.json();
    const rate = data.rates?.KRW;
    if (typeof rate !== "number" || rate <= 0) return null;

    return { rate, date: data.date ?? "" };
  } catch {
    return null;
  }
});
