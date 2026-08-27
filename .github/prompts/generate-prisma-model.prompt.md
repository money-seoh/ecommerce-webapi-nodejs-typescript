---
description: "Generate a Prisma model, migration, and repository for a domain concept, following the project's Prisma ORM standards."
agent: "E-commerce API Agent"
argument-hint: "Entity name and its fields/relationships, e.g. Order: id, userId, status, items[]"
---
Generate the Prisma data-access layer for the entity the user specifies in this conversation, following [orm-prisma.instructions.md](../instructions/orm-prisma.instructions.md):

- Add the model to `prisma/schema.prisma` with a PascalCase name, camelCase fields, explicit relations, and indexes where useful.
- Generate the migration (`npx prisma migrate dev --name <change>`).
- Create a repository in `src/repositories/` wrapping Prisma Client, exposing CRUD plus any domain-specific queries (e.g. `findBySku`, `search`, `paginate`).
- Translate Prisma exceptions into domain errors at the repository boundary.
