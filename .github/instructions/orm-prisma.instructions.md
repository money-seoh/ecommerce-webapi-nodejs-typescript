---
description: "Use when this project's chosen ORM is Prisma. Covers schema.prisma layout, migration workflow, and query patterns specific to Prisma."
applyTo: "prisma/**,src/repositories/**"
---
# Prisma-Specific Conventions

- Define all models in a single `prisma/schema.prisma` file (not one file per entity); group related models together with comments.
- Generate migrations via `npx prisma migrate dev --name <change>`; never hand-edit files under `prisma/migrations/`.
- Access Prisma exclusively through `src/repositories/`; instantiate a single shared `PrismaClient` in `src/config/` and use it only from repositories.
- Use Prisma's `$transaction` for multi-step writes.
- Prefer relation queries (`include`/`select`) over separate round-trips; avoid raw SQL (`$queryRaw`) unless Prisma cannot express the query.
