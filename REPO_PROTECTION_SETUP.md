## Owner-Controlled GitHub Setup

GitHub Actions cannot securely "re-push as the owner account" after someone else pushes.
The safe equivalent is:

1. Contributors push to their own branches.
2. GitHub Actions verifies the branch with the `App Build` workflow.
3. `@j-a-y-e-s-h` reviews the pull request as code owner.
4. The owner merges into `main`.

## Files Added

- `.github/workflows/app-build.yml`
- `.github/workflows/main-branch-guard.yml`
- `.github/CODEOWNERS`
- `.github/pull_request_template.md`

## Required GitHub Settings

Open the repository on GitHub and configure branch protection or a ruleset for `main`:

1. Require a pull request before merging.
2. Require review from Code Owners.
3. Require status checks to pass before merging.
4. Select `App Build` as a required status check.
5. Restrict direct pushes to `main` to the owner only, if available on your plan.

## What The Workflows Do

### `App Build`

- Runs on pushes and pull requests.
- Uses `npm ci` in `app/`.
- Runs `npm run build`.

### `Main Branch Guard`

- Runs on pushes to `main` or `master`.
- Fails if the direct push actor is not `j-a-y-e-s-h`.
- This works best together with branch protection.

## Recommended Flow

1. Other users push to feature branches.
2. They open a pull request to `main`.
3. GitHub verifies the branch with `App Build`.
4. Owner review is required because of `CODEOWNERS`.
5. Owner merges after verification.
