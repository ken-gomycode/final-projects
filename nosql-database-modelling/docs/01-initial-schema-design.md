# Part 1: Initial Schema Design

## 1. Introduction

This document presents the initial MongoDB schema for an e-commerce application that supports product browsing, full-text search, and high-throughput order processing. The design targets thousands of transactions per second while maintaining data consistency for order operations.

## 2. Why MongoDB?

MongoDB is well-suited to this domain for several reasons:

- **Flexible documents** — Products can have varying attribute sets (clothing sizes vs. electronics specs) without schema migrations.
- **Embedded sub-documents** — Order line items and delivery history fit naturally inside an order document, enabling single-document reads.
- **Text indexes** — Native full-text search over product names, descriptions, and tags removes the need for a separate search engine in the initial design.
- **Write throughput** — The WiredTiger engine with document-level locking handles thousands of concurrent writes.
- **Aggregation framework** — Enables future analytics without leaving the database.

## 3. Entity Identification

| Entity | Role | Access Pattern |
|--------|------|----------------|
| **Users** | Customers who browse and purchase | Read-heavy; looked up by email at login |
| **Products** | Items available for sale | Read-heavy; searched by text, filtered by category/price |
| **Orders** | Purchase transactions | Write-heavy; created at checkout, updated for delivery status |

## 4. Collection Designs

### 4.1 `users`

Stores customer profiles. Kept intentionally lean — the user document holds identity and contact information only.

```json
{
  "_id": "ObjectId",
  "email": "jane@example.com",
  "name": {
    "first": "Jane",
    "last": "Doe"
  },
  "passwordHash": "$2b$12$...",
  "address": {
    "street": "123 Main St",
    "city": "Lagos",
    "state": "LA",
    "zip": "100001",
    "country": "NG"
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Design rationale**: A flat, simple document. No embedded orders or carts — those are separate collections to avoid unbounded array growth.

### 4.2 `products`

Stores the product catalog. Supports full-text search and category-based browsing.

```json
{
  "_id": "ObjectId",
  "sku": "ELEC-TV-SAM-55",
  "name": "Samsung 55\" Smart TV",
  "description": "Crystal UHD 4K display with HDR10+ support.",
  "category": "Electronics",
  "subcategory": "Televisions",
  "price": 549.99,
  "currency": "USD",
  "stock": 120,
  "tags": ["samsung", "tv", "4k", "smart-tv"],
  "images": [
    "/images/products/sam-55-front.jpg",
    "/images/products/sam-55-side.jpg"
  ],
  "attributes": {
    "brand": "Samsung",
    "screenSize": "55\"",
    "resolution": "3840x2160"
  },
  "isActive": true,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Design rationale**: The `attributes` sub-document is schema-flexible — different product categories can store different attributes without altering the collection schema. Tags support both search and faceted navigation.

### 4.3 `orders`

Stores purchase transactions with embedded customer snapshots and line items.

```json
{
  "_id": "ObjectId",
  "orderNumber": "ORD-20260214-0001",
  "customer": {
    "userId": "ObjectId",
    "email": "jane@example.com",
    "name": "Jane Doe"
  },
  "items": [
    {
      "productId": "ObjectId",
      "sku": "ELEC-TV-SAM-55",
      "name": "Samsung 55\" Smart TV",
      "price": 549.99,
      "quantity": 1,
      "subtotal": 549.99
    }
  ],
  "totals": {
    "subtotal": 549.99,
    "tax": 44.00,
    "shipping": 15.00,
    "total": 608.99
  },
  "payment": {
    "method": "card",
    "status": "captured"
  },
  "delivery": {
    "status": "shipped",
    "address": {
      "street": "123 Main St",
      "city": "Lagos",
      "state": "LA",
      "zip": "100001",
      "country": "NG"
    },
    "history": [
      { "status": "pending",    "timestamp": "ISODate" },
      { "status": "processing", "timestamp": "ISODate" },
      { "status": "shipped",    "timestamp": "ISODate" }
    ]
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Design rationale**:

- **Embedded customer snapshot** — The `customer` field copies key user fields at the time of order. This keeps the order self-contained as a historical record; if the user later changes their email or name, existing orders remain accurate.
- **Embedded line items** — Each item captures the product name and price at the time of purchase (point-in-time snapshot). This avoids joins and guarantees the order reflects exactly what the customer paid.
- **Delivery history array** — An append-only array of status transitions. Arrays are bounded in practice (an order goes through a finite set of states), so unbounded growth is not a concern here.

## 5. Indexing Strategy

### 5.1 `users` Indexes

| Index | Spec | Purpose |
|-------|------|---------|
| Unique email | `{ email: 1 }` unique | Login lookup, duplicate prevention |
| Name compound | `{ "name.last": 1, "name.first": 1 }` | Admin user search |

### 5.2 `products` Indexes

| Index | Spec | Purpose |
|-------|------|---------|
| Text search | `{ name: "text", description: "text", tags: "text" }` | Full-text product search |
| Category browse | `{ category: 1, subcategory: 1, price: 1 }` | Category listing with price sort/filter |
| Price range | `{ price: 1 }` | Price-based filtering |
| Unique SKU | `{ sku: 1 }` unique | Inventory lookup |

### 5.3 `orders` Indexes

| Index | Spec | Purpose |
|-------|------|---------|
| Customer orders | `{ "customer.userId": 1, createdAt: -1 }` | "My orders" page, sorted by newest |
| Unique order number | `{ orderNumber: 1 }` unique | Order lookup by reference |
| Delivery status | `{ "delivery.status": 1 }` | Operations dashboard filtering |
| Recent orders | `{ createdAt: -1 }` | Admin recent-orders view |

## 6. Consistency & Scalability

### Write Concern

Orders use a strict write concern to guarantee durability:

```javascript
writeConcern: { w: "majority", j: true }
```

This ensures every order write is acknowledged by a majority of replica set members and flushed to the journal before the application receives confirmation. While this adds latency, it prevents data loss in the event of a primary node failure — a critical property for financial transactions.

### Read Concern

Order reads use `readConcern: "majority"` to ensure the application only sees committed data, preventing dirty reads of in-flight transactions.

### Scalability Considerations

- **Vertical scaling** is sufficient for the initial deployment (thousands of TPS is achievable on a single replica set with modern hardware).
- **Replica set** (1 primary + 2 secondaries) provides read scaling and automatic failover.
- **Sharding** is deferred to Part 2, where increased data volume and analytical requirements justify the operational complexity.
