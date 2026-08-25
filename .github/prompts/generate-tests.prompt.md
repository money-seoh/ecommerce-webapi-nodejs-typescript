---
description: "Generate Jest unit and/or integration tests for a controller, service, or repository."
agent: "agent"
argument-hint: "File or feature to test, and unit vs integration"
---
Generate Jest tests for the file or feature the user specifies in this conversation, following [testing.instructions.md](../instructions/testing.instructions.md):

- Unit tests: mock dependencies (repositories/external services), cover the success path plus domain edge cases (out-of-stock, invalid transition, duplicate payment, validation failure).
- Integration tests: exercise the route end-to-end against a test database, resetting state between tests.
- Use descriptive `should <behavior> when <condition>` test names.
