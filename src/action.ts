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
    '\nPlease update the CODEOWNERS file to take ownership over the updated files ' +
    'following the Code Owners best practices within the nCino Development Guide:\n' +
    'https://github.com/ncino/ncino-development-guide/blob/main/Best%20Practices/Code%20Owners.md.\n' +
    'If files should be ignored or have no ownership, they can be added to the .codeownersignore file. ' +
    "For reference, see the .codeownersignore section of the action's README:\n" +
    'https://github.com/ncino/codeowner-verifier#codeownersignore';

  core.setFailed(errorMessage);
  core.setOutput('errorMessage', errorMessage);
}

if (require.main === module) {
  verifyCodeowners();
}
