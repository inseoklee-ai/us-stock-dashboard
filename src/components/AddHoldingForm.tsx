"use client";

import { useActionState, useEffect, useRef } from "react";
import { addHolding, type AddHoldingState } from "@/app/portfolio/actions";

const initialState: AddHoldingState = {};

export function AddHoldingForm() {
  const [state, formAction, pending] = useActionState(addHolding, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // 저장 성공 시 폼 초기화
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-500">티커</span>
        <input
          name="ticker"
          required
          placeholder="AAPL"
          autoComplete="off"
          className="w-28 rounded border border-gray-300 px-2 py-1.5 uppercase dark:border-gray-700 dark:bg-transparent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-500">수량</span>
        <input
          name="quantity"
          type="number"
          step="any"
          min="0"
          required
          placeholder="10"
          className="w-28 rounded border border-gray-300 px-2 py-1.5 dark:border-gray-700 dark:bg-transparent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-500">평균 매수단가 (USD)</span>
        <input
          name="avg_price"
          type="number"
          step="any"
          min="0"
          required
          placeholder="150.25"
          className="w-40 rounded border border-gray-300 px-2 py-1.5 dark:border-gray-700 dark:bg-transparent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-500">매수 환율 (선택)</span>
        <input
          name="buy_fx_rate"
          type="number"
          step="any"
          min="0"
          placeholder="비우면 현재 환율"
          title="매수 당시 1달러 = ? 원. 비우면 현재 환율로 저장됩니다."
          className="w-40 rounded border border-gray-300 px-2 py-1.5 dark:border-gray-700 dark:bg-transparent"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "추가"}
      </button>

      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
