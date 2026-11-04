# Repository workflow

When the user asks for an implementation or fix in this repository, finish by publishing the task changes to the configured GitHub remote unless the user says to keep them local.

Before publishing:

1. Inspect `git status` and the diff. Preserve unrelated user changes.
2. Stage only the files changed for this task by explicit path. Never use `git add .` or `git add -A`.
3. Commit with a short message describing the change.
4. Push the current branch to its configured remote (`git push origin <branch>`).
5. Report the commit and push result. If pushing fails because authentication or network access is unavailable, leave the commit intact and explain the blocker.

Do not include `.env*`, generated secrets/configuration, `.local/`, credentials, or personal data in commits. Do not change branches or force push unless the user explicitly asks.
