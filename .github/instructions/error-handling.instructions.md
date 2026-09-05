---
description: "Use when writing error handling, exception classes, or logging in controllers, services, or middleware."
applyTo: "src/**/*.ts"
---
# Error Handling Standards

- Throw typed domain errors (e.g. `NotFoundError`, `ValidationError`, `ConflictError`) from services; never throw raw strings.
- A single central error-handling middleware (`src/middlewares/`) converts thrown errors into the standard error envelope (see api-design instructions).
- Never leak stack traces or internal messages to API responses in production; log full details server-side instead.
- Log errors with enough context (request id, user id, operation) to trace an issue without exposing secrets or PII.
- Validation errors return 400 with a `details` array describing each failing field.

## Prisma Errors
- Catch `PrismaClientKnownRequestError` and `PrismaClientValidationError` at the repository boundary; never let raw Prisma errors propagate to services or controllers.
- Map known request-error codes to domain errors, e.g. `P2002` (unique constraint) -> `ConflictError` and `P2025` (record not found) -> `NotFoundError`. Translate `PrismaClientValidationError` to a sanitized internal error; request/domain validation must produce `ValidationError` before Prisma is called.

## Security Guardrails for Error Handling
- Authentication/authorization failures must not expose sensitive implementation details; use safe messages such as invalid credentials or insufficient permissions.
- Normalize unexpected exceptions to `INTERNAL_ERROR` with a generic message and without stack traces in responses.
- Redact or omit credential-bearing fields (`password`, `authorization`, `cookie`, JWTs, API keys) from all logs.
- Keep rate-limit, lockout, and abuse-control failures explicit (`429`) but non-revealing.
- Do not place full request bodies in error logs for auth/payment/profile endpoints unless explicitly sanitized.
