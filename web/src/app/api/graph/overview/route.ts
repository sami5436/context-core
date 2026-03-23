import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

interface CountResult {
  label: string;
  count: number;
}

interface RelResult {
  type: string;
  count: number;
}

export async function GET() {
  try {
    const nodes = await runQuery<CountResult>(
      `MATCH (n)
       RETURN labels(n)[0] AS label, count(n) AS count
       ORDER BY label`
    );

    const relationships = await runQuery<RelResult>(
      `MATCH ()-[r]->()
       RETURN type(r) AS type, count(r) AS count
       ORDER BY type`
    );

    const totalNodes = nodes.reduce((sum, n) => sum + n.count, 0);
    const totalRelationships = relationships.reduce(
      (sum, r) => sum + r.count,
      0
    );

    return NextResponse.json({
      nodes,
      relationships,
      totalNodes,
      totalRelationships,
    });
  } catch (error) {
    console.error("Graph overview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph overview" },
      { status: 500 }
    );
  }
}
