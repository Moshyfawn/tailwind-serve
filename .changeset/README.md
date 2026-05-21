# Changesets

Releases are managed by [changesets](https://github.com/changesets/changesets).

## For contributors

When your PR introduces a user-facing change, add a changeset:

```bash
bun run changeset
```

Pick a bump level (patch / minor / major) and write a one-line summary. Commit the generated `.changeset/*.md` file with your PR.

## How releases happen

1. PRs land on `main` with changeset files.
2. The `Changesets` workflow opens (or updates) a "Version Packages" PR that bumps `package.json` + `jsr.json`, regenerates `CHANGELOG.md`, and consumes the changeset files.
3. Merging the Version Packages PR creates a GitHub release.
4. The `Release` workflow fires on that release, stage-publishes to npm via OIDC, and publishes to JSR.
5. Approve the staged npm publish on npmjs.com with 2FA to complete the release.
