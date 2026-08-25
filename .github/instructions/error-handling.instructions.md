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
