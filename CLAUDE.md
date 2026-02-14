# GMC Final Projects

Monorepo containing final projects for the MSc Software Engineering program at GoMyCode.

## Structure

Each project lives in its own top-level directory (e.g., `nosql-database-modelling/`). Projects are independent and may use different languages, frameworks, and tooling.

## Conventions

- Each project directory should contain its own README with setup instructions, requirements, and usage
- Each project should have its own dependency management (package.json, requirements.txt, go.mod, etc.)
- Keep project directories self-contained — avoid cross-project dependencies

## Working With This Repo

- When working on a specific project, focus on that project's directory
- Check the project's own README for language/framework-specific instructions before making changes
- Run tests and linters from within the project directory unless a root-level script is provided

## Git Commits

- Never add Co-Authored-By or any co-author trailer to commits
- Keep commit messages under 60 characters
- Use simple, direct commit messages