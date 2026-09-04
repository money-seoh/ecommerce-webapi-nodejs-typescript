---
description: "Use when writing unit tests, integration tests, or test fixtures/mocks for the e-commerce API."
applyTo: "test/**,**/*.test.ts,**/*.spec.ts"
---
# Testing Standards

- Use Jest for unit and integration tests.
- Unit tests mock repositories/external services and target services/controllers in isolation.
- Integration tests exercise routes end-to-end against a test database; reset state between tests.
- Name tests by behavior: `should <expected behavior> when <condition>`.
- Cover domain edge cases explicitly: out-of-stock, expired cart, duplicate payment, invalid order transition.
- Place fixtures/mock data under `test/fixtures/`.

## Security-Focused Test Guardrails
- Add negative tests for authentication and authorization (`401`, `403`) on protected endpoints.
- Validate strict payload handling: unknown/forbidden fields are rejected with `400`.
- For auth-sensitive endpoints, include abuse-control coverage (rate-limit/lockout behavior returning `429` where configured).
- Verify no response leaks secrets (password hash, token secrets, internal DB errors, stack traces).
- Verify bootstrap rules: admin bypass only when no admin exists; authenticated admin required after bootstrap.
