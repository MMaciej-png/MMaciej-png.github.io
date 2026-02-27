# Commit message convention

This project uses **Conventional Commits** and links to GitHub issues where applicable.

## Format

```
<type>(<scope>): <short description>

[optional body]
[optional: Refs #123, Fixes #456]
```

- **type**: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`
- **scope** (optional): e.g. `content`, `ui`, `tts`, `chat`, `data`
- **description**: imperative, lowercase start, no period at end
- **Refs #n**: link to issue(s) without implying closure
- **Fixes #n**: link to issue(s) that this commit resolves

## Types

| Type     | Use for |
|----------|--------|
| `feat`   | New feature or content |
| `fix`    | Bug fix |
| `chore`  | Build, tooling, config, cleanup |
| `docs`   | Documentation only |
| `refactor` | Code structure, no behavior change |
| `style`  | Formatting, CSS, no logic change |

## Merge commits

Keep merge commits as-is; they already reference PRs (e.g. "Merge pull request #2 from ..."). Refs #2 is implied by the PR link.

## Examples

- `feat(content): add Japanese, Polish, French, Korean content`
- `fix(selection): prevent wrong answer from locking the site`
- `chore: normalize commit messages and link to issues`
