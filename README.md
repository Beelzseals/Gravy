# Gravy

An enterprise-style backend project built with **Express**, **Drizzle ORM**, and **PostgreSQL**. Designed as a hands-on exercise in real-world backend architecture — covering authentication, authorization, multi-tenant data modeling, background jobs, caching, and testing.

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
- [x] Granular Authorization 

## Roadmap

### Background Jobs + Email

- BullMQ-based queue system with Redis
- Resend integration for transactional email
- Invitation emails, suspicious login alerts, audit notifications
- Retry handling and failure logging

### Rate Limiting + Caching

- Rate limiting on login, refresh, and project creation endpoints
- Redis caching for membership lookups and authorization evaluation

### Testing

- Vitest test suite
- Policy unit tests, repository tests, service tests
- Auth refresh race condition coverage (concurrent refresh, reuse detection, owner invariant)

### Observability

- Structured audit logs
- Request tracing
