/**
 * Neo4j graph schema definition for LLM prompt context.
 * Describes all node labels, properties, relationships, and their
 * semantics so the LLM can generate accurate Cypher queries.
 */

export const GRAPH_SCHEMA = `
## Neo4j Graph Schema

### Node Labels and Properties

Supplier
  - id: String (e.g. "SUP-001")
  - name: String (e.g. "Apex Components")
  - region: String (one of: "North America", "Europe", "Asia Pacific", "South America")
  - rating: Float (1.0 to 5.0 scale)
  - defect_rate: Float (decimal, e.g. 0.02 means 2%)

Product
  - id: String (e.g. "PRD-001")
  - name: String (e.g. "Circuit Board A1")
  - category: String (one of: "Electronics", "Structural", "Packaging", "Mechanical", "Raw Materials")
  - unit_cost: Float (USD)
  - sku: String (e.g. "CB-A1-2024")

Order
  - id: String (e.g. "ORD-001")
  - date: String (YYYY-MM-DD format)
  - status: String (one of: "Processing", "In Transit", "Delivered", "Cancelled")
  - total_amount: Float (USD)
  - priority: String (one of: "Standard", "Expedited", "Critical")
  - on_time: Boolean or null (true if delivered on time, null if not yet delivered)

Warehouse
  - id: String (e.g. "WH-001")
  - name: String (e.g. "East Coast Hub")
  - location: String (e.g. "Newark, NJ")
  - capacity: Integer (max storage units)
  - current_stock: Integer (current inventory level)

### Relationships

(Supplier)-[:SUPPLIES {since: String}]->(Product)
  A supplier provides a specific product.

(Order)-[:CONTAINS {quantity: Integer}]->(Product)
  An order includes a quantity of a specific product.

(Order)-[:FULFILLED_BY]->(Warehouse)
  A warehouse is responsible for fulfilling an order.

(Product)-[:STORED_IN {quantity: Integer}]->(Warehouse)
  A product has inventory stored at a warehouse.

### Example Cypher Queries

-- Count nodes by label
MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count

-- Find suppliers in a region
MATCH (s:Supplier) WHERE s.region = 'Asia Pacific' RETURN s.name, s.rating

-- Find which suppliers supply electronics
MATCH (s:Supplier)-[:SUPPLIES]->(p:Product) WHERE p.category = 'Electronics' RETURN s.name, p.name

-- Get warehouse utilization
MATCH (w:Warehouse) RETURN w.name, round(toFloat(w.current_stock) / w.capacity * 100, 1) AS utilization_pct

-- Orders fulfilled by a warehouse
MATCH (o:Order)-[:FULFILLED_BY]->(w:Warehouse) RETURN w.name, count(o) AS orders

-- Average defect rate by region
MATCH (s:Supplier) RETURN s.region, round(avg(s.defect_rate) * 100, 2) AS avg_defect_pct
`.trim();

export const CYPHER_SYSTEM_PROMPT = `You are a Neo4j Cypher query expert. Given a natural language question about a supply chain knowledge graph, generate a single valid Cypher query to answer it.

${GRAPH_SCHEMA}

Rules:
1. Output ONLY the Cypher query, nothing else. No explanations, no markdown fences.
2. Use the exact property names and relationship types from the schema above.
3. Always use RETURN to output meaningful results with clear aliases.
4. For percentage calculations, use round() and toFloat() for precision.
5. Limit results to 25 rows maximum unless the question asks for a specific count.
6. If the question is ambiguous, make a reasonable interpretation.
7. Never use DETACH DELETE, CREATE, SET, or MERGE — only read queries.`;

export const SUMMARIZE_SYSTEM_PROMPT = `You are a supply chain analyst. Given a user's question and the raw data results from a graph database query, provide a clear, concise answer in plain English.

Rules:
1. Be direct and specific — cite actual numbers from the results.
2. Keep the response to 2-4 sentences.
3. If results are empty, say so clearly.
4. Do not mention Cypher, Neo4j, or database internals.
5. Do not use emojis.`;
