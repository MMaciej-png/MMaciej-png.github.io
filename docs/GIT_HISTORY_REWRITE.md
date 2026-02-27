# Rewriting commit history (messages and issue links)

This project uses **conventional commit** messages and links to GitHub issues where applicable. To fix past commit names and add issue references, use the scripts below.

## Convention

See [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md) for the format (`feat:`, `fix:`, `chore:`, etc.) and how to link issues (`Refs #n`, `Fixes #n`).

## Steps to rewrite history

**Warning:** Rewriting history changes commit hashes. If the repo is already pushed, you will need to force-push (`git push --force-with-lease`). Coordinate with anyone who has cloned the repo. You must have a **clean working tree** (commit or stash changes) before running the rewrite.

1. **Generate the message mapping** (from repo root):
   ```bash
   node scripts/build-commit-message-map.js
   ```
   This reads the current history and writes `scripts/commit-message-map.json` with one entry per commit (oldest → newest), using conventional subjects and optional issue refs.

2. **Review and edit the mapping** (optional):
   - Open `scripts/commit-message-map.json`.
   - Adjust any `subject` or add a `body` with `"Refs #123"` or `"Fixes #123"` for the right issues.
   - Merge commits (e.g. "Merge pull request #2 from ...") are left unchanged so they already reference PRs.

3. **Run the rewrite** (from repo root):
   ```bash
   node scripts/rewrite-commit-messages.js
   ```
   This runs `git filter-branch` with a message filter so each commit gets the new message from the mapping. A backup ref is created under `refs/original/`.

4. **Clean up backup** (optional, after you’re happy with the result):
   ```bash
   git update-ref -d refs/original/refs/heads/<your-branch-name>
   ```

5. **Push** (if the repo is remote):
   ```bash
   git push --force-with-lease
   ```

## Linking to issues

- In `commit-message-map.json`, add a `"body"` field to any entry, e.g. `"body": "Refs #3"` or `"Fixes #5"`.
- Merge commits already reference PRs (#1, #2, …); you can create matching GitHub issues and add `Refs #n` in the body of related commits if you want them linked.
