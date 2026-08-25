---
description: "Use when this project's chosen ORM is TypeORM. Covers entity definition layout, migration workflow, and query patterns specific to TypeORM."
applyTo: "src/models/**,src/repositories/**,src/migrations/**"
---
# TypeORM-Specific Conventions

- One entity per file in `src/models/`, decorated with `@Entity()`, named after the singular domain concept.
- Generate migrations with the project's configured TypeORM CLI wrapper and pass the DataSource path (for example, `typeorm migration:generate src/migrations/<Change> -d src/config/data-source.ts`); never edit a migration once applied.
- Access TypeORM exclusively through custom repositories in `src/repositories/` (extend `Repository<T>` or use the data-mapper pattern); the shared `DataSource` lives in `src/config/`.
- Use `DataSource.transaction()` or `QueryRunner` for multi-step writes.
- Prefer the QueryBuilder or `relations: [...]` over raw SQL; avoid `query()` unless TypeORM cannot express the query.
