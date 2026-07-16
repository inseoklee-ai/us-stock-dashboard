"use client";

import { useActionState, useEffect, useRef } from "react";
import { addWatch } from "@/app/feed/actions";
import type { FormState } from "@/lib/validation";

const initialState: FormState = {};

export function AddWatchForm() {
  const [state, formAction, pending] = useActionState(addWatch, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex gap-2">
        <input
          name="ticker"
          required
          placeholder="티커 추가 (예: TSLA)"
          autoComplete="off"
          className="w-44 rounded border border-gray-300 px-2 py-1.5 text-sm uppercase dark:border-gray-700 dark:bg-transparent"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "추가 중…" : "추가"}
        </button>
      </form>
      {state.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
