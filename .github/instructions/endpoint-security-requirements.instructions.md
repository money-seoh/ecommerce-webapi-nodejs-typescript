---
description: "Use when defining functional and security requirements for REST endpoints in user stories, specs, or issue descriptions."
applyTo: ".github/prompts/**,.github/instructions/**,README.md"
---
# REST Endpoint Requirements & Security Acceptance Criteria

Use this guide when documenting API requirements by HTTP method and when writing endpoint-level security acceptance criteria.

## HTTP Method Requirement Baseline

### GET
- Read-only operation; must not mutate server state.
- List endpoints should define filtering, sorting, and pagination behavior.
- Return `200` on success and `404` when a requested resource does not exist.
- Response must not expose secrets, credentials, or sensitive internal fields.

### POST
- Creates a new resource or executes a controlled action (for example, login).
- Validate payload schema strictly and reject unknown/invalid fields.
- Return `201` for creation workflows and `200` for non-creation actions; use `409` for duplicate conflicts.
- Apply server-side defaults for optional fields when omitted.

### PUT
- Full replacement update of a resource.
- Require all fields defined for replacement and reject malformed payloads.
- Return `200` or `204` on success and `404` when target resource does not exist.
- Preserve immutable fields unless explicitly allowed by business rules.

### PATCH
- Partial update of a resource.
- Validate only supplied fields and reject unsupported fields.
- Return `200` or `204` on success and `404` when target resource does not exist.
- Enforce field-level authorization for sensitive properties.

### DELETE
- Removes or deactivates a resource based on domain policy.
- Return `204` on success and `404` when target resource does not exist.
- Must document whether operation is hard delete or soft delete.
- Enforce business constraints that can block deletion.

## Method-Level Security Acceptance Criteria

### GET security criteria
- Protected resources require valid authentication token.
- Authorization must enforce role and/or ownership checks.
- Must prevent IDOR (insecure direct object reference) access patterns.
- Must redact sensitive fields from responses.

### POST security criteria
- Strict input validation and sanitization is required.
- Apply brute-force protection and rate limiting where relevant (especially auth endpoints).
- Enforce credential/password policy where applicable.
- Never log secrets or credentials in plain text.

### PUT/PATCH security criteria
- Requires authentication and authorization checks before update.
- Enforce field-level permissions (for example, no unauthorized role escalation).
- Security-sensitive and immutable fields cannot be changed by unauthorized actors.
- Security-relevant updates must be auditable.

### DELETE security criteria
- Requires authentication and high-privilege authorization where applicable.
- Prevent unsafe destructive actions that violate policy or integrity constraints.
- Deletion/deactivation actions must be auditable.
- Prefer soft delete when recoverability/compliance requires data retention.

## Endpoint-Specific Security Criteria Template

For each endpoint, include:
- Access control (public/authenticated/role-restricted).
- Input validation and sanitization requirements.
- Resource authorization and ownership requirements.
- Sensitive data handling rules (hashing, redaction, no plaintext exposure).
- Abuse controls (rate limit, lockout, idempotency where applicable).
- Expected security-related status codes (`400`, `401`, `403`, `404`, `409`, `429` as applicable).
