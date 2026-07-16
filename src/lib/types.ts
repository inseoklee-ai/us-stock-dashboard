/**
 * 도메인 타입. supabase/schema.sql 의 테이블과 대응된다.
 * (실서비스에서는 `supabase gen types typescript` 로 자동 생성하는 것을 권장)
 */

/** 보유 종목 (사용자가 수동 입력) */
export interface Holding {
  id: string;
  user_id: string;
  ticker: string;
  quantity: number;
  avg_price: number; // 평균 매수단가 (USD)
  buy_fx_rate: number | null; // 매수 시점 환율 (1 USD = ? KRW), 환차손익 계산용
  created_at: string;
}

/** 관심 종목 */
export interface WatchItem {
  id: string;
  user_id: string;
  ticker: string;
  created_at: string;
}

/** 일별 자산 스냅샷 (매일 종가 후 배치 저장) */
export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string; // YYYY-MM-DD
  total_usd: number;
  total_krw: number;
  fx_rate: number; // 저장 시점 USD→KRW 환율
}

/** 시세 캐시 (지연 시세, 서버가 갱신) */
export interface QuoteCache {
  ticker: string;
  price: number; // 현재가 (USD)
  prev_close: number | null; // 전일 종가 (등락 계산용)
  currency: string;
  updated_at: string;
}

export type FeedType = "news" | "filing" | "earnings";

/** 뉴스 / 공시 / 실적일정 통합 피드 캐시 */
export interface FeedItem {
  id: string;
  ticker: string;
  type: FeedType;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string;
  created_at: string;
}

/** 화면 표시용: 보유 종목 + 현재가 계산 결과 */
export interface HoldingView extends Holding {
  price: number;
  market_value_usd: number;
  cost_basis_usd: number;
  gain_usd: number;
  gain_pct: number;
}
