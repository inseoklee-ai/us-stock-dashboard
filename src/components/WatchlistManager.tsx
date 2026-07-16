import { removeWatch } from "@/app/feed/actions";
import { AddWatchForm } from "@/components/AddWatchForm";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  held: string[]; // 보유 종목 (자동 포함, 삭제 불가)
  watch: string[]; // 관심 종목 (삭제 가능)
};

export function WatchlistManager({ held, watch }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <h2 className="mb-3 text-sm font-medium text-gray-500">관심 종목</h2>

      <AddWatchForm />

      <div className="mt-3 flex flex-wrap gap-2">
        {held.map((t) => (
          <span
            key={`h-${t}`}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-gray-800"
            title="보유 종목 (자동 포함)"
          >
            {t}
            <span className="text-gray-400">보유</span>
          </span>
        ))}
        {watch.map((t) => (
          <span
            key={`w-${t}`}
            className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-2.5 py-1 text-xs dark:border-gray-700"
          >
            {t}
            <form action={removeWatch} className="inline">
              <input type="hidden" name="ticker" value={t} />
              <SubmitButton
                pendingLabel="…"
                className="text-gray-400 hover:text-red-600 disabled:opacity-50"
              >
                ✕
              </SubmitButton>
            </form>
          </span>
        ))}
        {held.length === 0 && watch.length === 0 && (
          <span className="text-sm text-gray-400">
            보유 종목이 없습니다. 위에서 관심 종목을 추가하거나 포트폴리오에서
            종목을 담으세요.
          </span>
        )}
      </div>
    </div>
  );
}
