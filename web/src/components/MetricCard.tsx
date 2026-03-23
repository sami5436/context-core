interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  direction: "higher_is_better" | "lower_is_better" | "neutral";
  thresholdWarning: number;
  thresholdCritical: number;
  description: string;
}

function getStatus(
  value: number,
  direction: MetricCardProps["direction"],
  warn: number,
  crit: number
): { color: string; status: string } {
  if (direction === "higher_is_better") {
    if (value >= warn) return { color: "bg-emerald-500", status: "Healthy" };
    if (value >= crit) return { color: "bg-amber-500", status: "Warning" };
    return { color: "bg-red-500", status: "Critical" };
  }
  if (direction === "lower_is_better") {
    if (value <= warn) return { color: "bg-emerald-500", status: "Healthy" };
    if (value <= crit) return { color: "bg-amber-500", status: "Warning" };
    return { color: "bg-red-500", status: "Critical" };
  }
  // neutral — flag both extremes
  if (value > warn) return { color: "bg-amber-500", status: "High" };
  if (value < crit) return { color: "bg-amber-500", status: "Low" };
  return { color: "bg-emerald-500", status: "Optimal" };
}

export default function MetricCard({
  label,
  value,
  unit,
  direction,
  thresholdWarning,
  thresholdCritical,
  description,
}: MetricCardProps) {
  const { color, status } = getStatus(
    value,
    direction,
    thresholdWarning,
    thresholdCritical
  );

  return (
    <div className="rounded border border-zinc-800/60 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700/60 hover:bg-zinc-900/80">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
          <span className="text-[10px] text-zinc-500">{status}</span>
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-100">
        {value}
        <span className="ml-0.5 text-sm font-normal text-zinc-500">
          {unit}
        </span>
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
        {description}
      </p>
    </div>
  );
}
