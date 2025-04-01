[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Issues](https://img.shields.io/github/issues/garretpatten/codeowner-verifier)](https://github.com/garretpatten/codeowner-verifier/issues)
[![License MIT](https://img.shields.io/github/license/garretpatten/codeowner-verifier)](https://github.com/garretpatten/codeowner-verifier/blob/master/LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/garretpatten/codeowner-verifier/badge)](https://securityscorecards.dev/viewer/?uri=github.com/garretpatten/codeowner-verifier)
[![Release](https://img.shields.io/github/v/release/garretpatten/codeowner-verifier)](https://github.com/garretpatten/codeowner-verifier/releases)

# Codeowner Verifier

A GitHub Action that verifies that all modified files included in a PR or push are owned in the CODEOWNERS file.

## Table of Contents

- [Usage](#usage)
    - [Action Parameters](#action-parameters)
        - [changedFiles](#changedFiles)
        - [deletedFiles](#deletedFiles)
        - [GITHUB_TOKEN](#GITHUB_TOKEN)
    - [Files](#files)
        - [.codeownersignore](#codeownersignore)
- [Maintainers](#maintainers)
- [Contributing](#contributing)

## Usage

This GitHub Action has been built to be consumed across the nCino organization in both public and private repositories. In order to incorporate this Action into a repository's build process, a workflow file must be added to that respository's `.github/workflows` directory. The workflow file can be named as needed and should mirror kebab-case format of the `codeowner-verifier.yml` file in this repository.

### Action Parameters

#### changedFiles

`changedFiles` is a required parameter that facilitates the processing of updated files in the context of the CODEOWNERS file. `changedFiles` expects to receive a space-delimited list of the filepaths that have been updated in a given PR or push operation. The example workflow in this repository uses the GitHub CLI to generate the list for this parameter.

#### deletedFiles

`deletedFiles` is a required parameter that facilitates the processing of moved and deleted files in the context of the CODEOWNERS file. `deletedFiles` expects to receive a space-delimited list of the filepaths that have been moved or deleted in a given PR or push operation. The example workflow in this repository uses the GitHub CLI to generate the list for this parameter.

#### GITHUB_TOKEN

The `GITHUB_TOKEN` is a required variable that is needed for the Action to work in the context of a private GitHub organization. A token should be provided that is connected to a user who has requisite access to the repository in context. The codeowner-verifier workflow in this repository uses the shared `DEVOPS_GITHUB_TOKEN` (associated with the CI user) for this parameter.

### Files

#### .codeownersignore

The `.codeownersignore` is an optional file within the `.github` directory at root that allows a repository to dictate certain filepaths to ignore when validating the CODEOWNERS file. This ignore file is meant to be used for filepaths like `node_modules`, `.gitignore`, `README.md`, and any other files where it may not make sense to require an explicit owner in the CODEOWNERS file. It should be used like a `.gitignore` file with one filepath pattern per line that gets ignored.

## Maintainers

[@garretpatten](https://www.github.com/garretpatten)

*For questions, bug reports, or feature requests, please open an issue on this repository or contact the maintainer directly.*

## License

This project is licensed under the [MIT License](./LICENSE).
