import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트 / Route Handler / Server Action 에서 사용하는 Supabase 클라이언트.
 * 요청 쿠키에 담긴 세션을 읽어 로그인 사용자로 동작한다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 에서 호출되면 set 이 무시된다.
            // 세션 갱신은 미들웨어가 담당하므로 안전하게 무시.
          }
        },
      },
    },
  );
}
