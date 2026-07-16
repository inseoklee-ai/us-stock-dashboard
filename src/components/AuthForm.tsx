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

  return (
    <div className="w-full max-w-sm">
      {/* 로그인 / 회원가입 탭 */}
      <p className="mb-2 text-sm text-gray-500">
        {mode === "login"
          ? "처음이신가요? 오른쪽 '회원가입'을 눌러 계정을 만드세요."
          : "이미 계정이 있으면 왼쪽 '로그인'을 누르세요."}
      </p>
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm font-medium dark:bg-gray-800">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-2 transition ${
              mode === m
                ? "bg-blue-600 text-white shadow"
                : "text-gray-700 hover:bg-white dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />

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

        <label className="block space-y-1 text-sm">
          <span className="text-gray-500">비밀번호</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="6자 이상"
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {pending
            ? "처리 중…"
            : mode === "login"
              ? "로그인"
              : "회원가입"}
        </button>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && (
          <p className="text-sm text-green-600">{state.message}</p>
        )}
      </form>
    </div>
  );
}
