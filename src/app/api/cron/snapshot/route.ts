import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuotes } from "@/lib/quotes";
import { getUsdKrwRate } from "@/lib/fx";

/**
 * 일별 자산 스냅샷 배치 (미국장 종가 후 실행).
 * Vercel Cron 이 매일 호출한다 (vercel.json). 전 사용자의 오늘 자산 총액을 기록.
 * 인증: Vercel Cron 이 Authorization: Bearer <CRON_SECRET> 를 자동으로 붙인다.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY 미설정" },
      { status: 500 },
    );
  }

  const supabase = createAdminClient();

  // 1) 전 사용자 보유 종목
  const { data: holdings, error } = await supabase
    .from("holdings")
    .select("user_id,ticker,quantity");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!holdings || holdings.length === 0) {
    return NextResponse.json({ ok: true, recorded: 0, note: "no holdings" });
  }

  // 2) 시세 + 환율
  const rows = holdings as {
    user_id: string;
    ticker: string;
    quantity: number;
  }[];
  const tickers = [...new Set(rows.map((h) => h.ticker))];
  const [quotes, fx] = await Promise.all([getQuotes(tickers), getUsdKrwRate()]);
  if (!fx) {
    return NextResponse.json({ error: "환율 조회 실패" }, { status: 502 });
  }

  // 3) 사용자별 합산 (모든 종목 시세를 구한 사용자만 기록)
  const perUser = new Map<string, { usd: number; allValued: boolean }>();
  for (const h of rows) {
    const cur = perUser.get(h.user_id) ?? { usd: 0, allValued: true };
    const q = quotes[h.ticker];
    if (q) cur.usd += Number(h.quantity) * q.price;
    else cur.allValued = false;
    perUser.set(h.user_id, cur);
  }

  const today = new Date().toISOString().slice(0, 10);
  const snapshots = [...perUser.entries()]
    .filter(([, v]) => v.allValued && v.usd > 0)
    .map(([user_id, v]) => ({
      user_id,
      snapshot_date: today,
      total_usd: Math.round(v.usd * 100) / 100,
      total_krw: Math.round(v.usd * fx.rate * 100) / 100,
      fx_rate: fx.rate,
    }));

  // 4) upsert
  if (snapshots.length > 0) {
    const { error: upErr } = await supabase
      .from("portfolio_snapshots")
      .upsert(snapshots, { onConflict: "user_id,snapshot_date" });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    date: today,
    recorded: snapshots.length,
    fxRate: fx.rate,
  });
}
