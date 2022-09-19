# codeowner-verifier
A GitHub Action to verify CODEOWNERS files -- both that all files included in a PR or push are owned and (if an apiToken is passed) that all owners in the CODEOWNERS file are valid Teams within the GitHub organization in context.

_CODE UNDER ACTIVE DEVELOPMENT_

## Table of Contents
- [Usage](#usage),
    - [Action Parameters](#action-parameters)
        - [apiToken](#apiToken)
        - [changedFiles](#changedFiles)
        - [ignoreList](#ignoreList)
    - [Environment Variables](#environment-variables)
    	- [GITHUB_TOKEN](#GITHUB_TOKEN)
- [Maintainers](#maintainers)
- [Contributing](#contributing)

## Usage
This GitHub Action has been built to be consumed across the nCino organization in both public and private repositories. In order to incorporate this Action into a repository's build process, a workflow file must be added to that respository's `.github/workflows` directory. The workflow file can be named as needed and should mirror the `exampleWorkflow.yml` file in this repository.
### Action Parameters
#### apiToken
The `apiToken` is an optional parameter that allows a repository to pass an access token with a permissions scope of read:org. If a token is supplied by the workflow, that token is used to retrieve valid GitHub Teams for the private organization in context so that the Teams specified in CODEOWNERS can be validated. If an `apiToken` is not supplied to the Action, the parameter defaults to null, and the owners specified in CODEOWNERS are not validated using the GitHub Teams API.
#### changedFiles
`changedFiles` is a required parameter that facilitates the processing of updated files in the context of the CODEOWNERS file. `changedFiles` expects to receive a space-delimited list of the filepaths that have been updated in a given PR or push operation. The example workflow in this repository uses the `jitterbit/get-changed-files` action (version 1) to generate that list for this parameter.
#### ignoreList
The `ignoreList` is an optional parameter that allows a repository to dictate certain filepaths to ignore when validating the CODEOWNERS file. This parameter is meant to be used for filepaths like `node_modules`, `.gitignore`, `README.md`, and any other files where it may not make sense to require an explicit owner in the CODEOWNERS file.
### Environment Variables
#### GITHUB_TOKEN
The `GITHUB_TOKEN` is a required parameter that is needed for the Action to work in the context of a private GitHub organization. A token should be provided that is connected to a user who has requisite access to the repository in context.

## Maintainers
[@GarretPatten](https://github.com/garretpatten).

## Contributing
TODO: Add information around contributions.