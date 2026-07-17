import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 뉴스/공시/실적 수집 배치.
 * 관심(watchlist) + 보유(holdings) 종목의 소식을 외부 API/RSS/EDGAR 에서 모아
 * feed_items 에 upsert 한다.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // TODO: 종목 목록 수집 -> 뉴스/EDGAR/실적 API 호출 -> feed_items upsert
  void supabase;

  return NextResponse.json({ ok: true, ran: "feed", todo: true });
}
