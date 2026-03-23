"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import MetricCard from "@/components/MetricCard";

interface NodeCount {
  label: string;
  count: number;
}
interface RelCount {
  type: string;
  count: number;
}
interface GraphOverview {
  nodes: NodeCount[];
  relationships: RelCount[];
  totalNodes: number;
  totalRelationships: number;
}
interface Metric {
  id: string;
  label: string;
  value: number;
  unit: string;
  direction: "higher_is_better" | "lower_is_better" | "neutral";
  threshold_warning: number;
  threshold_critical: number;
  description: string;
}

function SkeletonCard() {
  return (
    <div className="rounded border border-zinc-800/60 bg-zinc-900/50 p-4">
      <div className="h-3 w-20 rounded bg-zinc-800 animate-pulse-subtle" />
      <div className="mt-3 h-7 w-16 rounded bg-zinc-800 animate-pulse-subtle" />
      <div className="mt-2 h-2 w-12 rounded bg-zinc-800/60 animate-pulse-subtle" />
    </div>
  );
}

function SkeletonMetric() {
  return (
    <div className="rounded border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div className="flex justify-between">
        <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse-subtle" />
        <div className="h-3 w-14 rounded bg-zinc-800/60 animate-pulse-subtle" />
      </div>
      <div className="mt-4 h-9 w-20 rounded bg-zinc-800 animate-pulse-subtle" />
      <div className="mt-3 h-3 w-full rounded bg-zinc-800/60 animate-pulse-subtle" />
    </div>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState<GraphOverview | null>(null);
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, metricsRes] = await Promise.all([
          fetch("/api/graph/overview"),
          fetch("/api/metrics"),
        ]);

        if (!overviewRes.ok || !metricsRes.ok) {
          throw new Error("Failed to fetch data from API");
        }

        const overviewData = await overviewRes.json();
        const metricsData = await metricsRes.json();

        setOverview(overviewData);
        setMetrics(metricsData.metrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    fetchData();
  }, []);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Supply chain knowledge graph overview and key performance metrics
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Graph Overview */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-sm font-medium text-zinc-300">Graph Overview</h2>
          {overview && (
            <span className="text-[11px] text-zinc-600">
              {overview.totalNodes} nodes / {overview.totalRelationships} edges
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {overview
            ? overview.nodes.map((node) => (
                <StatCard
                  key={node.label}
                  label={node.label}
                  value={node.count}
                  type="node"
                />
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {overview
            ? overview.relationships.map((rel) => (
                <StatCard
                  key={rel.type}
                  label={rel.type}
                  value={rel.count}
                  type="relationship"
                />
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
        </div>
      </section>

      {/* Metrics */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-medium text-zinc-300">Key Metrics</h2>
          <p className="mt-1 text-[12px] text-zinc-600">
            Computed from the semantic layer definitions
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics
            ? metrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  label={metric.label}
                  value={metric.value}
                  unit={metric.unit}
                  direction={metric.direction}
                  thresholdWarning={metric.threshold_warning}
                  thresholdCritical={metric.threshold_critical}
                  description={metric.description}
                />
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <SkeletonMetric key={i} />
              ))}
        </div>
      </section>
    </div>
  );
}
