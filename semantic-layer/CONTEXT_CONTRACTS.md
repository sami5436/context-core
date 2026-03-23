# ContextCore — Context Contracts

This document defines the data contracts for the ContextCore supply chain knowledge graph.
It serves as the single source of truth for entity definitions, metric logic, dimension
glossaries, and data quality expectations.

---

## 1. Entity Definitions

### Supplier
A business entity that provides raw materials, components, or finished goods into the supply chain.

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (SUP-XXX) |
| `name` | string | Legal business name |
| `region` | string | Operating region (North America, Europe, Asia Pacific, South America) |
| `rating` | float | Quality rating on 1.0-5.0 scale |
| `defect_rate` | float | Product defect rate as decimal (0.02 = 2%) |

### Product
A physical good tracked through the supply chain.

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (PRD-XXX) |
| `name` | string | Product name |
| `category` | string | Classification (Electronics, Structural, Packaging, Mechanical, Raw Materials) |
| `unit_cost` | float | Cost per unit in USD |
| `sku` | string | Stock keeping unit code |

### Order
A purchase or fulfillment order that moves products through the supply chain.

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (ORD-XXX) |
| `date` | string | Order date (YYYY-MM-DD) |
| `status` | string | Lifecycle stage (Processing, In Transit, Delivered, Cancelled) |
| `total_amount` | float | Total order value in USD |
| `priority` | string | Urgency level (Standard, Expedited, Critical) |
| `on_time` | boolean | Whether delivery was on time (null if not delivered) |

### Warehouse
A physical storage facility in the supply chain network.

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (WH-XXX) |
| `name` | string | Facility name |
| `location` | string | City and state |
| `capacity` | integer | Maximum storage units |
| `current_stock` | integer | Current inventory level |

---

## 2. Relationship Contracts

| Relationship | From | To | Properties | Description |
|---|---|---|---|---|
| `SUPPLIES` | Supplier | Product | `since` (date) | Supplier provides this product |
| `CONTAINS` | Order | Product | `quantity` (int) | Order includes N units of this product |
| `FULFILLED_BY` | Order | Warehouse | -- | Warehouse responsible for fulfilling this order |
| `STORED_IN` | Product | Warehouse | `quantity` (int) | Product inventory held at this warehouse |

---

## 3. Metric Definitions

### supplier_defect_rate
- **Definition**: Average defect rate across suppliers, expressed as a percentage
- **Formula**: `avg(supplier.defect_rate) * 100`
- **Unit**: Percent (%)
- **Direction**: Lower is better
- **Thresholds**: Warning at 3.0%, Critical at 5.0%
- **Dimensions**: `supplier_id`, `region`
- **Owner**: supply-chain-analytics

### order_fulfillment_rate
- **Definition**: Percentage of orders that have reached "Delivered" status
- **Formula**: `count(status='Delivered') / count(all_orders) * 100`
- **Unit**: Percent (%)
- **Direction**: Higher is better
- **Thresholds**: Warning below 85%, Critical below 70%
- **Dimensions**: `priority`, `date`
- **Owner**: operations-team

### warehouse_utilization
- **Definition**: Ratio of current stock to capacity per warehouse
- **Formula**: `current_stock / capacity * 100`
- **Unit**: Percent (%)
- **Direction**: Neutral (both extremes are problematic)
- **Thresholds**: Warning above 90% or below 40%
- **Dimensions**: `warehouse_id`, `location`
- **Owner**: warehouse-ops

### on_time_delivery_rate
- **Definition**: Percentage of delivered orders that arrived on schedule
- **Formula**: `count(on_time=true) / count(status='Delivered') * 100`
- **Unit**: Percent (%)
- **Direction**: Higher is better
- **Thresholds**: Warning below 90%, Critical below 80%
- **Dimensions**: `priority`, `date`, `region`
- **Owner**: logistics-team

---

## 4. Dimension Glossary

| Dimension | Type | Source | Values |
|---|---|---|---|
| `supplier_id` | categorical | Supplier.id | SUP-001 through SUP-008 |
| `region` | categorical | Supplier.region | North America, Europe, Asia Pacific, South America |
| `product_category` | categorical | Product.category | Electronics, Structural, Packaging, Mechanical, Raw Materials |
| `warehouse_id` | categorical | Warehouse.id | WH-001 through WH-005 |
| `location` | categorical | Warehouse.location | Newark NJ, Long Beach CA, Dallas TX, Chicago IL, Atlanta GA |
| `status` | categorical | Order.status | Processing, In Transit, Delivered, Cancelled |
| `priority` | categorical | Order.priority | Standard, Expedited, Critical |
| `date` | time | Order.date | YYYY-MM-DD format |

---

## 5. Data Quality Expectations

| Rule | Scope | Expectation |
|---|---|---|
| Uniqueness | All node IDs | Every id property must be unique within its label |
| Completeness | Supplier.rating | Must be between 1.0 and 5.0, never null |
| Completeness | Supplier.defect_rate | Must be between 0.0 and 1.0, never null |
| Completeness | Warehouse.capacity | Must be positive integer, never null |
| Referential Integrity | SUPPLIES | Every target Product must exist |
| Referential Integrity | FULFILLED_BY | Every target Warehouse must exist |
| Freshness | All data | Seed script is idempotent; re-run for fresh state |

---

## 6. Ownership and Refresh

| Component | Owner | Refresh Cadence |
|---|---|---|
| Supplier metrics | supply-chain-analytics | Daily |
| Order metrics | operations-team | Daily |
| Warehouse metrics | warehouse-ops | Hourly |
| Delivery metrics | logistics-team | Daily |
| Seed data | data-engineering | On-demand (idempotent) |
