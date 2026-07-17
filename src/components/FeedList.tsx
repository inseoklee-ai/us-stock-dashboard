import type { FeedItem, FeedType } from "@/lib/feed";

const TYPE_META: Record<FeedType, { label: string; className: string }> = {
  news: {
    label: "뉴스",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  filing: {
    label: "공시",
    className:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  earnings: {
    label: "실적",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
};

// 감성점수(-1~1) → 뱃지. 한국식(긍정=빨강, 부정=파랑). ±0.15 이내는 중립(표시 안 함).
function sentimentBadge(score: number | null | undefined) {
  if (score == null || Math.abs(score) < 0.15) return null;
  const positive = score > 0;
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
        positive
          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
      }`}
      title={`감성점수 ${score.toFixed(2)}`}
    >
      {positive ? "긍정" : "부정"}
    </span>
  );
}

export function FeedList({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="themed rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
        표시할 소식이 없습니다.
      </div>
    );
  }

  return (
    <ul className="themed divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {items.map((item) => {
        const meta = TYPE_META[item.type];
        const content = (
          <div className="flex items-start gap-3 py-3">
            <span
              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${meta.className}`}
            >
              {meta.label}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm">
                <span className="font-semibold">{item.ticker}</span>{" "}
                {sentimentBadge(item.sentiment)}{" "}
                <span className="text-gray-800 dark:text-gray-200">
                  {item.title}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted/80">
                {item.source} · {item.dateLabel}
                {item.url ? " · 원문 보기 →" : ""}
              </div>
            </div>
          </div>
        );

        return (
          <li key={item.id}>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="-mx-4 block px-4 transition hover:bg-surface-2"
              >
                {content}
              </a>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
