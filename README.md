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

### Authentication

- [x] JWT access tokens (15-minute expiry) + rotating refresh tokens
- [x] Session family model with reuse detection and grace period
- [x] Recursive CTE session revocation (marks entire compromised chain)
- [x] Refresh token hashing in database

### Authorization

- [x] Policy-based authorization with per-action role checks
- [x] Auth middleware for JWT verification on protected routes
- [x] Typed error responses (unauthorized, forbidden, notFound, unprocessableEntity)

### Organizations

- [x] Organization CRUD with repository pattern
- [x] 3-tier membership roles: `ORG_OWNER`, `ORG_ADMIN`, `ORG_MEMBER`
- [x] Org-scoped policies: `view`, `updateSettings`, `manageMembers`, `createProject`, `viewBilling`

### Projects

- [x] Project CRUD scoped to organizations
- [x] 3-tier membership roles: `PROJECT_OWNER`, `PROJECT_EDITOR`, `PROJECT_VIEWER`
- [x] Transactional project creation with creator assigned as `PROJECT_OWNER`
- [x] Owner invariant enforcement — last owner cannot be removed (409)
- [x] Project-scoped policies: `create`, `list`, `view`, `update`, `delete`, `inviteMember`, `changeMemberRole`, `removeMember`

### Infrastructure

- [x] BullMQ queue with exponential backoff (3 attempts: 1s → 2s → 4s)
- [x] Email worker with concurrency control (5 concurrent jobs), retry callbacks, and job lifecycle logging
- [x] AWS SES v2 client for transactional email
- [x] Invitation email template (HTML + plaintext)
- [x] Pino structured logger (pretty in dev, JSON in prod)
- [x] Custom error factory with typed HTTP status codes
- [x] Global error handler middleware

### Testing

- [x] Organization policy unit tests
- [x] Project policy unit tests
- [x] Project membership service invariant tests (owner removal, 409 enforcement)

## Roadmap

### Email & Invitations

- Wire invitation queue into user flow (invitation endpoint)
- Suspicious login alert emails
- Audit notification emails

### Rate Limiting

- Rate limiting on auth endpoints (login, refresh)
- Rate limiting on project creation

### Caching

- Redis caching layer (`src/infra/cache/`)
- Cache membership lookups and authorization evaluation

### Audit Logging

- Audit event emission on write operations (schema already defined)
- Audit repository and query API

### Testing

- Auth refresh race condition coverage (concurrent refresh, reuse detection)
- Repository integration tests
