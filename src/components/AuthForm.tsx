"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "@/app/login/actions";

const initialState: AuthState = {};

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialState,
  );

  const inputCls =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-fg placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="w-full">
      {/* 로그인 / 회원가입 탭 */}
      <p className="mb-2 text-sm text-muted">
        {mode === "login"
          ? "처음이신가요? 오른쪽 '회원가입'을 눌러 계정을 만드세요."
          : "이미 계정이 있으면 왼쪽 '로그인'을 누르세요."}
      </p>
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-2 p-1 text-sm font-medium">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === m
                ? "bg-brand text-brand-fg shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-muted">이메일</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={inputCls}
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-muted">비밀번호</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="6자 이상"
            className={inputCls}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-brand-fg transition hover:bg-brand-strong disabled:opacity-50"
        >
          {pending
            ? "처리 중…"
            : mode === "login"
              ? "로그인"
              : "회원가입"}
        </button>

        {state.error && <p className="text-sm text-up">{state.error}</p>}
        {state.message && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
