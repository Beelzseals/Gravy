# Gravy

An enterprise-style backend project built with **Express**, **Drizzle ORM**, and **PostgreSQL**. Designed as a hands-on exercise in real-world backend architecture — covering authentication, authorization, multi-tenant data modeling, background jobs, caching, and testing.

## Architecture Highlights

- **Modular design** — each domain lives in its own module with dedicated repository, service, schema, and types files.
- **Policy-based authorization** — `ProjectPolicy` and `OrgPolicy` classes encode granular permission rules, decoupled from route handlers.
- **Session family model** — refresh tokens form a tree tracked by `familyId`. Token reuse triggers recursive CTE revocation of the entire family.
- **Multi-owner projects** — projects enforce an owner invariant: at least one `PROJECT_OWNER` must exist at all times, checked transactionally during role changes and removals.
- **Repository pattern** — all database access goes through repository classes, keeping SQL concerns out of services.

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn 4
- Docker & Docker Compose

### Setup

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Install dependencies
yarn install

# Run database migrations
yarn migrate:dev

# Start the dev server
yarn dev
```

## Implemented Features

- [x] Modular architecture with repositories, services, and policies
- [x] JWT access tokens + rotating refresh tokens
- [x] Session family model with reuse detection
- [x] Recursive CTE session revocation
- [x] Organization membership model
- [x] Project membership model (multi-owner)
- [x] Policy-based authorization design
- [x] Transactional project creation with owner insertion

## Roadmap

### 1. Granular Authorization Layer _(in progress)_

- Finalize `ProjectPolicy` and implement `OrgPolicy`
- Integrate policy guards into all services
- Enforce owner invariant across membership operations
- Unit tests for policies

### 2. Background Jobs + Email

- BullMQ-based queue system with Redis
- Resend integration for transactional email
- Invitation emails, suspicious login alerts, audit notifications
- Retry handling and failure logging

### 3. Rate Limiting + Caching

- Rate limiting on login, refresh, and project creation endpoints
- Redis caching for membership lookups and authorization evaluation

### 4. Testing

- Vitest test suite
- Policy unit tests, repository tests, service tests
- Auth refresh race condition coverage (concurrent refresh, reuse detection, owner invariant)

### 5. Observability

- Structured audit logs
- Request tracing
