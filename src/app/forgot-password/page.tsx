"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { parseEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [supabase] = useState(() => createClient());
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const v = parseEmail(fd.get("email"));
    if (!v.ok) {
      setError(v.error);
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(v.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }
    // 보안상 이메일 존재 여부와 무관하게 동일 안내
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div>
        <Link href="/login" className="text-sm text-gray-500 hover:underline">
          ← 로그인
        </Link>
        <h1 className="mt-4 text-2xl font-bold">비밀번호 재설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          가입한 이메일로 재설정 링크를 보내드립니다.
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm dark:border-green-800 dark:bg-green-950/30">
          <p className="font-medium text-green-700 dark:text-green-300">
            메일을 확인하세요
          </p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            입력하신 주소가 가입된 이메일이라면, 재설정 링크가 도착합니다. 메일의
            링크를 눌러 새 비밀번호를 설정하세요. (메일이 안 보이면 스팸함도
            확인해 주세요)
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="text-gray-500">이메일</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "보내는 중…" : "재설정 링크 보내기"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </main>
  );
}
