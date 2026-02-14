# NoSQL Database Modelling — E-Commerce Application

A MongoDB schema design exercise for an e-commerce platform, covering initial design, analytics-driven refactoring, and a reflection on trade-offs.

## Database Choice

**MongoDB** (document-oriented NoSQL) was selected for its flexible schema, native support for embedded documents, rich query/aggregation framework, and built-in sharding and replication — all of which align with the e-commerce domain's requirements for fast product search, high-throughput order writes, and analytical queries.

## Deliverables

| # | Document | Description |
|---|----------|-------------|
| 1 | [Initial Schema Design](docs/01-initial-schema-design.md) | Part 1 — entity identification, collection designs, indexing, and consistency strategy |
| 2 | [Refactored Schema Design](docs/02-refactored-schema-design.md) | Part 2 — sharding, replication, denormalized analytics collections, CAP trade-offs |
| 3 | [Reflection Report](docs/03-reflection-report.md) | 200–300 word reflection on challenges, decisions, and improvements |

## JSON Schemas

Machine-readable MongoDB `$jsonSchema` validators live in the [`schemas/`](schemas/) directory:

```
schemas/
├── part1/          # Initial design
│   ├── users.json
│   ├── products.json
│   └── orders.json
└── part2/          # Refactored design
    ├── users.json
    ├── products.json
    ├── orders.json
    ├── product_analytics.json
    └── daily_sales.json
```

## Assignment

See [task.md](task.md) for the full assignment brief.
