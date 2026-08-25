# GitHub Copilot Agent Instructions

This file adds instructions and an agent configuration to help GitHub Copilot act as a productive coding assistant for this repository.

Purpose:
- Provide the Copilot agent with repository-specific guidance and constraints.

Agent Behavior:
- Always create new branches from `main` for changes.
- Never modify files directly on `main`.
- Follow project's TypeScript and Node.js conventions.
- Link pull requests to the corresponding issue when implementing an issue.

How to use:
1. When asked to implement an issue, create a branch named `feature/<short-description>` from `main`.
2. Make minimal, focused changes. Commit with descriptive messages.
3. Open a pull request targeting `main` and reference the issue number (e.g., "Implements #12").

Contact:
- Repository owner: @money-seoh
