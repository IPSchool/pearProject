interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  className?: string;
}

export function SimpleBarChart({ data, className = "" }: SimpleBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`flex h-44 items-end gap-2 ${className}`}>
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className="text-xs font-medium tabular-nums">{item.value}</span>
          <div
            className="w-full rounded-t bg-accent/80 transition-all"
            style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }}
            title={`${item.label}: ${item.value}`}
          />
          <span className="w-full truncate text-center text-[10px] text-muted">{item.label}</span>
        </div>
      ))}
      {!data.length ? <p className="text-sm text-muted">暂无数据</p> : null}
    </div>
  );
}
