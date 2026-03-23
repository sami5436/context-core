import neo4j, { Driver } from "neo4j-driver";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USERNAME || "neo4j";
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !password) {
    throw new Error(
      "Missing NEO4J_URI or NEO4J_PASSWORD environment variables."
    );
  }

  // Use neo4j+ssc:// for AuraDB free tier SSL compatibility
  const sscUri = uri.replace("neo4j+s://", "neo4j+ssc://");

  driver = neo4j.driver(sscUri, neo4j.auth.basic(user, password));
  return driver;
}

export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const d = getDriver();
  const session = d.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => {
      const obj: Record<string, unknown> = {};
      record.keys.forEach((key) => {
        const val = record.get(key);
        // Convert Neo4j integers to JS numbers
        obj[key as string] = neo4j.isInt(val) ? val.toNumber() : val;
      });
      return obj as T;
    });
  } finally {
    await session.close();
  }
}
