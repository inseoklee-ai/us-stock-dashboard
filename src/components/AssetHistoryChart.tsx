import { formatKRW, formatKRWCompact } from "@/lib/format";

type Point = { date: string; krw: number };

export function AssetHistoryChart({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-2 text-sm font-medium text-gray-500">자산 추이</h2>
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
          아직 기록이 없습니다. 대시보드를 방문하면 그날의 자산이 기록됩니다.
        </p>
      </div>
    );
  }

  // 기록이 하루치뿐이면 0에서 시작하는 점을 앞에 넣어 그래프를 바로 보여준다.
  const synthetic = points.length === 1;
  const chartPoints: Point[] = synthetic
    ? [{ date: "시작", krw: 0 }, points[0]]
    : points;

  const W = 640;
  const H = 220;
  const padL = 12;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const krws = chartPoints.map((p) => p.krw);
  const min = Math.min(...krws);
  const max = Math.max(...krws);
  const range = max - min || 1;
  const yMin = min - range * 0.1;
  const yMax = max + range * 0.1;
  const yRange = yMax - yMin || 1;

  const xAt = (i: number) => padL + (i / (chartPoints.length - 1)) * innerW;
  const yAt = (v: number) => padT + (1 - (v - yMin) / yRange) * innerH;

  const line = chartPoints.map((p, i) => `${xAt(i)},${yAt(p.krw)}`).join(" ");
  const area = `${padL},${padT + innerH} ${line} ${padL + innerW},${padT + innerH}`;

  const first = chartPoints[0];
  const last = chartPoints[chartPoints.length - 1];
  const realLast = points[points.length - 1];
  const up = last.krw >= first.krw;
  const strokeCls = up ? "stroke-red-500" : "stroke-blue-500";
  const fillCls = up ? "fill-red-500" : "fill-blue-500";

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-gray-500">자산 추이 (원화)</h2>
        <span className="text-sm font-bold tabular-nums">
          {formatKRW(realLast.krw)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="자산 총액 추이 그래프"
      >
        <polygon points={area} className={fillCls} opacity="0.1" />
        <polyline
          points={line}
          fill="none"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className={strokeCls}
        />
        {chartPoints.map((p, i) => (
          <circle
            key={`${p.date}-${i}`}
            cx={xAt(i)}
            cy={yAt(p.krw)}
            r="2.5"
            className={fillCls}
          />
        ))}

        {/* y 최대/최소 라벨 */}
        <text x={padL} y={yAt(max) - 4} className="fill-gray-400 text-[10px]">
          {formatKRWCompact(max)}
        </text>
        <text x={padL} y={yAt(min) + 12} className="fill-gray-400 text-[10px]">
          {formatKRWCompact(min)}
        </text>

        {/* x 시작/끝 날짜 */}
        <text x={padL} y={H - 8} className="fill-gray-400 text-[10px]">
          {first.date}
        </text>
        <text
          x={W - padR}
          y={H - 8}
          textAnchor="end"
          className="fill-gray-400 text-[10px]"
        >
          {last.date}
        </text>
      </svg>

      <p className="mt-1 text-xs text-gray-400">
        {synthetic
          ? "※ 첫 기록이라 0에서 시작한 것으로 표시했어요. 방문이 쌓이면 실제 추이로 바뀝니다."
          : "※ 대시보드를 방문한 날의 자산이 기록됩니다. 색: 시작 대비 상승(빨강)·하락(파랑)."}
      </p>
    </div>
  );
}
