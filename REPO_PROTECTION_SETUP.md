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

## One-Time Direct Push Setup

The `Main Branch Guard` workflow no longer hard-codes a single username.
It always allows the repository owner.
It can also allow extra users or bots from a repo file and, optionally, a repository variable.

### Easiest Option: Repo Allowlist File

Edit `.github/main-branch-direct-push-allowlist.txt` and put one GitHub actor per line.

For the workflow you asked for:

- leave this file empty for normal human accounts
- only add bots or special automation users if you truly want them to push directly
- do not add `jke9` if you want `jke9 -> pull request -> j-a-y-e-s-h review -> merge`

Examples:

- PR-only flow for humans:
  leave the file empty
- Allow the owner and GitHub Actions bot:
  `github-actions[bot]`
- Allow the owner, Dependabot, and another automation actor:
  `dependabot[bot]`
  `your-bot-account`

### Optional Option: GitHub Repository Variable

If you prefer GitHub settings, you can also set this once in:

`GitHub -> SOULMATE -> Settings -> Secrets and variables -> Actions -> Variables`

Create:

- `MAIN_BRANCH_DIRECT_PUSH_ALLOWLIST`

Use a comma-separated value such as:

- `github-actions[bot], dependabot[bot], your-second-username`

Important notes:

- The repository owner is always allowed automatically.
- The workflow reads `.github/main-branch-direct-push-allowlist.txt` on every push.
- If `jke9` pushes directly to `main`, the workflow will fail.
- If this repository is moved into an organization, set `MAIN_BRANCH_DIRECT_PUSH_ALLOWLIST` explicitly because the org name is not the same as a user who pushes code.
- This workflow reports a bad direct push after it happens. To actually stop direct pushes before they land, use GitHub branch protection or rulesets.

## What The Workflows Do

### `App Build`

- Runs on pushes and pull requests.
- Uses `npm ci` in `app/`.
- Runs `npm run build`.

### `Main Branch Guard`

- Runs on pushes to `main` or `master`.
- Passes automatically for the repository owner.
- Passes for any actor listed in `.github/main-branch-direct-push-allowlist.txt`.
- Can also pass for extra usernames or bots listed in `MAIN_BRANCH_DIRECT_PUSH_ALLOWLIST`.
- Fails for anyone else and explains how to fix the allowlist.
- Works best together with branch protection.

## If You Still See This Fail

Check these first:

1. Look at the failed run summary and note the `Push actor`.
2. If that actor should be allowed, add it to `.github/main-branch-direct-push-allowlist.txt` or `MAIN_BRANCH_DIRECT_PUSH_ALLOWLIST`.
3. If the actor should not push directly, switch to a feature branch and open a pull request.
4. If you changed repository ownership or reviewers, also update `.github/CODEOWNERS`.

## Recommended Flow

1. `jke9` pushes to a feature branch, not `main`.
2. `jke9` opens a pull request into `main`.
3. GitHub runs `App Build` on the branch and pull request.
4. `@j-a-y-e-s-h` reviews because of `CODEOWNERS`.
5. `@j-a-y-e-s-h` merges after review and passing checks.

## Required GitHub Protection For This Flow

To make this truly enforceable on GitHub, configure branch protection or a ruleset on `main`:

1. Require a pull request before merging.
2. Require review from Code Owners.
3. Require status checks to pass before merging.
4. Select `App Build` as a required status check.
5. Do not allow `jke9` to bypass the rule or push directly to `main`.
