# Claude Code Guidelines

## Before starting any task

Read the following sections of `README.md` before writing or modifying any code:

- `## Project overview` → `### Tech Stack` — understand which tools, frameworks, and libraries are in use
- `## Project overview` → `### File scaffold` — understand where files belong in the project structure
- `## Design` — includes the ERD and full API reference; use this to understand data models and existing endpoints before adding new ones

This prevents placing files in the wrong directory (e.g. migration SQL files belong in `database/migrations/`, not `web-service/src/main/resources/`) and avoids duplicating or contradicting existing API and schema design.
