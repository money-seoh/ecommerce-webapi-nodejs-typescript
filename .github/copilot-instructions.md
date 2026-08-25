# E-commerce Web API — Project Guidelines

## Project Overview
Backend-only REST API for e-commerce (Node.js + TypeScript + Express + SQL Server). Modules: Product Catalog, Inventory, Cart, Checkout, Orders, Payments, User Management. No UI/frontend components.

## Architecture
Layered architecture with one-way dependency flow: Controller -> Service -> Repository -> ORM Model.
- Controllers: parse/validate HTTP input, call a service, shape the HTTP response. No business logic, no direct DB access.
- Services: own business/domain rules and orchestrate repositories.
- Repositories: the only layer allowed to talk to the ORM/database.

Suggested folder structure:
```
src/
  controllers/
  services/
  repositories/
  models/        # ORM entities/models
  migrations/    # ORM migration files
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

## ORM & Data Access
ORM: TBD - update this line once chosen (Prisma / Sequelize / TypeORM); the matching ORM-specific instructions then apply automatically. See `.github/instructions/orm-data-access.instructions.md`.

## Error Handling
See `.github/instructions/error-handling.instructions.md`.

## Domain Rules
See `.github/instructions/domain-rules.instructions.md`.

## Testing
Jest for unit and integration tests. See `.github/instructions/testing.instructions.md`.

## Build and Test
No `package.json`/scaffolding exists yet in this repo. Once the Node/TypeScript project is initialized, update this section with the real install/build/test/lint commands.
