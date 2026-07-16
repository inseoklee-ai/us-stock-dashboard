/** 빙글 도는 로딩 표시 */
export function Spinner({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-20 text-gray-500"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
