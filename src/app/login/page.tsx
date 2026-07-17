import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/AuthForm";
import { Card } from "@/components/Card";

export default async function LoginPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/portfolio");
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">로그인</h1>
        <p className="mt-1.5 text-sm text-muted">
          내 포트폴리오와 관심 종목을 저장하려면 로그인하세요.
        </p>
      </div>

      {configured ? (
        <Card className="p-6">
          <AuthForm />
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-muted hover:text-fg hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </Card>
      ) : (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm dark:border-amber-800/60 dark:bg-amber-950/30">
          <p className="font-semibold">Supabase 설정이 필요합니다</p>
          <p className="mt-1 text-muted">
            .env.local 에 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 를 채우고 개발
            서버를 재시작하세요.
          </p>
        </div>
      )}
    </main>
  );
}
