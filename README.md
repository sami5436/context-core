# ContextCore

![Dashboard](docs/images/dashboard.png)

Enterprise supply chain knowledge graph + semantic layer with an AI query interface.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Graph Database**: Neo4j AuraDB (free tier)
- **Semantic Layer**: dbt Core (YAML metric definitions)
- **Data Pipeline**: Python
- **AI/LLM**: Ollama (llama3, local)

## Branch Roadmap

| Branch | Feature |
|---|---|
| `feat/neo4j-schema` | Neo4j connection + supply chain seed data |
| `feat/semantic-layer` | dbt YAML metric definitions + context contracts |
| `feat/ui-dashboard` | Next.js dashboard with graph overview + metrics |
| `feat/ai-query` | Natural language to Cypher via Ollama |
| `feat/graph-viz` | Interactive graph visualization |

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Neo4j AuraDB instance (free tier)
- Ollama (with llama3 model)

### Data Pipeline Setup

```bash
cd data-pipeline
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
# Edit .env with your Neo4j credentials
python seed.py
python verify.py
```
