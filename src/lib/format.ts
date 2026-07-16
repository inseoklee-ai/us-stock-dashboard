export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatNumber(value: number, maxFractionDigits = 6): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/** 부호 포함 USD (예: +$120.50 / -$30.00) */
export function formatSignedUSD(value: number): string {
  const sign = value > 0 ? "+" : "";
  return sign + formatUSD(value);
}

/** 부호 포함 퍼센트 (예: +12.34% / -5.00%) */
export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** 원화 (예: ₩1,234,567) */
export function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

/** 부호 포함 원화 (예: +₩120,000 / -₩30,000) */
export function formatSignedKRW(value: number): string {
  const sign = value > 0 ? "+" : "";
  return sign + formatKRW(value);
}
