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

export function FeedList({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400 dark:border-gray-700">
        표시할 소식이 없습니다.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-900">
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
                <span className="text-gray-800 dark:text-gray-200">
                  {item.title}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-gray-400">
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
                className="block transition hover:bg-gray-50 dark:hover:bg-gray-900/50"
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
