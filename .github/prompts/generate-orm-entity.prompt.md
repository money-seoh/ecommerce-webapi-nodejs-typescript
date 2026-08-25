---
description: "Generate an ORM entity/model, repository, and migration for a domain concept, following project ORM and data-access standards."
agent: "E-commerce API Agent"
argument-hint: "Entity name and its fields/relationships, e.g. Order: id, userId, status, items[]"
---
Generate the ORM data-access layer for the entity the user specifies in this conversation:

1. Check the ORM choice recorded in [copilot-instructions.md](../copilot-instructions.md). If it is still TBD, ask the user which ORM to use (Prisma, Sequelize, or TypeORM) before generating any model or migration code.
2. Follow [orm-data-access.instructions.md](../instructions/orm-data-access.instructions.md) for the general rules, plus whichever ORM-specific instructions match the chosen ORM for schema/model layout and migration workflow: [orm-prisma.instructions.md](../instructions/orm-prisma.instructions.md), [orm-sequelize.instructions.md](../instructions/orm-sequelize.instructions.md), or [orm-typeorm.instructions.md](../instructions/orm-typeorm.instructions.md).
3. Create a repository in `src/repositories/` exposing CRUD plus any domain-specific queries.
4. Wrap multi-step writes in a transaction where relevant.
