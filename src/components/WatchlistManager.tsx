import { removeWatch } from "@/app/feed/actions";
import { AddWatchForm } from "@/components/AddWatchForm";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  held: string[]; // 보유 종목 (자동 포함, 삭제 불가)
  watch: string[]; // 관심 종목 (삭제 가능)
};

export function WatchlistManager({ held, watch }: Props) {
  return (
    <div className="themed rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="mb-3 text-sm font-medium text-muted">관심 종목</h2>

      <AddWatchForm />

      <div className="mt-3 flex flex-wrap gap-2">
        {held.map((t) => (
          <span
            key={`h-${t}`}
            className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium"
            title="보유 종목 (자동 포함)"
          >
            {t}
            <span className="text-muted">보유</span>
          </span>
        ))}
        {watch.map((t) => (
          <span
            key={`w-${t}`}
            className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium"
          >
            {t}
            <form action={removeWatch} className="inline">
              <input type="hidden" name="ticker" value={t} />
              <SubmitButton
                pendingLabel="…"
                className="text-muted hover:text-up disabled:opacity-50"
              >
                ✕
              </SubmitButton>
            </form>
          </span>
        ))}
        {held.length === 0 && watch.length === 0 && (
          <span className="text-sm text-muted">
            보유 종목이 없습니다. 위에서 관심 종목을 추가하거나 포트폴리오에서
            종목을 담으세요.
          </span>
        )}
      </div>
    </div>
  );
}
