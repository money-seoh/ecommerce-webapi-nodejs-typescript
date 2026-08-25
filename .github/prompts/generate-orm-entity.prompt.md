---
description: "Generate an ORM entity/model, repository, and migration for a domain concept, following project ORM and data-access standards."
agent: "agent"
argument-hint: "Entity name and its fields/relationships, e.g. Order: id, userId, status, items[]"
---
Generate the ORM data-access layer for the entity the user specifies in this conversation, following [orm-data-access.instructions.md](../instructions/orm-data-access.instructions.md):

- Create the entity/model in `src/models/` with fields, types, and relationships.
- Create a matching migration in `src/migrations/`.
- Create a repository in `src/repositories/` exposing CRUD plus any domain-specific queries.
- Wrap multi-step writes in a transaction where relevant.
