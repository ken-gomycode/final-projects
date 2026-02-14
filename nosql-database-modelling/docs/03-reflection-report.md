# Reflection Report

## Challenges

The most significant challenge was selecting appropriate shard keys. Each key involves a trade-off: hashed keys distribute writes evenly but sacrifice range queries, while ranged keys support efficient scans but risk creating hot spots. For orders, hashing on `customer.userId` provides uniform distribution while still allowing efficient per-customer queries, since all of a customer's orders land on a single shard. For `daily_sales`, a ranged key on `date` was chosen despite the hot-shard problem for the current day, because the write volume is low (one upsert daily) and date-range analytics queries benefit greatly from data locality.

Deciding how much data to denormalize was another challenge. Embedding customer snapshots in orders duplicates data, but it preserves historical accuracy and eliminates cross-collection lookups for order display — a worthwhile trade-off for an immutable record like an order.

## Design Decisions

The dual CAP strategy was a key architectural decision. Rather than applying a single consistency model across the system, orders use strong consistency (`w: "majority"`) to prevent data loss, while analytics collections accept eventual consistency (`readPreference: "secondaryPreferred"`) to maximise read throughput. This separation acknowledges that transactional and analytical workloads have fundamentally different requirements.

Introducing `product_analytics` and `daily_sales` as pre-aggregated collections was driven by the need for millisecond-level analytics reads. These collections are rebuilt nightly via `$merge` pipelines, keeping them idempotent and easy to reason about.

## Improvements

The refactored design improves the system in three measurable ways. First, sharding enables horizontal write scaling across nodes, removing the single-server bottleneck. Second, the PSS replication topology delivers high availability with automatic failover, ensuring the platform survives node failures. Third, denormalized analytics collections reduce trend-analysis queries from multi-second aggregation scans to simple indexed lookups, improving dashboard response times by orders of magnitude.
