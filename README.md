# Codeowner Verifier

[code style: prettier](https://github.com/prettier/prettier)
[Issues](https://github.com/garretpatten/codeowner-verifier/issues)
[License MIT](https://github.com/garretpatten/codeowner-verifier/blob/master/LICENSE)
[OpenSSF Scorecard](https://api.securityscorecards.dev/viewer/?uri=github.com/garretpatten/codeowner-verifier)
[Release](https://github.com/garretpatten/codeowner-verifier/releases)

A GitHub Action that checks whether every **changed** file in a pull request or push has an effective owner according to `.github/CODEOWNERS`. Matching follows [GitHub’s CODEOWNERS rules](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) (gitignore-style patterns, root-anchored paths with a leading `/`, and **last matching pattern wins**—including lines that list a path with no owners).

The runtime entrypoint is the bundled `dist/index.js`, built with `[ncc](https://github.com/vercel/ncc)` from TypeScript sources under `src/`.

## Table of Contents

- [Usage](#usage)
- [Action inputs](#action-inputs)
  - [changedFiles](#changedfiles)
  - [deletedFiles](#deletedfiles)
- [Supporting files](#supporting-files)
  - [.codeownersignore](#codeownersignore)
- [Development](#development)
- [Maintainers](#maintainers)
- [Contributing](#contributing)

## Usage

This action is intended for public and private repositories. Add a workflow under `.github/workflows/` (this repo includes an example in `.github/workflows/codeowner-verifier.yaml`). Pin a branch (for example `@master`) or a release tag for reproducible runs.

### Action inputs

#### changedFiles

Required. A **space-delimited** list of repository-relative paths for added or modified files. The example workflow builds this list with `git diff`.

#### deletedFiles

Required. A **space-delimited** list of repository-relative paths for deleted or moved files (for example from `git diff --diff-filter=D`). Paths listed here are not reported as missing ownership.

This action does **not** call the GitHub API and does not require `secrets.GITHUB_TOKEN` or any other token in `with:`—only the path lists above.

### Supporting files

#### .codeownersignore

Optional. Patterns use the same gitignore-style semantics as CODEOWNERS (via the `[ignore](https://www.npmjs.com/package/ignore)` package). Put the file at `**.github/.codeownersignore`** (preferred) or `**.codeownersignore\*\*`at the repository root (legacy). One pattern per line;`#`starts a comment; inline comments after a space followed by`#` are stripped.

## Development

- **Requirements:** Node.js and npm (npm **11+** recommended so `.npmrc` `[min-release-age](https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age)` applies during installs).
- Install: `npm ci`
- Check types: `npm run typecheck`
- Test: `npm test`
- Bundle for the action: `npm run build` (writes `dist/index.js`)
- **CI:** Pull requests run [Security Checks](https://github.com/garretpatten/security-checks) (Semgrep, TruffleHog, etc.) and [Quality Checks](https://github.com/garretpatten/quality-checks) (Prettier, Markdownlint, Yamllint) via `.github/workflows/security-checks.yaml` and `.github/workflows/quality-checks.yaml`. Local parity: `.prettierignore` excludes `dist/` and `node_modules/`; run `npm run lint:prettier`, `npm run lint:md`, and `npm run lint:yaml` (requires `[yamllint](https://github.com/adrienverge/yamllint)` on your PATH).

## Maintainers

[@garretpatten](https://www.github.com/garretpatten)

_For questions, bug reports, or feature requests, please open an issue on this repository or contact the maintainer directly._

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](./LICENSE).
