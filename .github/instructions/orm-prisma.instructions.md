---
description: "Use when defining Prisma schema models, repositories, migrations, or queries against SQL Server. This project's ORM is Prisma - covers schema conventions, client usage, query patterns, pagination, transactions, and error handling."
applyTo: "prisma/**,src/repositories/**"
---
# Prisma ORM Standards

This project uses **Prisma** as its only ORM against SQL Server. Do not introduce another ORM or query builder.

## Architecture
```
Controller -> Service -> Repository -> Prisma Client -> SQL Server
```
Services never import `PrismaClient` directly — all Prisma access goes through `src/repositories/`.

## Schema Conventions (`prisma/schema.prisma`)
- One `schema.prisma` file; group related models together with comments.
- PascalCase, singular model names (`Product`, `Order`, `OrderItem`); camelCase field names.
- Define explicit relations (`@relation`) instead of implicit foreign keys.
- Add `@@index([...])` for commonly queried/filtered fields.
- Use `@updatedAt` on any mutable entity; use `@default(now())` for `createdAt`.

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Decimal
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}
```

## Prisma Client Usage
Prefer generated Prisma Client methods over raw SQL:

```ts
await prisma.product.findMany();
await prisma.product.findUnique({ where: { id } });
await prisma.product.create({ data });
await prisma.product.update({ where: { id }, data });
await prisma.product.delete({ where: { id } });
```

Only use `prisma.$queryRaw` / `prisma.$executeRaw` when there is a verified performance requirement the Client API cannot satisfy, and justify it in a code comment. Use Prisma's parameterized tagged-template APIs; never use `$queryRawUnsafe` / `$executeRawUnsafe` or construct SQL strings from untrusted values.

## Query Best Practices
Use `select`/`include` to fetch exactly what's needed; never over-fetch.

```ts
await prisma.order.findUnique({
  where: { id },
  include: { items: true },
});
```

Paginate list endpoints with `skip`/`take` (or cursor-based pagination for large/real-time datasets) plus an explicit `orderBy`:

```ts
await prisma.product.findMany({
  skip,
  take,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
});
```

## Transactions
Wrap multi-step writes in `prisma.$transaction`. Always required for: checkout, order creation, stock reservation, payment recording, and inventory adjustments.

```ts
await prisma.$transaction(async (tx) => {
  // business operations using `tx` instead of `prisma`
});
```

## Migrations
- `npx prisma migrate dev --name <change>` locally; `npx prisma migrate deploy` in CI/CD.
- Never hand-edit a file under `prisma/migrations/` once it has been applied - add a new migration instead.

## Error Handling
Catch and translate Prisma exceptions into domain errors at the repository boundary (see `error-handling.instructions.md`):
- `PrismaClientKnownRequestError` (e.g. unique constraint `P2002`, record not found `P2025`) -> map to `ConflictError` / `NotFoundError`.
- `PrismaClientValidationError` -> map to a sanitized internal error; request/domain validation must produce `ValidationError` before the repository calls Prisma.
Never let a raw Prisma error reach the controller or the HTTP response.

## Repository Pattern
Repositories wrap all Prisma access; services depend only on repository interfaces. Create one shared `PrismaClient` in `src/config/` for the application runtime and inject it into repositories; never instantiate a client per repository or request.

```ts
class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }
}
```

Common repository methods to generate: `findById`, `findBySku`, `create`, `update`, `delete`, `search`, `paginate`.
