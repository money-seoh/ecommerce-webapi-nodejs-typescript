# E-commerce Web API — Project Guidelines

## Project Overview
Backend-only REST API for e-commerce (Node.js + TypeScript + Express + SQL Server). Modules: Product Catalog, Inventory, Cart, Checkout, Orders, Payments, User Management. No UI/frontend components.

## Architecture
Layered architecture with one-way dependency flow: Controller -> Service -> Repository -> Prisma Client -> SQL Server.
- Controllers: parse/validate HTTP input, call a service, shape the HTTP response. No business logic, no direct DB access.
- Services: own business/domain rules and orchestrate repositories.
- Repositories: the only layer allowed to talk to Prisma Client/the database.

Current project structure:
```
prisma/
  schema.prisma
  migrations/             # Prisma migration files
  seed.ts
src/
  app.ts
  server.ts
  config/
    container.ts
    env.ts
    prisma.ts
  controllers/
    user.controller.ts
  dtos/
    user.dto.ts
  middlewares/
    bootstrap-admin-auth.middleware.ts
    error-handler.middleware.ts
  repositories/
    role.repository.ts
    user.repository.ts
  routes/
    admin-user.routes.ts
    customer.routes.ts
    index.ts
  services/
    user.service.ts
  utils/
    errors.ts
    password.ts
    token.ts
test/                        # unit + integration tests
```

## Code Style
- TypeScript strict mode; explicit types on exported/public function signatures.
- Files/folders: kebab-case. Classes: PascalCase. Variables/functions: camelCase.
- One class/concern per file.

## API Design Standards
See `.github/instructions/api-design.instructions.md`.

## Endpoint Security Requirement Standards
See `.github/instructions/endpoint-security-requirements.instructions.md` when drafting issue requirements or endpoint-level acceptance criteria.

## ORM & Data Access
ORM: Prisma. See `.github/instructions/orm-prisma.instructions.md`.

## Error Handling
See `.github/instructions/error-handling.instructions.md`.

## Domain Rules
See `.github/instructions/domain-rules.instructions.md`.

## Testing
Jest for unit and integration tests. See `.github/instructions/testing.instructions.md`.

## Build and Test
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Test: `npm test`
- Prisma generate: `npm run prisma:generate`
- Prisma migrate (local): `npm run prisma:migrate`

## Current API Baseline (v1)
- `GET /api/v1/health` -> health probe.
- `POST /api/v1/admin/users` -> admin-managed user creation.
- `POST /api/v1/customers/register` -> customer self-registration.
- `POST /api/v1/customers/login` -> customer authentication (access token response).

## Security Guardrails (Required)
- Validate all request payloads with strict schemas and reject unknown fields.
- Keep authentication/authorization checks in middleware and service boundaries; protected endpoints must fail closed (`401/403`) when context is missing or insufficient.
- Never trust client-supplied role or activation fields for self-registration flows; enforce role/status server-side.
- Keep brute-force and abuse protections on auth-sensitive routes (rate limiting, lockout controls where applicable).
- Use bcrypt hashing for stored passwords; never store or log plaintext credentials.
- Use JWTs with controlled expiry and least-privilege claims; never log or return secrets (`JWT_SECRET`, hashes, tokens in logs).
- Preserve centralized sanitized error handling; do not leak stack traces/internal DB details in API responses.
- At repository boundaries, translate Prisma exceptions to domain errors and avoid raw SQL unless strictly necessary; never use unsafe raw query APIs.

## Issue and PR Workflow Updates
- When a branch is created for an issue, move that issue to the **In-progress** column in the project board.
- When a pull request is raised from the same branch, move the linked issue to the **Code Review** column.
- When that pull request is merged, move the linked issue to the **Done** column and close the issue.
