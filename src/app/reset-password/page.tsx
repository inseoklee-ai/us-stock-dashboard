"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { parsePassword } from "@/lib/validation";

const EXPIRED = "링크가 만료되었거나 유효하지 않습니다. 다시 요청해 주세요.";

export default function ResetPasswordPage() {
  // detectSessionInUrl 을 끈다 → URL 파라미터를 우리가 직접 처리(자동으로 지워지지 않게)
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { detectSessionInUrl: false } },
    ),
  );
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const errDesc =
      hash.get("error_description") ?? search.get("error_description");
    const tokenHash = search.get("token_hash");
    const type = search.get("type") as EmailOtpType | null;
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const code = search.get("code");

    async function establish() {
      if (errDesc) {
        setError(errDesc);
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        if (error) setError(EXPIRED);
        else setReady(true);
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) setError(EXPIRED);
        else setReady(true);
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) setError(EXPIRED);
        else setReady(true);
      } else {
        const { data } = await supabase.auth.getSession();
        if (data.session) setReady(true);
        else setError("유효한 재설정 링크로 접근해 주세요.");
      }
      setChecking(false);
    }

    establish();
  }, [supabase]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("password") ?? "");
    const pw2 = String(fd.get("password2") ?? "");

    const v = parsePassword(pw);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    if (pw !== pw2) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPending(false);

    if (error) {
      setError(`변경 실패: ${error.message}`);
      return;
    }
    router.push("/portfolio");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">새 비밀번호 설정</h1>

      {checking ? (
        <p className="text-sm text-gray-500">확인 중…</p>
      ) : ready ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="text-gray-500">새 비밀번호 (6자 이상)</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-gray-500">새 비밀번호 확인</span>
            <input
              name="password2"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "변경 중…" : "비밀번호 변경"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-red-600">
            {error ?? "유효한 재설정 링크로 접근해 주세요."}
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-sm text-blue-600 hover:underline"
          >
            재설정 링크 다시 요청하기
          </Link>
        </div>
      )}
    </main>
  );
}
