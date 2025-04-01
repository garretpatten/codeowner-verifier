# Contributing Guide

## Creating a GitHub Issue

*GitHub Issues should be used to request new rules and to track needed bug fixes and enhancements*

1. If a GitHub Issue does not exist to capture your intended changes, create a GitHub Issue for this repository.
2. Name the Issue according to its type in the following format:
    - [Bug] A descriptive title for the bug being logged
    - [Feature] A descriptive title of the requested feature
3. Fill out the Issue Template:
    - Add an Issue Description.
    - If the Issue was observed in a specific workflow run, link that workflow run (or paste a screenshot of the output) under Issue Reference(s).
    - Include any useful, supplemental information/screenshots in the Additional Information section.
4. Submit the Issue.

## Resolving a GitHub Issue

1. Assign the GitHub Issue to yourself.
2. Clone the `codeowner-verifier` repository and create a new branch named `issueX` where X is the Issue number.
3. Resolve the Issue in your local branch.
4. Once the intended changes have been made locally, ensure that the `node_modules` are up to date and that a webpack build has been run if the action.js file has been updated (`npm run build` will run a webpack build and output the minified `src/action.js` file to `dist/index.js`).
5. Push the local changes (including any updates to the `node_modules`, `src/action.js`, and `dist/index.js`) up to a remote branch by the same name and open a Pull Request against the `main` branch (please explain the changes in the Pull Request template and follow the Checklist items); relevant code owners will be requested for review.
