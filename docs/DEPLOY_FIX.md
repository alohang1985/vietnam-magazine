GitHub Workflow Push Fix

Issue
- GitHub push failed: refusing to allow a Personal Access Token to create or update workflow `.github/workflows/cron.yml` without `workflow` scope

Fix Strategy
1. Temporarily remove the .github/workflows directory from the repository and push the change. Re-add the workflow file later via the GitHub web UI.
2. When creating a Personal Access Token for automation, include the `workflow` scope in addition to `repo`.

Manual re-add instructions
- Go to GitHub → repository → Add file → Upload files → select `.github/workflows/cron.yml` and commit on the web UI.

Required PAT scopes when managing workflows via API/CLI
- repo
- workflow

