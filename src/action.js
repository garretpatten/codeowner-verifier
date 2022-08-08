/*
	GitHub Dependencies
const core = require('@actions/core');
const github = require('@actions/github');
*/
const { Octokit } = require('@octokit/core');

/* Node Dependencies */
const fs = require('fs');
const minimatch = require('minimatch');

/*
	I/O
const INPUT_API_TOKEN = 'apiToken';
const INPUT_CHANGED_FILES = 'changedFiles';
const INPUT_DIRECTORY_IGNORE_LIST = 'directoryIgnoreList'
const OUTPUT_TIMESTAMP = 'timestamp';
*/

/*
 * Builds a Map<String, String[]> of
 * filepathPattern to codeowners of
 * that filepathPattern as indicated
 * by the CODEOWNERS file.
 */
function buildCodeownersMap() {
	/*
	const codeownersMetadata = fs.readFileSync(
		'.github/CODEOWNERS',
		'utf8'
	);
	const codeownersLines = codeownersMetadata.split('\n');
	*/

	const codeownersLines = [
		'# Universal Owner of all files',
		'# * @god',
		'',
		'# Owner of all files in the first level of the root directory',
		'/* @ownerOfFirstLevelOfRootDirectory',
		'',
		'# Owner of all .yml files',
		'*.yml @ymlOwner',
		'',
		'# Owner of all files in a directory',
		'/node_modules/ @nodeModulesOwner',
		'',
		'# Owner of a specific directory path',
		'/src/nSECURE/juice-shop/ @juiceShopOwner # Test Inline Comment',
		'',
		'# Owner of all files in the first level of a hidden directory',
		'.github/* @githubOwner',
		'',
		'# Owner of all files in the first level of a directory',
		'src/* @srcOwnerFirstLevel',
		'',
		'# Owner of a subdirectory anywhere',
		'objects/ @objectsOwner',
		'',
		'# Valid syntax for unowned file',
		'LICENSE'
	];

	let codeownerEntry;
	const codeownersMap = new Map();

	for (let codeownerLine of codeownersLines) {
		if (codeownerLine.substring(0,1) != '#'
			&& codeownerLine.length > 1
		) {
			codeownerEntry = codeownerLine.split(' ');
			// Codeowner entries with only a file path
			// are valid but considered unowned, thus
			// they should not be added to the map
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
 * Cleans CODEOWNERS filepaths patterns
 * to facilitate filepath pattern to
 * filepath direct matching. Filepaths
 * that start with '/' will the beginning
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
function getChangedFilesWithoutOwnership(
	changedFiles,
	codeownersMap,
	directoryIgnoreList
) {
	const codeownersFilepaths = [...codeownersMap.keys()];
	let changedFilesWithoutOwnership = [...changedFiles];

	for (let filepath of changedFiles) {
		directoryIgnoreList.forEach((directory) => {
			if (filepath.includes(directory)) {
				removeFromList(changedFilesWithoutOwnership, filepath);
			}
		});

		for (let filepathPattern of codeownersFilepaths) {
			if (filepathPattern == '*'
				|| filepathPattern == '/'
			) {
				return [];
			}

			if (isMatch(filepath, filepathPattern)) {
				console.log('a match has been found for: ' + filepath + ' and ' + filepathPattern);
				console.log('');
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

function getTeams(token) {
	let p = new Promise((resolve, reject) => {
		let response;
		(async () => {
			console.log('in async function');
			try {
				response = await new Octokit(
					{ auth: token }
				).request('GET /orgs/ncino/teams');
			} catch (e) {
				reject(e);
			}

			console.log('request complete');
			console.log(response);

			if (response && response.data) {
				const retrievedTeams = [];
				for (let team of response.data) {
					retrievedTeams.push(team.name);
				}

				resolve(retrievedTeams);
			} else {
				console.log('There was an error retrieving teams');
				console.log(response);

				reject(response);
			}
		})();
	});

	return p;
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
 * whether the filepath of a given changed
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
 * added to avoid errant removal of the
 * incorrect item.
 */
function removeFromList(list, item) {
	let index = list.indexOf(item);
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
 * codeowners-validator GitHub Action.
 * If unowned files (as determined by
 * the CODEOWNERS file) have been added
 * or updated in the push or pull request
 * in context, errors will be set on the
 * check that identify the unowned files.
 * If an API token is provided, each owner
 * within the CODEOWNERS file will also be
 * validated using the GitHub Teams API. If
 * invalid teams are found in the CODEOWNERS
 * file, errors will be set on the check that
 * identify the invalid owners.
 */
function validateCodeowners() {
	let validTeams = null;

	/*
	const repoName = github.context.payload.repository.full_name.split('/')[1];
	console.log('Running codeowners-validator action for the ' + repoName + ' repository...');

	const apiToken = core.getInput(INPUT_API_TOKEN);
	const changedFilesSpaceDelimitedList = core.getInput(INPUT_CHANGED_FILES);
	const changedFiles = changedFilesSpaceDelimitedList.split(' ');
	const directoryIgnoreSpaceDelimitedList = core.getInput(INPUT_DIRECTORY_IGNORE_LIST);
	const directoryIgnoreList = directoryIgnoreSpaceDelimitedList.split(' ');
	*/

	const apiToken = null;

	let apiPromise = null;
	if (apiToken != null) {
		apiPromise = new Promise((resolve, reject) => {
			getTeams(apiToken).then((teams) => {
				validTeams = teams;
				resolve(validTeams);
			}).catch((error) => {
				console.log(error);
				reject(error);
			});
		});
	}

	/*
	console.log(validTeams);

	console.log('');
	console.log('Changed files in this commit:');
	console.log(changedFiles);

	const codeownersMetadata = fs.readFileSync(codeownersPath, 'utf8');
	const codeownersLines = codeownersMetadata.split('\n');
	*/

	const changedFiles = [
		'src/action.js',
		'src/objects/testObject.js',
		'LICENSE',
		'package.json',
		'.github/workflows/ExampleWorkflow.yml',
		'src/nSECURE/juice-shop/classes/JuiceShopController.cls',
		'dist/index.js',
		'src/dependencies/ignoreThisDependency'
	];

	const directoryIgnoreSpaceDelimitedList = '.git/ .sfdx/ .idea/ .vscode/ src/dependencies/';
	const directoryIgnoreList = directoryIgnoreSpaceDelimitedList.split(' ');

	const codeownersMap = buildCodeownersMap();

	console.log('codeownersMap');
	console.log(codeownersMap);
	console.log('');

	const changedFilesWithoutOwnership = getChangedFilesWithoutOwnership(
		changedFiles,
		codeownersMap,
		directoryIgnoreList
	);

	console.log('');
	console.log('Changed files without ownership in this commit:');
	console.log(changedFilesWithoutOwnership);

	let invalidTeams = [];
	if (apiPromise != null) {
		apiPromise.then((response) => {
			let owners = codeownersMap.get(key);

			for (let key of codeownersMap.keys()) {
				owners.forEach((owner) => {
					if (!validTeams.includes(owner)) {
						invalidTeams.push(owner);
					}
				});
			}
		}).catch((error) => {});
	}

	let errorMessage = null;
	if (changedFilesWithoutOwnership.length > 0) {
		errorMessage = '\n' + 'There are files without ownership in this work:' + '\n';

		changedFilesWithoutOwnership.forEach((file) => {
			errorMessage += file + '\n';
		});
	}

	if (invalidTeams.length > 0) {
		errorMessage = '\n' + 'There are invalid Teams in the CODEOWNERS file:' + '\n';
		invalidTeams.forEach((team) => {
			errorMessage += team + '\n'
		});
	}

	/*
	if (errorMessage != null) {
		core.setFailed(errorMessage);
	}
	*/
	console.log(errorMessage);

	/*
	core.setOutput(
		OUTPUT_TIMESTAMP,
		new Date().toTimeString()
	);
	*/
	console.log(new Date().toTimeString());
}

validateCodeowners();