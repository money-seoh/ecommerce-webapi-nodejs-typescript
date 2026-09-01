---
description: "Use when creating or modifying REST controllers, routes, or request/response DTOs. Covers endpoint conventions, versioning, and OpenAPI alignment."
applyTo: "src/controllers/**,src/routes/**,src/dtos/**"
---
# API Design Standards

- REST endpoints use plural nouns, e.g. `/api/v1/products`, `/api/v1/orders/:orderId`.
- Version all routes under `/api/v{n}/`.
- Controllers only parse/validate input and call services — no business logic or direct DB access.
- Request/response bodies are defined as DTOs in `src/dtos/`.
- Standard success envelope: `{ data, meta? }`. Standard error envelope: `{ error: { code, message, details? } }`.
- Document every endpoint with OpenAPI annotations; keep the spec in sync with `src/routes/`.
- Use correct HTTP status codes: 200/201/204 success, 400 validation, 401/403 auth, 404 not found, 409 conflict, 500 unexpected.

## PR Description for Contract Changes
If a change alters a request body, header, or response shape for any endpoint, add an "Updates to API endpoints" section to the PR description:
- List each changed endpoint and describe what changed (added/removed/renamed fields, header, or status code).
- Give a runnable example (curl or Postman-style request/response) showing the new contract.
