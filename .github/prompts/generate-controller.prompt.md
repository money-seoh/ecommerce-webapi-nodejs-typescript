---
description: "Generate a REST controller, route, and DTOs for an e-commerce resource, following project API design standards."
agent: "E-commerce API Agent"
argument-hint: "Resource name and its endpoints, e.g. Product: list, get by id, create, update, delete"
---
Generate a REST controller for the resource the user specifies in this conversation, following [api-design.instructions.md](../instructions/api-design.instructions.md) and [error-handling.instructions.md](../instructions/error-handling.instructions.md):

- Create the request/response DTO(s) in `src/dtos/`.
- Create the controller with thin handlers that call a service (stub the service interface if it does not exist yet).
- Create the route file, versioned under `/api/v1/`.
- Use the standard success/error envelopes and correct HTTP status codes.
- Validate every field with strict schema validation (`zod` preferred); reject unknown fields.
- Add required security controls for endpoint type: authentication/authorization for protected routes, rate limiting for abuse-prone routes, and non-enumerating auth failures.
- Never expose secrets, password hashes, or internal error details in response DTOs.
