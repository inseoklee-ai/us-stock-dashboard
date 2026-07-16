"use client";

import { useFormStatus } from "react-dom";

/**
 * form 안에서 제출 진행 상태를 표시하는 버튼.
 * 부모 <form action={serverAction}> 의 pending 을 읽는다.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "처리 중…") : children}
    </button>
  );
}
