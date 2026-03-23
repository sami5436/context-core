import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

interface NodeData {
  id: string;
  label: string;
  name?: string;
  [key: string]: unknown;
}

interface RelData {
  source: string;
  target: string;
  type: string;
  [key: string]: unknown;
}

export async function GET() {
  try {
    // Fetch all nodes
    const nodesRecord = await runQuery<{
      id: string;
      labels: string[];
      properties: Record<string, unknown>;
    }>(
      `MATCH (n)
       RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties`
    );

    const nodes: NodeData[] = nodesRecord.map((record) => {
      const { id, labels, properties } = record;
      return {
        ...properties,
        id,
        label: labels[0] || "Unknown",
        name: (properties.name || properties.id || id) as string,
      };
    });

    // Fetch all relationships
    const relsRecord = await runQuery<{
      source: string;
      target: string;
      type: string;
      properties: Record<string, unknown>;
    }>(
      `MATCH (n)-[r]->(m)
       RETURN elementId(n) AS source, elementId(m) AS target, type(r) AS type, properties(r) AS properties`
    );

    const links: RelData[] = relsRecord.map((record) => {
      return {
        source: record.source,
        target: record.target,
        type: record.type,
        ...record.properties,
      };
    });

    return NextResponse.json({
      nodes,
      links,
    });
  } catch (error) {
    console.error("Graph data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}
