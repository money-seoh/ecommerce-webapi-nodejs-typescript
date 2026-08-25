---
description: "Use when defining ORM entities/models, repositories, migrations, or queries against SQL Server. Covers relationships, repository patterns, and migration strategy."
applyTo: "src/models/**,src/repositories/**,src/migrations/**"
---
# ORM & Data Access Patterns

- ORM selection (Prisma/Sequelize/TypeORM) is project-wide — do not mix ORMs; confirm the chosen ORM in `.github/copilot-instructions.md` before generating code.
- One entity/model per file in `src/models/`, named after the singular domain concept (e.g. `Product`, `Order`, `OrderItem`).
- All data access goes through a repository in `src/repositories/`; services never import the ORM client directly.
- Define relationships explicitly (one-to-many, many-to-many) with foreign keys matching SQL Server naming (`<Entity>Id`).
- Every schema change ships as a migration in `src/migrations/`; never edit an already-applied migration — add a new one.
- Wrap multi-step writes (e.g. checkout: reserve stock + create order + record payment) in a transaction.
- Prefer ORM query builders over raw SQL; if raw SQL is unavoidable, always use parameterized queries — never string-concatenate user input.
