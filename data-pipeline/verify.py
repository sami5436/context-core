"""
ContextCore — Verification Script

Runs sample Cypher queries against the seeded Neo4j graph
to confirm data integrity and queryability.
"""

from config import get_driver, verify_connection


def print_header(title):
    print(f"\n{'─' * 50}")
    print(f"  {title}")
    print(f"{'─' * 50}")


def check_node_counts(session):
    print_header("Node Counts")
    result = session.run(
        """
        MATCH (n)
        RETURN labels(n)[0] AS label, count(n) AS count
        ORDER BY label
        """
    )
    for record in result:
        print(f"  {record['label']:<12} {record['count']}")


def check_relationship_counts(session):
    print_header("Relationship Counts")
    result = session.run(
        """
        MATCH ()-[r]->()
        RETURN type(r) AS type, count(r) AS count
        ORDER BY type
        """
    )
    for record in result:
        print(f"  {record['type']:<16} {record['count']}")


def query_suppliers_by_category(session):
    print_header("Suppliers of Electronics Products")
    result = session.run(
        """
        MATCH (s:Supplier)-[:SUPPLIES]->(p:Product)
        WHERE p.category = 'Electronics'
        RETURN DISTINCT s.name AS supplier, collect(p.name) AS products
        ORDER BY s.name
        """
    )
    for record in result:
        products = ", ".join(record["products"])
        print(f"  {record['supplier']:<25} -> {products}")


def query_defect_rate_by_region(session):
    print_header("Average Defect Rate by Region")
    result = session.run(
        """
        MATCH (s:Supplier)
        RETURN s.region AS region,
               round(avg(s.defect_rate) * 100, 2) AS avg_defect_pct,
               count(s) AS supplier_count
        ORDER BY avg_defect_pct
        """
    )
    for record in result:
        print(f"  {record['region']:<20} {record['avg_defect_pct']}%  ({record['supplier_count']} suppliers)")


def query_warehouse_fulfillment(session):
    print_header("Orders Fulfilled per Warehouse")
    result = session.run(
        """
        MATCH (o:Order)-[:FULFILLED_BY]->(w:Warehouse)
        RETURN w.name AS warehouse, w.location AS location, count(o) AS orders_fulfilled
        ORDER BY orders_fulfilled DESC
        """
    )
    for record in result:
        print(f"  {record['warehouse']:<25} {record['location']:<18} {record['orders_fulfilled']} orders")


def query_warehouse_utilization(session):
    print_header("Warehouse Utilization")
    result = session.run(
        """
        MATCH (w:Warehouse)
        RETURN w.name AS warehouse,
               w.current_stock AS stock,
               w.capacity AS capacity,
               round(toFloat(w.current_stock) / w.capacity * 100, 1) AS utilization_pct
        ORDER BY utilization_pct DESC
        """
    )
    for record in result:
        print(f"  {record['warehouse']:<25} {record['stock']}/{record['capacity']}  ({record['utilization_pct']}%)")


def query_order_status_breakdown(session):
    print_header("Order Status Breakdown")
    result = session.run(
        """
        MATCH (o:Order)
        RETURN o.status AS status, count(o) AS count,
               round(avg(o.total_amount), 2) AS avg_amount
        ORDER BY count DESC
        """
    )
    for record in result:
        print(f"  {record['status']:<14} {record['count']} orders   avg ${record['avg_amount']:,.2f}")


def query_on_time_delivery(session):
    print_header("On-Time Delivery Rate (Delivered Orders)")
    result = session.run(
        """
        MATCH (o:Order)
        WHERE o.status = 'Delivered' AND o.on_time IS NOT NULL
        RETURN count(o) AS total_delivered,
               sum(CASE WHEN o.on_time = true THEN 1 ELSE 0 END) AS on_time_count,
               round(toFloat(sum(CASE WHEN o.on_time = true THEN 1 ELSE 0 END)) / count(o) * 100, 1) AS on_time_pct
        """
    )
    record = result.single()
    if record:
        print(f"  {record['on_time_count']}/{record['total_delivered']} delivered on time ({record['on_time_pct']}%)")


def main():
    print("ContextCore — Graph Verification")
    print("=" * 50)

    driver = get_driver()

    print("\nConnecting to Neo4j...")
    if verify_connection(driver):
        print("  Connected successfully.")
    else:
        print("  ERROR: Connection test failed.")
        return

    with driver.session() as session:
        check_node_counts(session)
        check_relationship_counts(session)
        query_suppliers_by_category(session)
        query_defect_rate_by_region(session)
        query_warehouse_fulfillment(session)
        query_warehouse_utilization(session)
        query_order_status_breakdown(session)
        query_on_time_delivery(session)

    driver.close()
    print(f"\n{'=' * 50}")
    print("Verification complete.")


if __name__ == "__main__":
    main()
