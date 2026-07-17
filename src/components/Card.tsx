import type { ReactNode } from "react";

/** 토스풍 카드: 둥근 모서리 + 부드러운 그림자 + surface 배경. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`themed rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
