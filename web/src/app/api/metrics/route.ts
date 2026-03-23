import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

export async function GET() {
  try {
    // Supplier defect rate
    const defectRows = await runQuery<{
      avg_defect_pct: number;
    }>(
      `MATCH (s:Supplier)
       RETURN round(avg(s.defect_rate) * 100, 2) AS avg_defect_pct`
    );

    // Order fulfillment rate
    const fulfillmentRows = await runQuery<{
      total: number;
      delivered: number;
      fulfillment_pct: number;
    }>(
      `MATCH (o:Order)
       WITH count(o) AS total,
            sum(CASE WHEN o.status = 'Delivered' THEN 1 ELSE 0 END) AS delivered
       RETURN total, delivered,
              round(toFloat(delivered) / total * 100, 1) AS fulfillment_pct`
    );

    // Warehouse utilization
    const utilizationRows = await runQuery<{
      avg_utilization: number;
    }>(
      `MATCH (w:Warehouse)
       RETURN round(avg(toFloat(w.current_stock) / w.capacity * 100), 1) AS avg_utilization`
    );

    // On-time delivery rate
    const onTimeRows = await runQuery<{
      total_delivered: number;
      on_time: number;
      on_time_pct: number;
    }>(
      `MATCH (o:Order)
       WHERE o.status = 'Delivered' AND o.on_time IS NOT NULL
       RETURN count(o) AS total_delivered,
              sum(CASE WHEN o.on_time = true THEN 1 ELSE 0 END) AS on_time,
              round(toFloat(sum(CASE WHEN o.on_time = true THEN 1 ELSE 0 END))
                    / count(o) * 100, 1) AS on_time_pct`
    );

    const metrics = [
      {
        id: "supplier_defect_rate",
        label: "Supplier Defect Rate",
        value: defectRows[0]?.avg_defect_pct ?? 0,
        unit: "%",
        direction: "lower_is_better" as const,
        threshold_warning: 3.0,
        threshold_critical: 5.0,
        description: "Average defect rate across all suppliers",
      },
      {
        id: "order_fulfillment_rate",
        label: "Order Fulfillment Rate",
        value: fulfillmentRows[0]?.fulfillment_pct ?? 0,
        unit: "%",
        direction: "higher_is_better" as const,
        threshold_warning: 85.0,
        threshold_critical: 70.0,
        description: "Percentage of orders delivered",
      },
      {
        id: "warehouse_utilization",
        label: "Warehouse Utilization",
        value: utilizationRows[0]?.avg_utilization ?? 0,
        unit: "%",
        direction: "neutral" as const,
        threshold_warning: 90.0,
        threshold_critical: 40.0,
        description: "Average stock-to-capacity ratio",
      },
      {
        id: "on_time_delivery_rate",
        label: "On-Time Delivery",
        value: onTimeRows[0]?.on_time_pct ?? 0,
        unit: "%",
        direction: "higher_is_better" as const,
        threshold_warning: 90.0,
        threshold_critical: 80.0,
        description: "Delivered orders arriving on schedule",
      },
    ];

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
