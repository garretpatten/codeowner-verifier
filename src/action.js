/* GitHub Dependencies */
const core = require('@actions/core');

/* Node Dependencies */
const fs = require('fs');
const minimatch = require('minimatch');

/* I/O */
const INPUT_CHANGED_FILES = 'changedFiles';
const INPUT_DELETED_FILES = 'deletedFiles';

/*
 * Builds a Map<String, String[]> of
 * filepathPattern to codeowners of
 * that filepathPattern as indicated
 * by the CODEOWNERS file.
 */
function buildCodeownersMap() {
    const codeownersMetadata = fs.readFileSync(
        '.github/CODEOWNERS',
        'utf8'
    );
    const codeownersLines = codeownersMetadata.split('\n');

    let codeownerEntry;
    const codeownersMap = new Map();
    for (let codeownerLine of codeownersLines) {
        if (codeownerLine.substring(0,1) != '#'
            && codeownerLine.length > 1
        ) {
            // If there are escaped spaces in the
            // codeownerLine, then the filepath must
            // be handled accordingly as the space
            // will not serve as a valid delimiter.
            if (codeownerLine.indexOf('\\ ') !== -1) {
                codeownerEntry = handleFilepathWithSpace(codeownerLine);
            } else {
                codeownerEntry = codeownerLine.split(' ');
            }

            // Codeowner entries with only a file path
            // are valid but considered unowned, thus
            // they should not be added to the map.
            if (codeownerEntry.length > 1) {
                codeownerEntry[0] = cleanPath(codeownerEntry[0]);
                codeownersMap.set(
                    codeownerEntry[0],
                    getCodeowners(codeownerEntry)
                );
            }
        }
    }

    return codeownersMap;
}

/*
 * Parses the .codeownersignore
 * file and builds a String array
 * of filepath patterns.
 */
function buildIgnoreList() {
	const ignoreList = [];
	const codeownersIgnoreOldPath = '.codeownersignore';
	const codeownersIgnorePath = '.github/.codeownersignore';

	if (!fs.existsSync(codeownersIgnoreOldPath) && !fs.existsSync(codeownersIgnorePath)) {
		return ignoreList;
	}

	const ignoreFile = fs.existsSync(codeownersIgnorePath) ?
		fs.readFileSync(codeownersIgnorePath, 'utf8').split('\n') :
		fs.readFileSync(codeownersIgnoreOldPath, 'utf8').split('\n');

	for (let entry of ignoreFile) {
		if (entry.substring(0,1) !== '#' && entry.length > 1) {
			// Remove any inline comments
			if (entry.indexOf(' #') !== -1) {
				entry = entry.substring(0, entry.indexOf(' #'));
			}

			ignoreList.push(
				cleanPath(entry)
			);
		}
	}

	return ignoreList;
}

/*
 * Cleans CODEOWNERS filepath patterns
 * to facilitate filepath pattern to
 * filepath direct matching. Filepaths
 * that start with '/' will have the beginning
 * forward slash removed unless that filepath
 * pattern is the first level root directory
 * pattern - '/*'.
 */
function cleanPath(filepath) {
    if (filepath != '/*'
        && filepath.substring(0, 1) == '/'
    ) {
        filepath = filepath.substring(1);
    }

    return filepath;
}

/*
 * Generates a list of files that have
 * been changed that do not have explicit
 * ownership defined in the CODEOWNERS file.
 */
function getChangedFilesWithoutOwnership(changedFiles, codeownersMap, deletedFiles, ignoreList) {
    const codeownersFilepaths = [...codeownersMap.keys()];
    let changedFilesWithoutOwnership = [...changedFiles];

    let filesToFilterOut = [];
    filesToFilterOut = ignoreList != '' ? filesToFilterOut.concat(ignoreList) : filesToFilterOut;
    filesToFilterOut = deletedFiles != '' ? filesToFilterOut.concat(deletedFiles) : filesToFilterOut;

    for (let filepath of changedFiles) {
        filesToFilterOut.forEach((path) => {
            if (filepath.includes(path)) {
                removeFromList(changedFilesWithoutOwnership, filepath);
            }
        });

        for (let filepathPattern of codeownersFilepaths) {
            // Universal filepath means that
            // all changed files are owned.
            if (filepathPattern == '*') {
                return [];
            }

            if (isMatch(filepath, filepathPattern)) {
                removeFromList(changedFilesWithoutOwnership, filepath);
            }
        }
    }

    return changedFilesWithoutOwnership;
}

/*
 * Returns an array of codeowners given
 * an entry in the CODEOWNERS file. This
 * is done by removing the filepath pattern
 * and isolating the owners by removing any
 * inline comments beginning with a '#'.
 */
function getCodeowners(codeownerEntry) {
    codeownerEntry.splice(0, 1);

    for (let index = 0; index < codeownerEntry.length; index++) {
        if (codeownerEntry[index].substring(0, 1) == '#') {
            codeownerEntry.splice(index);
        }
    }

    return [...codeownerEntry];
}

/*
 * Determines whether the filepath of a
 * given changed file matches with a
 * filepath pattern from the CODEOWNERS file.
 *
 * For case:
 *   filepath: script.js
 *   filepathPattern: *.js
 */
function isFileExtensionMatch(filepath, filepathPattern) {
    if (filepathPattern.substring(0,2) == '*.') {
        return filepath.includes(filepathPattern.substring(1));
    }

    return false;
}

/*
 * Generates a codeowner entry array
 * given a codeowner line where the
 * filepath contains escaped spaces and
 * thus must be processed accordingly.
 */
function handleFilepathWithSpace(codeownerLine) {
    let codeownerEntry = null;
    let filepath = '';
    let indexOfSpace;

    let finished = false;
    while (!finished) {
        // If there are still spaces, continue processing.
        if (codeownerLine.indexOf('\\ ') !== -1) {
            indexOfSpace = codeownerLine.indexOf('\\ ');
            filepath += codeownerLine.substring(0, indexOfSpace) + ' ';
            codeownerLine = codeownerLine.substring(indexOfSpace + 2);

            // If next character is an owner, building the filepath
            // is complete and processing can finish.
            if (codeownerLine[0] == '@') {
                // Remove delimiting space from filepath.
                filepath = filepath.substring(0, filepath.length - 1);
                codeownerEntry.push(filepath, ...codeownerLine.split(' '));

                finished = true;
            }
        // If there are no escaped spaces left, but there
        // are delimiting spaces, split the remaining line
        // on spaces and build entry accordingly.
        } else if (codeownerLine.indexOf(' ') !== -1) {
            indexOfSpace = codeownerLine.indexOf(' ');
            filepath += codeownerLine.substring(0, indexOfSpace);
            codeownerLine = codeownerLine.substring(indexOfSpace + 1);

            codeownerEntry = [filepath, ...codeownerLine.split(' ')];
            finished = true;

        // If there are no spaces left, then there is no owner
        // specified on the entry. The filepath should be
        // completed, and the result should be returned.
        } else {
            filepath += codeownerLine;
            codeownerEntry = [filepath];

            finished = true;
        }
    }

    return codeownerEntry;
}

/*
 * Generates a list of filepaths given
 * a space-delimited list of changed files
 * from the GitHub CLI where some of those
 * filepaths may contain whitespace.
 */
function handleWhiteSpaceInFilepaths(filesSpaceDelimitedList) {
    const filepaths = [];
    let filepath = '';
    let indexOfSpace;
    let indexOfExtension;

    let finished = false;
    while (!finished) {
        // For case: early exit as no spaces remain
        if (filesSpaceDelimitedList.indexOf(' ') === -1) {
            filepath += filesSpaceDelimitedList;
            filesSpaceDelimitedList = '';

        // For case: .gitignore, .github/CODEOWNERS and similar
        // filepaths that are hidden and lack file extensions
        } else if (filesSpaceDelimitedList.substring(0, 1) == '.') {
            indexOfSpace = filesSpaceDelimitedList.indexOf(' ');
            filepath += filesSpaceDelimitedList.substring(
                0,
                indexOfSpace
            );
            filesSpaceDelimitedList = filesSpaceDelimitedList.substring(indexOfSpace + 1);

        // For case: LICENSE
        } else if (filesSpaceDelimitedList.substring(0, 7) == 'LICENSE') {
            filepath += filesSpaceDelimitedList.substring(0, 7);
            filesSpaceDelimitedList = filesSpaceDelimitedList.substring(8);

        // For case: file/path.js and file/path with spaces.js
        } else {
            indexOfExtension = filesSpaceDelimitedList.indexOf('.');
            filepath += filesSpaceDelimitedList.substring(0, indexOfExtension);
            filesSpaceDelimitedList = filesSpaceDelimitedList.substring(indexOfExtension);

            if (filesSpaceDelimitedList.indexOf(' ') !== -1) {
                indexOfSpace = filesSpaceDelimitedList.indexOf(' ');
                filepath += filesSpaceDelimitedList.substring(
                    0,
                    indexOfSpace
                );
                filesSpaceDelimitedList = filesSpaceDelimitedList.substring(indexOfSpace + 1);
            } else {
                filepath += filesSpaceDelimitedList
                filesSpaceDelimitedList = '';
            }
        }

        filepaths.push(filepath);
        filepath = '';

        if (filesSpaceDelimitedList == '') {
            finished = true;
        }
    }

    return filepaths;
}

/*
 * Determines whether the filepath of a
 * given changed file matches with a
 * filepath pattern from the CODEOWNERS file.
 *
 * For case:
 *   filepath: README.md
 *   filepathPattern: /*
 */
function isFirstLevelDirectoryMatch(filepath, filepathPattern) {
    if (filepathPattern.indexOf('/*') !== -1) {
        if (filepathPattern == '/*') {
            return !filepath.includes('/');
        } else {
            let filepathSplit = filepath.split('/');
            let fileDirectory = filepathSplit[filepathSplit.length - 2];

            return filepathPattern.includes(fileDirectory);
        }
    }

    return false;
}

/*
 * Determines whether the filepath of a
 * given changed file matches with a
 * filepath pattern from the CODEOWNERS file.
 *
 * For case:
 *   filepath: directory/subDirectory/script.js
 *   filepathPattern: directory/
 */
function isFullDirectoryMatch(filepath, filepathPattern) {
    if (filepathPattern.substring(filepathPattern.length - 1) == '/') {
        return filepath.includes(filepathPattern.substring(1));
    }

    return false;
}

/*
 * Orchestrating function to determine
 * whether the file path of a given changed
 * file matches with a filepath pattern from
 * the CODEOWNERS file.
 *
 * Runs an array of functions that handle
 * different types of matches. When a match
 * is found, true is returned. Otherwise,
 * false is returned.
 */
function isMatch(filepath, filepathPattern) {
    const matchingFunctions = [
        minimatch,
        isFileExtensionMatch,
        isFullDirectoryMatch,
        isFirstLevelDirectoryMatch
    ];

    for (let matchingFunction of matchingFunctions) {
        if (matchingFunction(filepath, filepathPattern)) {
            return true;
        }
    }

    return false;
}

/*
 * Helper function to remove a specific
 * item from a given list using the
 * index of the item. A check has been
 * added to avoid errant removal of an
 * incorrect item.
 */
function removeFromList(list, item) {
    const index = list.indexOf(item);
    if (list[index] == item) {
        list.splice(
            list.indexOf(
                item
            ),
            1
        );
    }
}

/*
 * Orchestrating function of the
 * codeowner-verifier GitHub Action.
 * If unowned files (as determined by
 * the CODEOWNERS file) have been added
 * or updated in the push or pull request
 * in context, errors will be set on the
 * check that identify the unowned files.
 */
function verifyCodeowners() {
    const changedFilesSpaceDelimitedList = core.getInput(INPUT_CHANGED_FILES);
    const changedFiles = handleWhiteSpaceInFilepaths(changedFilesSpaceDelimitedList);

    const deletedFilesSpaceDelimitedList = core.getInput(INPUT_DELETED_FILES);
    const deletedFiles = handleWhiteSpaceInFilepaths(deletedFilesSpaceDelimitedList);

    const ignoreSpaceDelimitedList = core.getInput(INPUT_IGNORE_LIST);
    const ignoreList = ignoreSpaceDelimitedList.split(' ');

    const codeownersMap = buildCodeownersMap();

    const changedFilesWithoutOwnership = getChangedFilesWithoutOwnership(
        changedFiles,
        codeownersMap,
        deletedFiles,
        ignoreList
    );

    let errorMessage = null;
    if (changedFilesWithoutOwnership.length > 0) {
        errorMessage = '\n' + 'There are files without ownership in this work:' + '\n';

        changedFilesWithoutOwnership.forEach((file) => {
            errorMessage += file + '\n';
        });

        errorMessage +=
          '\n' +
          'Please update the CODEOWNERS file to take ownership over the updated files ' +
          'following the Code Owners best practices within the nCino Development Guide:' +
          '\n' +
          'https://github.com/ncino/ncino-development-guide/blob/main/Best%20Practices/Code%20Owners.md' +
          '\n' +
          'If files should be ignored or have no ownership, they can be added to the .codeownersignore file. ' +
          'For reference, see the `.codeownersignore` file information in the codeowner-verifier README:' +
          '\n' +
          'https://github.com/ncino/codeowner-verifier#.codeownersignore';
    }

    if (errorMessage != null) {
        core.setFailed(errorMessage);
    }
}

verifyCodeowners();
