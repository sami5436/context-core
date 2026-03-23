interface StatCardProps {
  label: string;
  value: number;
  type: "node" | "relationship";
}

export default function StatCard({ label, value, type }: StatCardProps) {
  return (
    <div className="group rounded border border-zinc-800/60 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700/60 hover:bg-zinc-900/80">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[11px] text-zinc-600">
        {type === "node" ? "nodes" : "edges"}
      </p>
    </div>
  );
}
