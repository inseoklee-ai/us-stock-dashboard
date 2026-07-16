/**
 * 사용자 입력 검증 (서버 액션에서 공용으로 사용).
 * 각 함수는 성공 시 { ok:true, value } 를, 실패 시 { ok:false, error } 를 반환한다.
 */

export type FormState = {
  error?: string;
  success?: boolean;
};

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const TICKER_RE = /^[A-Z0-9.\-]{1,10}$/;

// 합리적 상한 (오입력/오버플로 방지)
const MAX_QUANTITY = 1_000_000_000; // 10억 주
const MAX_PRICE = 1_000_000; // $1,000,000
const MAX_FX = 100_000; // 1달러 = 10만원 이하

/** 티커: 영문/숫자/./-, 1~10자. 대문자로 정규화. */
export function parseTicker(raw: unknown): Validated<string> {
  const t = String(raw ?? "").trim().toUpperCase();
  if (!t) return { ok: false, error: "티커를 입력하세요." };
  if (!TICKER_RE.test(t)) {
    return {
      ok: false,
      error: "티커 형식이 올바르지 않습니다 (영문·숫자·.·- 조합, 1~10자).",
    };
  }
  return { ok: true, value: t };
}

/** 수량: 0보다 크고 유한한 숫자. */
export function parseQuantity(raw: unknown): Validated<number> {
  const s = String(raw ?? "").trim();
  if (!s) return { ok: false, error: "수량을 입력하세요." };
  const n = Number(s);
  if (!Number.isFinite(n)) return { ok: false, error: "수량은 숫자여야 합니다." };
  if (n <= 0) return { ok: false, error: "수량은 0보다 커야 합니다." };
  if (n > MAX_QUANTITY) return { ok: false, error: "수량이 너무 큽니다." };
  return { ok: true, value: n };
}

/** 평균 매수단가(USD): 0 이상, 유한한 숫자. */
export function parsePrice(raw: unknown): Validated<number> {
  const s = String(raw ?? "").trim();
  if (!s) return { ok: false, error: "평균 매수단가를 입력하세요." };
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return { ok: false, error: "평균 매수단가는 숫자여야 합니다." };
  }
  if (n < 0) return { ok: false, error: "평균 매수단가는 0 이상이어야 합니다." };
  if (n > MAX_PRICE) return { ok: false, error: "평균 매수단가가 너무 큽니다." };
  return { ok: true, value: n };
}

/**
 * 매수 환율(1 USD = ? KRW). required=false 면 빈 값 허용(null 반환).
 */
export function parseFxRate(
  raw: unknown,
  opts: { required: boolean },
): Validated<number | null> {
  const s = String(raw ?? "").trim();
  if (!s) {
    return opts.required
      ? { ok: false, error: "환율을 입력하세요." }
      : { ok: true, value: null };
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "환율은 0보다 큰 숫자여야 합니다 (예: 1350)." };
  }
  if (n > MAX_FX) return { ok: false, error: "환율 값이 비정상적으로 큽니다." };
  return { ok: true, value: n };
}

/** 이메일: 간단한 형식 검사. */
export function parseEmail(raw: unknown): Validated<string> {
  const s = String(raw ?? "").trim();
  if (!s) return { ok: false, error: "이메일을 입력하세요." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || s.length > 254) {
    return { ok: false, error: "이메일 형식이 올바르지 않습니다." };
  }
  return { ok: true, value: s };
}

/** 비밀번호: 6자 이상. */
export function parsePassword(raw: unknown): Validated<string> {
  const s = String(raw ?? "");
  if (s.length < 6) return { ok: false, error: "비밀번호는 6자 이상이어야 합니다." };
  if (s.length > 128) return { ok: false, error: "비밀번호가 너무 깁니다." };
  return { ok: true, value: s };
}
