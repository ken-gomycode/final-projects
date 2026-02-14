# Part 2: Refactored Schema Design

## 1. New Requirements

The platform must now support:

1. **Analytics** — Large-scale analytical queries on product trends and sales data.
2. **High Availability** — The system must remain operational during node failures.
3. **Partition Tolerance** — The system must handle network partitions across data centres.

These requirements demand changes to the data model, the replication topology, and the introduction of sharding and denormalized analytics collections.

## 2. CAP Analysis

MongoDB operates as a **CP system** by default (consistency + partition tolerance). However, not every workload needs the same guarantee. We adopt a **dual CAP strategy**:

| Workload | CAP Priority | Configuration |
|----------|-------------|---------------|
| **Orders** (transactional) | CP | `w: "majority"`, `readConcern: "majority"` |
| **Analytics** (read-heavy) | AP | `readPreference: "secondaryPreferred"`, `readConcern: "local"` |

Orders must never lose data, so we accept slightly higher write latency for strong consistency. Analytics queries tolerate slightly stale data in exchange for higher read throughput and availability — reading from secondaries distributes load and keeps the primary free for writes.

## 3. Replication Configuration

### Topology: PSS (Primary–Secondary–Secondary)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Primary   │────▶│ Secondary 1 │     │ Secondary 2 │
│  (writes)   │────▶│  (HA + reads)│     │  (HA + reads)│
└─────────────┘     └─────────────┘     └─────────────┘
```

- **1 Primary** handles all writes.
- **2 Secondaries** replicate asynchronously and serve analytics reads (`secondaryPreferred`).
- **Automatic failover**: if the primary goes down, the remaining nodes elect a new primary (typically within 10–12 seconds).
- `w: "majority"` ensures a write is replicated to at least 2 of 3 nodes before acknowledgement, surviving any single-node failure.

## 4. Sharding Strategy

Sharding distributes data across multiple shards, each being its own replica set.

| Collection | Shard Key | Strategy | Rationale |
|------------|-----------|----------|-----------|
| `orders` | `{ "customer.userId": "hashed" }` | Hashed | Even write distribution; a single customer's orders land on one shard for efficient "my orders" queries |
| `products` | `{ category: 1, _id: 1 }` | Compound ranged | Products in the same category are co-located for category browsing; `_id` suffix prevents hot spots within large categories |
| `product_analytics` | `{ productId: "hashed" }` | Hashed | Even distribution of per-product analytics documents |
| `daily_sales` | `{ date: 1 }` | Ranged | Time-series data is naturally queried by date range; recent data clusters on the latest shard |

### Shard Key Trade-offs

- **Hashed keys** sacrifice range queries for uniform distribution. For orders, this is acceptable because range queries on orders are almost always scoped to a single customer (which is the shard key).
- **Ranged keys** on `daily_sales` create a "hot shard" for the current day, but this is mitigated by the low write volume (one upsert per day) and the benefit of efficient date-range scans.

## 5. Denormalization for Analytics

### Problem

Running aggregation pipelines on the `orders` collection for product trends or daily revenue is expensive at scale — it requires scanning millions of order documents and unwinding line items.

### Solution: Pre-Aggregated Analytics Collections

Two new collections store pre-computed metrics:

#### 5.1 `product_analytics`

One document per product, updated nightly via a `$merge` aggregation pipeline.

```json
{
  "_id": "ObjectId",
  "productId": "ObjectId",
  "sku": "ELEC-TV-SAM-55",
  "productName": "Samsung 55\" Smart TV",
  "totalUnitsSold": 1450,
  "totalRevenue": 797550.00,
  "totalOrders": 1320,
  "averageOrderQuantity": 1.1,
  "returnRate": 0.02,
  "lastUpdated": "ISODate"
}
```

**Query examples**:
- "What are the top 10 best-selling products?" → `sort({ totalUnitsSold: -1 }).limit(10)`
- "Which products have the highest return rate?" → `sort({ returnRate: -1 })`

#### 5.2 `daily_sales`

One document per day, summarising platform-wide sales metrics.

```json
{
  "_id": "ObjectId",
  "date": "ISODate(2026-02-14)",
  "totalOrders": 3842,
  "totalRevenue": 284500.00,
  "averageOrderValue": 74.05,
  "topCategories": [
    { "category": "Electronics", "revenue": 98200.00, "orders": 1105 },
    { "category": "Clothing", "revenue": 62800.00, "orders": 1540 }
  ],
  "lastUpdated": "ISODate"
}
```

**Query examples**:
- "What was last week's revenue?" → `find({ date: { $gte: ..., $lte: ... } })`
- "Show the daily revenue trend for the past 30 days" → aggregation with `$group` by date (already pre-grouped).

### Update Strategy

```
┌──────────────────────────────────────────────────────────┐
│                  Nightly Batch Pipeline                   │
│                                                          │
│  orders ──▶ $unwind items ──▶ $group by productId ──▶    │
│       $merge into product_analytics                      │
│                                                          │
│  orders ──▶ $group by date ──▶ $merge into daily_sales   │
└──────────────────────────────────────────────────────────┘

Optional: Change Streams on orders ──▶ increment counters
          in product_analytics/daily_sales for near-real-time
```

- **Nightly `$merge`** rebuilds analytics from the source of truth (orders). `$merge` is idempotent — re-running it produces the same result.
- **Change streams** (optional) attach to the `orders` collection and increment counters on each new order for near-real-time dashboards.

## 6. Refactored Collection Schemas

### 6.1 `users` — Unchanged

No changes from Part 1. User profiles are not affected by the analytics or HA requirements.

### 6.2 `products` — Minor Addition

A lightweight `analyticsSummary` field is embedded for quick display on product listing pages, avoiding a join to `product_analytics`:

```json
{
  "analyticsSummary": {
    "totalSold": 1450,
    "averageRating": 4.3,
    "lastUpdated": "ISODate"
  }
}
```

This field is updated by the same nightly pipeline that populates `product_analytics`.

### 6.3 `orders` — Unchanged Schema, New Shard Key

The document structure is identical to Part 1. The only infrastructure change is the addition of the hashed shard key on `customer.userId`.

### 6.4 `product_analytics` — New

See section 5.1.

### 6.5 `daily_sales` — New

See section 5.2.

## 7. Trade-off Summary

| Dimension | Part 1 | Part 2 | Trade-off |
|-----------|--------|--------|-----------|
| **Consistency** | Strong everywhere | Strong for orders, eventual for analytics | Analytics may be up to 24h stale (acceptable for trend analysis) |
| **Availability** | Single replica set | PSS replication + sharding | Survives single-node failure; automatic failover |
| **Read performance** | Aggregation on raw data | Pre-aggregated collections | Millisecond analytics reads vs. multi-second aggregations |
| **Write performance** | Single node | Distributed via sharding | Horizontal write scaling across shards |
| **Storage** | Normalized | Denormalized (data duplicated in analytics) | ~15–20% additional storage for analytics collections |
| **Complexity** | Simple | Higher (sharding, pipelines, change streams) | Operational overhead justified by scale requirements |
