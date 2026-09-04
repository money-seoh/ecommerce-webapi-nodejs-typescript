# E-commerce Web API — Project Guidelines

## Project Overview
Backend-only REST API for e-commerce (Node.js + TypeScript + Express + SQL Server). Modules: Product Catalog, Inventory, Cart, Checkout, Orders, Payments, User Management. No UI/frontend components.

## Architecture
Layered architecture with one-way dependency flow: Controller -> Service -> Repository -> Prisma Client -> SQL Server.
- Controllers: parse/validate HTTP input, call a service, shape the HTTP response. No business logic, no direct DB access.
- Services: own business/domain rules and orchestrate repositories.
- Repositories: the only layer allowed to talk to Prisma Client/the database.

Suggested folder structure:
```
prisma/
  schema.prisma
  migrations/    # Prisma migration files
src/
  controllers/
  services/
  repositories/
  dtos/
  routes/
  middlewares/
  utils/
  config/
test/            # unit + integration tests
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
No `package.json`/scaffolding exists yet in this repo. Once the Node/TypeScript project is initialized, update this section with the real install/build/test/lint commands.

## Issue and PR Workflow Updates
- When a branch is created for an issue, move that issue to the **In-progress** column in the project board.
- When a pull request is raised from the same branch, move the linked issue to the **Review** column.
- When that pull request is merged, move the linked issue to the **Done** column and close the issue.
