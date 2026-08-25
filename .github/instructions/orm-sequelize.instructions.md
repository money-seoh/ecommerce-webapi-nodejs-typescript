---
description: "Use when this project's chosen ORM is Sequelize. Covers model definition layout, migration workflow, and query patterns specific to Sequelize."
applyTo: "src/models/**,src/repositories/**,src/migrations/**"
---
# Sequelize-Specific Conventions

- One model per file in `src/models/`, defined with `Model.init()` or `sequelize.define`, named after the singular domain concept.
- Generate migrations with `sequelize-cli` (`npx sequelize-cli migration:generate --name <change>`) into `src/migrations/`; every migration must implement both `up` and `down`.
- Access Sequelize exclusively through `src/repositories/`; the shared `Sequelize` instance lives in `src/config/`.
- Use `sequelize.transaction()` for multi-step writes.
- Prefer `include` for eager-loading associations over N+1 queries; avoid raw queries (`sequelize.query`) unless Sequelize cannot express the query.
