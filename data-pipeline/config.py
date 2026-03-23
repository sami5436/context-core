import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

NEO4J_URI = os.getenv('NEO4J_URI')
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD')


def get_driver():
    """Create and return a Neo4j driver instance.

    Tries the URI as-is first, then falls back to neo4j+ssc://
    if SSL certificate verification fails (common with AuraDB free tier).
    """
    if not NEO4J_URI or not NEO4J_PASSWORD:
        raise ValueError(
            "Missing Neo4j credentials. "
            "Copy .env.example to .env and fill in your AuraDB details."
        )

    auth = (NEO4J_USERNAME, NEO4J_PASSWORD)

    # Try original URI first
    driver = GraphDatabase.driver(NEO4J_URI, auth=auth)
    try:
        driver.verify_connectivity()
        return driver
    except Exception:
        driver.close()

    # Fallback: swap to neo4j+ssc:// (accepts self-signed certs)
    ssc_uri = NEO4J_URI.replace("neo4j+s://", "neo4j+ssc://")
    if ssc_uri != NEO4J_URI:
        driver = GraphDatabase.driver(ssc_uri, auth=auth)
        try:
            driver.verify_connectivity()
            return driver
        except Exception:
            driver.close()

    raise ConnectionError(
        f"Cannot connect to Neo4j at {NEO4J_URI}. "
        "Check that the instance is running and credentials are correct."
    )


def verify_connection(driver):
    """Test the connection by running a simple query."""
    with driver.session() as session:
        result = session.run("RETURN 1 AS n")
        record = result.single()
        return record["n"] == 1
