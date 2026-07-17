import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HeaderNav } from "@/components/HeaderNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SignOutButton } from "@/components/SignOutButton";

/** 전 페이지 공통 상단 헤더. 서버 컴포넌트 — 로그인 상태를 읽어 우측 영역을 결정. */
export async function AppHeader() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let userEmail: string | null = null;
  if (configured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userEmail = user?.email ?? null;
    } catch {
      userEmail = null;
    }
  }

  return (
    <header className="themed sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
        {/* 브랜드 */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="모두리치 로고"
            className="h-7 w-7 rounded-lg object-cover"
          />
          <span className="text-[15px] font-bold tracking-tight">모두리치</span>
        </Link>

        {/* 네비 (로그인 시에만) */}
        {userEmail && (
          <div className="hidden sm:block">
            <HeaderNav />
          </div>
        )}

        {/* 우측 */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {userEmail ? (
            <>
              <span className="hidden max-w-[160px] truncate text-sm text-muted md:inline">
                {userEmail}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-brand-fg transition hover:bg-brand-strong"
            >
              로그인
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 네비 (로그인 시) */}
      {userEmail && (
        <div className="border-t border-line px-4 py-1.5 sm:hidden">
          <HeaderNav />
        </div>
      )}
    </header>
  );
}
