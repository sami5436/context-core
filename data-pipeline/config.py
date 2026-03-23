import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

NEO4J_URI = os.getenv('NEO4J_URI')
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD')


def get_driver():
    """Create and return a Neo4j driver instance."""
    if not NEO4J_URI or not NEO4J_PASSWORD:
        raise ValueError(
            "Missing Neo4j credentials. "
            "Copy .env.example to .env and fill in your AuraDB details."
        )
    return GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))


def verify_connection(driver):
    """Test the connection by running a simple query."""
    with driver.session() as session:
        result = session.run("RETURN 1 AS n")
        record = result.single()
        return record["n"] == 1
