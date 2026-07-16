"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { parsePassword } from "@/lib/validation";

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false); // 유효한 재설정 세션 확보 여부
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // 링크로 진입 시 재설정 세션을 확보한다.
  // 방식 1) token_hash + type=recovery (메일 템플릿 권장) -> verifyOtp
  // 방식 2) code (PKCE) -> exchangeCodeForSession (예비)
  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as EmailOtpType | null;
    const code = url.searchParams.get("code");
    const errDesc = url.searchParams.get("error_description");

    async function establish() {
      if (errDesc) {
        setError(errDesc);
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        if (error) {
          setError("링크가 만료되었거나 유효하지 않습니다. 다시 요청해 주세요.");
        } else {
          setReady(true);
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("링크가 만료되었거나 유효하지 않습니다. 다시 요청해 주세요.");
        } else {
          setReady(true);
        }
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
    setDone(true);
    router.push("/portfolio");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">새 비밀번호 설정</h1>

      {checking ? (
        <p className="text-sm text-gray-500">확인 중…</p>
      ) : ready && !done ? (
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
