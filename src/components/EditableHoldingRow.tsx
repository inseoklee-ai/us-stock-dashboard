"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteHolding, updateHolding } from "@/app/portfolio/actions";
import type { HoldingRow } from "@/lib/portfolio";
import type { FormState } from "@/lib/validation";
import {
  formatKRW,
  formatNumber,
  formatPct,
  formatSignedUSD,
  formatUSD,
} from "@/lib/format";

const gainColor = (v: number) =>
  v > 0 ? "text-red-600" : v < 0 ? "text-blue-600" : "text-gray-500";

const inputCls =
  "w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm dark:border-gray-700 dark:bg-transparent";

const initialState: FormState = {};

export function EditableHoldingRow({ row }: { row: HoldingRow }) {
  const { holding: h, cost, price, value, gain, gainPct } = row;
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateHolding,
    initialState,
  );

  // 수정 성공 시 편집 모드 종료
  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state.success]);

  if (editing) {
    return (
      <tr className="border-b border-gray-100 dark:border-gray-900">
        <td colSpan={8} className="py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={h.id} />
            <span className="w-12 pb-1 font-medium">{h.ticker}</span>

            <label className="flex flex-col gap-0.5 text-xs text-gray-500">
              수량
              <input
                name="quantity"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={h.quantity}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-0.5 text-xs text-gray-500">
              평균단가 (USD)
              <input
                name="avg_price"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={h.avg_price}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-0.5 text-xs text-gray-500">
              매수환율 (선택)
              <input
                name="buy_fx_rate"
                type="number"
                step="any"
                min="0"
                defaultValue={h.buy_fx_rate ?? ""}
                placeholder="비우면 미입력"
                className={inputCls}
              />
            </label>

            <div className="flex gap-2 pb-1">
              <button
                type="submit"
                disabled={pending}
                className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {pending ? "저장 중…" : "저장"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
              >
                취소
              </button>
            </div>
            {state.error && (
              <p className="w-full text-sm text-red-600">{state.error}</p>
            )}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-900">
      <td className="py-2 pr-4 font-medium">{h.ticker}</td>
      <td className="py-2 pr-4 text-right tabular-nums">
        {formatNumber(h.quantity)}
      </td>
      <td className="py-2 pr-4 text-right tabular-nums">
        {formatUSD(h.avg_price)}
      </td>
      <td className="py-2 pr-4 text-right tabular-nums">
        {h.buy_fx_rate != null ? (
          formatKRW(h.buy_fx_rate)
        ) : (
          <span className="text-gray-400">미입력</span>
        )}
      </td>
      <td className="py-2 pr-4 text-right tabular-nums">
        {price === null ? (
          <span className="text-gray-400">—</span>
        ) : (
          formatUSD(price)
        )}
      </td>
      <td className="py-2 pr-4 text-right tabular-nums">
        {value === null ? (
          <span className="text-gray-400">{formatUSD(cost)}</span>
        ) : (
          formatUSD(value)
        )}
      </td>
      <td
        className={`py-2 pr-4 text-right tabular-nums ${
          gain === null ? "text-gray-400" : gainColor(gain)
        }`}
      >
        {gain === null || gainPct === null ? (
          "—"
        ) : (
          <>
            {formatSignedUSD(gain)}
            <span className="ml-1 text-xs">({formatPct(gainPct)})</span>
          </>
        )}
      </td>
      <td className="py-2 pl-4 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-blue-600 hover:underline"
        >
          수정
        </button>
        <form action={deleteHolding} className="ml-2 inline">
          <input type="hidden" name="id" value={h.id} />
          <button
            type="submit"
            className="text-gray-400 hover:text-red-600 hover:underline"
          >
            삭제
          </button>
        </form>
      </td>
    </tr>
  );
}
