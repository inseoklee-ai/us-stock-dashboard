import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/AuthForm";

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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 p-8">
      <div>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 홈
        </Link>
        <h1 className="mt-4 text-2xl font-bold">로그인</h1>
        <p className="mt-1 text-sm text-gray-500">
          내 포트폴리오와 관심 종목을 저장하려면 로그인하세요.
        </p>
      </div>

      {configured ? (
        <AuthForm />
      ) : (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium">Supabase 설정이 필요합니다</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            .env.local 에 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 를 채우고 개발
            서버를 재시작하세요.
          </p>
        </div>
      )}
    </main>
  );
}
