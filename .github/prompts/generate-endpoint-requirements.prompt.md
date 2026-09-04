---
description: "Generate endpoint-wise REST functional requirements and security acceptance criteria from a feature, user story, or issue."
agent: "E-commerce API Agent"
argument-hint: "Feature/issue context and target endpoints, e.g. USER-US-001 create user endpoints"
---
Generate API requirement documentation for the feature the user specifies in this conversation.

Follow:
- [api-design.instructions.md](../instructions/api-design.instructions.md)
- [error-handling.instructions.md](../instructions/error-handling.instructions.md)
- [endpoint-security-requirements.instructions.md](../instructions/endpoint-security-requirements.instructions.md)

Output requirements endpoint-by-endpoint, and include:

1. Endpoint identity
- HTTP method and route
- Endpoint purpose

2. Functional requirements
- Request fields, required/optional rules, defaults, and validation constraints
- Business rules and role restrictions
- Success response behavior and status code
- Failure scenarios and status codes

3. Security acceptance criteria
- Authentication requirement
- Authorization/ownership enforcement
- Sensitive data handling (hash/redact/no plaintext)
- Abuse protections (rate limit, lockout, anti-automation where applicable)
- Security-focused error behavior (no internal leakage)
- Explicit non-functional guardrails (no mass assignment, no user enumeration, no token/credential logging)

4. Method-level checklist alignment
- Confirm each endpoint aligns with its method baseline (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and required security controls.
