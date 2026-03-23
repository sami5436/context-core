"""
ContextCore — Supply Chain Graph Seed Script

Seeds Neo4j with mock supply chain data:
  Nodes:      Supplier, Product, Warehouse, Order
  Relationships: SUPPLIES, CONTAINS, FULFILLED_BY, STORED_IN
"""

import random
from config import get_driver, verify_connection

random.seed(42)

# ---------------------------------------------------------------------------
# Mock data
# ---------------------------------------------------------------------------

SUPPLIERS = [
    {"id": "SUP-001", "name": "Apex Components", "region": "North America", "rating": 4.5, "defect_rate": 0.02},
    {"id": "SUP-002", "name": "GlobalTech Parts", "region": "Europe", "rating": 4.2, "defect_rate": 0.03},
    {"id": "SUP-003", "name": "ShenZhen Electronics", "region": "Asia Pacific", "rating": 4.8, "defect_rate": 0.01},
    {"id": "SUP-004", "name": "Baltic Materials", "region": "Europe", "rating": 3.9, "defect_rate": 0.05},
    {"id": "SUP-005", "name": "Rio Industrial", "region": "South America", "rating": 4.0, "defect_rate": 0.04},
    {"id": "SUP-006", "name": "MidWest Manufacturing", "region": "North America", "rating": 4.3, "defect_rate": 0.02},
    {"id": "SUP-007", "name": "Osaka Precision", "region": "Asia Pacific", "rating": 4.7, "defect_rate": 0.01},
    {"id": "SUP-008", "name": "Nordic Supply Co", "region": "Europe", "rating": 4.1, "defect_rate": 0.03},
]

PRODUCTS = [
    {"id": "PRD-001", "name": "Circuit Board A1", "category": "Electronics", "unit_cost": 12.50, "sku": "CB-A1-2024"},
    {"id": "PRD-002", "name": "Steel Frame X7", "category": "Structural", "unit_cost": 45.00, "sku": "SF-X7-2024"},
    {"id": "PRD-003", "name": "Sensor Module V3", "category": "Electronics", "unit_cost": 28.75, "sku": "SM-V3-2024"},
    {"id": "PRD-004", "name": "Polymer Casing B2", "category": "Packaging", "unit_cost": 8.20, "sku": "PC-B2-2024"},
    {"id": "PRD-005", "name": "Hydraulic Valve M1", "category": "Mechanical", "unit_cost": 67.30, "sku": "HV-M1-2024"},
    {"id": "PRD-006", "name": "Copper Wire Spool", "category": "Raw Materials", "unit_cost": 15.40, "sku": "CW-SP-2024"},
    {"id": "PRD-007", "name": "LED Display Panel", "category": "Electronics", "unit_cost": 95.00, "sku": "LD-DP-2024"},
    {"id": "PRD-008", "name": "Aluminum Sheet 4x8", "category": "Raw Materials", "unit_cost": 32.00, "sku": "AS-48-2024"},
    {"id": "PRD-009", "name": "Rubber Gasket Kit", "category": "Mechanical", "unit_cost": 5.60, "sku": "RG-KT-2024"},
    {"id": "PRD-010", "name": "Power Supply Unit", "category": "Electronics", "unit_cost": 42.00, "sku": "PS-UN-2024"},
    {"id": "PRD-011", "name": "Thermal Adhesive", "category": "Packaging", "unit_cost": 11.25, "sku": "TA-AD-2024"},
    {"id": "PRD-012", "name": "Bearing Assembly", "category": "Mechanical", "unit_cost": 23.80, "sku": "BA-AS-2024"},
]

WAREHOUSES = [
    {"id": "WH-001", "name": "East Coast Hub", "location": "Newark, NJ", "capacity": 50000, "current_stock": 32150},
    {"id": "WH-002", "name": "West Coast Depot", "location": "Long Beach, CA", "capacity": 75000, "current_stock": 58400},
    {"id": "WH-003", "name": "Central Distribution", "location": "Dallas, TX", "capacity": 60000, "current_stock": 41200},
    {"id": "WH-004", "name": "Great Lakes Facility", "location": "Chicago, IL", "capacity": 45000, "current_stock": 28900},
    {"id": "WH-005", "name": "Southeast Center", "location": "Atlanta, GA", "capacity": 40000, "current_stock": 35600},
]

STATUSES = ["Delivered", "In Transit", "Processing", "Cancelled"]
PRIORITIES = ["Standard", "Expedited", "Critical"]

ORDERS = []
for i in range(1, 21):
    status = random.choice(STATUSES)
    ORDERS.append({
        "id": f"ORD-{i:03d}",
        "date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
        "status": status,
        "total_amount": round(random.uniform(500, 25000), 2),
        "priority": random.choice(PRIORITIES),
        "on_time": random.random() > 0.2 if status == "Delivered" else None,
    })

# Supplier -> Product mapping (each supplier supplies 1-3 products)
SUPPLY_MAP = {
    "SUP-001": ["PRD-001", "PRD-003", "PRD-010"],
    "SUP-002": ["PRD-002", "PRD-008"],
    "SUP-003": ["PRD-003", "PRD-007", "PRD-010"],
    "SUP-004": ["PRD-004", "PRD-011"],
    "SUP-005": ["PRD-005", "PRD-006"],
    "SUP-006": ["PRD-006", "PRD-008", "PRD-009"],
    "SUP-007": ["PRD-007", "PRD-012"],
    "SUP-008": ["PRD-002", "PRD-009", "PRD-012"],
}

# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

def clear_database(session):
    """Remove all existing nodes and relationships."""
    session.run("MATCH (n) DETACH DELETE n")
    print("  Cleared existing data.")


def create_constraints(session):
    """Create uniqueness constraints / indexes for each node label."""
    constraints = [
        ("Supplier", "id"),
        ("Product", "id"),
        ("Warehouse", "id"),
        ("Order", "id"),
    ]
    for label, prop in constraints:
        try:
            session.run(
                f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{label}) REQUIRE n.{prop} IS UNIQUE"
            )
        except Exception:
            pass  # AuraDB free tier may limit some constraint operations
    print("  Created constraints.")


def create_suppliers(session):
    session.run(
        """
        UNWIND $suppliers AS s
        CREATE (n:Supplier {
            id: s.id, name: s.name, region: s.region,
            rating: s.rating, defect_rate: s.defect_rate
        })
        """,
        suppliers=SUPPLIERS,
    )
    print(f"  Created {len(SUPPLIERS)} Supplier nodes.")


def create_products(session):
    session.run(
        """
        UNWIND $products AS p
        CREATE (n:Product {
            id: p.id, name: p.name, category: p.category,
            unit_cost: p.unit_cost, sku: p.sku
        })
        """,
        products=PRODUCTS,
    )
    print(f"  Created {len(PRODUCTS)} Product nodes.")


def create_warehouses(session):
    session.run(
        """
        UNWIND $warehouses AS w
        CREATE (n:Warehouse {
            id: w.id, name: w.name, location: w.location,
            capacity: w.capacity, current_stock: w.current_stock
        })
        """,
        warehouses=WAREHOUSES,
    )
    print(f"  Created {len(WAREHOUSES)} Warehouse nodes.")


def create_orders(session):
    orders_clean = []
    for o in ORDERS:
        record = {k: v for k, v in o.items()}
        if record["on_time"] is None:
            del record["on_time"]
        orders_clean.append(record)

    session.run(
        """
        UNWIND $orders AS o
        CREATE (n:Order {
            id: o.id, date: o.date, status: o.status,
            total_amount: o.total_amount, priority: o.priority
        })
        SET n.on_time = CASE WHEN o.on_time IS NOT NULL THEN o.on_time ELSE null END
        """,
        orders=ORDERS,
    )
    print(f"  Created {len(ORDERS)} Order nodes.")


def create_supplies_relationships(session):
    """(Supplier)-[:SUPPLIES]->(Product)"""
    pairs = []
    for sup_id, prod_ids in SUPPLY_MAP.items():
        for prod_id in prod_ids:
            pairs.append({"sup_id": sup_id, "prod_id": prod_id})

    session.run(
        """
        UNWIND $pairs AS p
        MATCH (s:Supplier {id: p.sup_id}), (pr:Product {id: p.prod_id})
        CREATE (s)-[:SUPPLIES {since: '2023-01-01'}]->(pr)
        """,
        pairs=pairs,
    )
    print(f"  Created {len(pairs)} SUPPLIES relationships.")


def create_contains_relationships(session):
    """(Order)-[:CONTAINS {quantity}]->(Product)"""
    pairs = []
    product_ids = [p["id"] for p in PRODUCTS]
    for order in ORDERS:
        num_items = random.randint(1, 4)
        chosen = random.sample(product_ids, num_items)
        for prod_id in chosen:
            pairs.append({
                "order_id": order["id"],
                "prod_id": prod_id,
                "quantity": random.randint(1, 100),
            })

    session.run(
        """
        UNWIND $pairs AS p
        MATCH (o:Order {id: p.order_id}), (pr:Product {id: p.prod_id})
        CREATE (o)-[:CONTAINS {quantity: p.quantity}]->(pr)
        """,
        pairs=pairs,
    )
    print(f"  Created {len(pairs)} CONTAINS relationships.")


def create_fulfilled_by_relationships(session):
    """(Order)-[:FULFILLED_BY]->(Warehouse)"""
    warehouse_ids = [w["id"] for w in WAREHOUSES]
    pairs = []
    for order in ORDERS:
        wh_id = random.choice(warehouse_ids)
        pairs.append({"order_id": order["id"], "wh_id": wh_id})

    session.run(
        """
        UNWIND $pairs AS p
        MATCH (o:Order {id: p.order_id}), (w:Warehouse {id: p.wh_id})
        CREATE (o)-[:FULFILLED_BY]->(w)
        """,
        pairs=pairs,
    )
    print(f"  Created {len(pairs)} FULFILLED_BY relationships.")


def create_stored_in_relationships(session):
    """(Product)-[:STORED_IN {quantity}]->(Warehouse)"""
    warehouse_ids = [w["id"] for w in WAREHOUSES]
    pairs = []
    for product in PRODUCTS:
        num_warehouses = random.randint(1, 3)
        chosen = random.sample(warehouse_ids, num_warehouses)
        for wh_id in chosen:
            pairs.append({
                "prod_id": product["id"],
                "wh_id": wh_id,
                "quantity": random.randint(100, 5000),
            })

    session.run(
        """
        UNWIND $pairs AS p
        MATCH (pr:Product {id: p.prod_id}), (w:Warehouse {id: p.wh_id})
        CREATE (pr)-[:STORED_IN {quantity: p.quantity}]->(w)
        """,
        pairs=pairs,
    )
    print(f"  Created {len(pairs)} STORED_IN relationships.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("ContextCore — Supply Chain Seed Script")
    print("=" * 45)

    driver = get_driver()

    # Verify connection
    print("\n[1/3] Testing connection...")
    if verify_connection(driver):
        print("  Connected to Neo4j successfully.")
    else:
        print("  ERROR: Connection test failed.")
        return

    # Seed data
    print("\n[2/3] Seeding graph data...")
    with driver.session() as session:
        clear_database(session)
        create_constraints(session)
        create_suppliers(session)
        create_products(session)
        create_warehouses(session)
        create_orders(session)
        create_supplies_relationships(session)
        create_contains_relationships(session)
        create_fulfilled_by_relationships(session)
        create_stored_in_relationships(session)

    # Summary
    print("\n[3/3] Seed complete.")
    with driver.session() as session:
        result = session.run(
            """
            MATCH (n)
            RETURN labels(n)[0] AS label, count(n) AS count
            ORDER BY label
            """
        )
        print("\n  Node counts:")
        for record in result:
            print(f"    {record['label']}: {record['count']}")

        result = session.run(
            """
            MATCH ()-[r]->()
            RETURN type(r) AS type, count(r) AS count
            ORDER BY type
            """
        )
        print("\n  Relationship counts:")
        for record in result:
            print(f"    {record['type']}: {record['count']}")

    driver.close()
    print("\nDone. Graph is ready.")


if __name__ == "__main__":
    main()
