---
description: "Generate a Prisma transactional workflow (checkout, order creation, stock reservation, payment, refund) using prisma.$transaction, following domain and ORM rules."
agent: "E-commerce API Agent"
argument-hint: "Workflow to generate, e.g. checkout or refund order"
---
Generate the transactional workflow the user specifies in this conversation, following [orm-prisma.instructions.md](../instructions/orm-prisma.instructions.md) and [domain-rules.instructions.md](../instructions/domain-rules.instructions.md):

- Wrap all multi-step writes in a single `prisma.$transaction(async (tx) => { ... })`, using `tx` for every query inside the callback.
- Enforce atomic, race-safe stock/inventory checks (conditional updates, not read-then-write).
- Keep any external call (e.g. a payment processor) outside the database transaction; reconcile by idempotency key if persistence fails after an external call succeeds.
- Return/throw typed domain errors on failure instead of leaking Prisma exceptions.
