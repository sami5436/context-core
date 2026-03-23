import { NextRequest, NextResponse } from "next/server";
import { Ollama } from "ollama";
import { runQuery } from "@/lib/neo4j";
import { CYPHER_SYSTEM_PROMPT, SUMMARIZE_SYSTEM_PROMPT } from "@/lib/schema";

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || "http://localhost:11434" });
const MODEL = process.env.OLLAMA_MODEL || "llama3";

function extractCypher(text: string): string {
  // Strip markdown fences if the model adds them
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```cypher\n?/gi, "").replace(/```\n?/g, "");
  cleaned = cleaned.replace(/```sql\n?/gi, "").replace(/```\n?/g, "");

  // Take only the first statement (up to semicolon or end)
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("--"));

  // Reject if it contains mutation keywords
  const joined = lines.join("\n");
  const forbidden = /\b(DELETE|CREATE|SET|MERGE|REMOVE|DROP)\b/i;
  if (forbidden.test(joined)) {
    throw new Error("Generated query contains forbidden mutation operations.");
  }

  return joined;
}

function formatResults(records: Record<string, unknown>[]): string {
  if (records.length === 0) return "No results found.";
  // Convert to a simple table-like string for the LLM
  const keys = Object.keys(records[0]);
  const header = keys.join(" | ");
  const rows = records.map((r) =>
    keys.map((k) => {
      const v = r[k];
      if (v === null || v === undefined) return "null";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    }).join(" | ")
  );
  return [header, "-".repeat(header.length), ...rows].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'question' field" },
        { status: 400 }
      );
    }

    // Step 1: Generate Cypher from natural language
    const cypherResponse = await ollama.chat({
      model: MODEL,
      messages: [
        { role: "system", content: CYPHER_SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
      options: { temperature: 0 },
    });

    const rawCypher = cypherResponse.message.content;
    let cypher: string;

    try {
      cypher = extractCypher(rawCypher);
    } catch (e) {
      return NextResponse.json(
        {
          error: "Generated query was rejected for safety reasons.",
          cypher: rawCypher,
        },
        { status: 422 }
      );
    }

    // Step 2: Execute Cypher against Neo4j
    let results: Record<string, unknown>[];
    try {
      results = await runQuery(cypher);
    } catch (dbError) {
      return NextResponse.json(
        {
          error: `Cypher execution failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
          cypher,
        },
        { status: 422 }
      );
    }

    // Step 3: Summarize results in plain English
    const formattedResults = formatResults(results);
    const summaryResponse = await ollama.chat({
      model: MODEL,
      messages: [
        { role: "system", content: SUMMARIZE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Question: ${question}\n\nQuery Results:\n${formattedResults}`,
        },
      ],
      options: { temperature: 0.3 },
    });

    const answer = summaryResponse.message.content;

    return NextResponse.json({
      answer,
      cypher,
      results: results.slice(0, 25),
      resultCount: results.length,
    });
  } catch (error) {
    console.error("Query error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    // Check if Ollama is unreachable
    if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      return NextResponse.json(
        {
          error:
            "Cannot connect to Ollama. Make sure it is running: ollama serve",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
