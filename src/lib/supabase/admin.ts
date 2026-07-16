import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 관리자 클라이언트. service_role 키를 사용하므로 RLS 를 우회한다.
 * cron/배치 작업(일별 스냅샷, 뉴스 수집)에서만 사용할 것.
 * 절대 클라이언트 코드에서 import 하지 말 것.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
