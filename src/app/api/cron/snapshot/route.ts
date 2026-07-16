import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 일별 자산 스냅샷 배치 (미국장 종가 후 실행).
 * Vercel Cron 이 이 엔드포인트를 호출한다. (vercel.json 참고)
 *
 * 흐름(TODO):
 *  1. 전체 사용자 holdings 조회
 *  2. 필요한 티커 시세를 quotes_cache 에서 읽거나 외부 API 로 갱신
 *  3. 환율(USD->KRW) 조회
 *  4. 사용자별 total_usd / total_krw 계산 후 portfolio_snapshots 에 upsert
 */
export async function GET(request: NextRequest) {
  // Vercel Cron 요청 인증: Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // TODO: 실제 스냅샷 로직 구현
  // const { data: holdings } = await supabase.from("holdings").select("*");
  void supabase;

  return NextResponse.json({ ok: true, ran: "snapshot", todo: true });
}
