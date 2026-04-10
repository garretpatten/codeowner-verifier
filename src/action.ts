import * as core from '@actions/core';
import * as fs from 'fs';
import {
  handleWhiteSpaceInFilepaths,
  listChangedFilesWithoutOwnership,
  parseCodeownersFile,
  parseIgnoreFileContent,
} from './codeowners';

const INPUT_CHANGED_FILES = 'changedFiles';
const INPUT_DELETED_FILES = 'deletedFiles';

function readCodeownersText(): string {
  return fs.readFileSync('.github/CODEOWNERS', 'utf8');
}

function loadIgnorePatterns(): string[] {
  const githubPath = '.github/.codeownersignore';
  const legacyPath = '.codeownersignore';
  if (fs.existsSync(githubPath)) {
    return parseIgnoreFileContent(fs.readFileSync(githubPath, 'utf8'));
  }
  if (fs.existsSync(legacyPath)) {
    return parseIgnoreFileContent(fs.readFileSync(legacyPath, 'utf8'));
  }
  return [];
}

/**
 * Loads workflow inputs, evaluates `.github/CODEOWNERS` against changed paths, and fails the step
 * (via `core.setFailed`) when any changed file lacks an effective owner, setting the `errorMessage` output.
 */
export function verifyCodeowners(): void {
  const changedFiles = handleWhiteSpaceInFilepaths(
    core.getInput(INPUT_CHANGED_FILES),
  );
  const deletedFiles = handleWhiteSpaceInFilepaths(
    core.getInput(INPUT_DELETED_FILES),
  );
  const ignorePatterns = loadIgnorePatterns();
  const rules = parseCodeownersFile(readCodeownersText());
  const unowned = listChangedFilesWithoutOwnership(
    changedFiles,
    rules,
    deletedFiles,
    ignorePatterns,
  );

  if (unowned.length === 0) {
    return;
  }

  let errorMessage = '\nReview the ownership of the following files:\n';
  for (const file of unowned) {
    errorMessage += `    - ${file}\n`;
  }
  errorMessage +=
    '\nPlease update `.github/CODEOWNERS` for the paths above. See GitHub’s documentation on code owners:\n' +
    'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners\n' +
    'To skip paths without requiring an owner, use `.github/.codeownersignore` (see the action README):\n' +
    'https://github.com/garretpatten/codeowner-verifier#codeownersignore';

  core.setFailed(errorMessage);
  core.setOutput('errorMessage', errorMessage);
}

if (require.main === module) {
  verifyCodeowners();
}
