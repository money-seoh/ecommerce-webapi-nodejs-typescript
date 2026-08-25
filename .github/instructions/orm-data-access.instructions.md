---
description: "Use when defining ORM entities/models, repositories, migrations, or queries against SQL Server. Covers relationships, repository patterns, and migration strategy."
applyTo: "src/models/**,src/repositories/**,src/migrations/**,prisma/**"
---
# ORM & Data Access Patterns

## ORM Selection
This project's ORM is not yet chosen (see `.github/copilot-instructions.md`). Do not mix ORMs. Once one is selected:
1. Record the choice in `.github/copilot-instructions.md` under "ORM & Data Access" (e.g. "ORM: Prisma").
2. Follow the matching ORM-specific instructions for all model/migration/query code — they take precedence over the generic guidance below where they conflict:
   - Prisma -> `.github/instructions/orm-prisma.instructions.md`
   - Sequelize -> `.github/instructions/orm-sequelize.instructions.md`
   - TypeORM -> `.github/instructions/orm-typeorm.instructions.md`
3. Do not generate ORM-specific model/migration code until the ORM choice is confirmed — ask first if it is still TBD.

## General Rules (apply regardless of ORM)
- All data access goes through a repository in `src/repositories/`; services never import the ORM client directly.
- Define relationships explicitly (one-to-many, many-to-many) with foreign keys matching SQL Server naming (`<Entity>Id`).
- Every schema change ships as a migration; never edit an already-applied migration — add a new one.
- Wrap multi-step writes (e.g. checkout: reserve stock + create order + record payment) in a transaction.
- Prefer ORM query builders over raw SQL; if raw SQL is unavoidable, always use parameterized queries — never string-concatenate user input.
