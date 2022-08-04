/*
	GitHub Dependencies
const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/core');
*/

/* Node Dependencies */
const fs = require('fs');
const minimatch = require('minimatch');

/*
	I/O
const INPUT_API_TOKEN = 'apiToken';
const INPUT_CODEOWNERS_PATH = 'codeownersPath';
const INPUT_CHANGED_FILES = 'changedFiles';
const OUTPUT_TIMESTAMP = 'timestamp';
*/

/*
 * Builds a Map<String, String[]> of
 * filepath to codeowners of that filepath
 * as indicated by the CODEOWNERS file
 */
function buildCodeownersMap(codeownersLines) {
	let codeownerEntry;
	const codeownersMap = new Map();

	for (let codeownerLine of codeownersLines) {
		if (codeownerLine.substring(0,1) != '#'
			&& codeownerLine.length > 1) {
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
 * Cleans CODEOWNERS filepaths to
 * facilitate filepattern/filepath
 * matching. Filepaths that start
 * with '/' will have them removed,
 * and directory paths that end in '/'
 * will have a '*' added. The all
 * encompassing '/*' filepath will
 * be unaltered.
 */
function cleanPath(filepath) {
	if (filepath == '*'
		|| filepath == '/'
		|| filepath == '/*'
	) {
		return filepath
	} else if (filepath.substring(0, 1) == '/') {
		filepath = filepath.substring(1);
	}

	return filepath;
}

/*
 * Generates a list of files that have
 * been changed in the commit in context
 * that do not have a corresponding entry
 * in the CODEOWNERS file.
 */
 function getChangedFilesWithoutOwnership(changedFiles, codeownersMap) {
 	const codeownersFilepaths = [...codeownersMap.keys()];
 	const changedFilesWithoutOwnership = [...changedFiles];

 	for (let filepath of changedFiles) {
 		codeownersFilepaths.forEach((filepathPattern) => {
 			// Universal filepath means that all
 			// files in the commit are owned
 			if (filepathPattern == '*'
				|| filepathPattern == '/'
			) {
 				return [];
 			}

 			let index;
 			if (isMatch(filepath, filepathPattern)) {
 				console.log('a match has been found for: ' + filepath + ' and ' + filepathPattern);
 				console.log('');
 				index = changedFilesWithoutOwnership.indexOf(filepath);
 				if (changedFilesWithoutOwnership[index] == filepath) {
 					changedFilesWithoutOwnership.splice(
 						changedFilesWithoutOwnership.indexOf(
 							filepath
 						),
 						1
 					);
 				}
 				console.log('');
 			}
 		});
 	}

 	return changedFilesWithoutOwnership;
 }

/*
 * Returns a list of codeowners given
 * an entry in the CODEOWNERS file.
 */
function getCodeowners(codeownerEntry) {
	codeownerEntry.splice(0, 1);

	return [...codeownerEntry];
}

async function getTeams(token) {
	const response = await new Octokit(
		{ auth: token }
	).request('GET /orgs/ncino/teams');

	console.log(response);

	for (let team of response.data) {
		validTeams.push(team.name);
	}
}

function isFileExtensionMatch(filepath, filepathPattern) {
	if (filepathPattern.substring(0,2) == '*.') {
		if (filepath.includes(filepathPattern.substring(1))) {
				return true;
		}
	}

	return false;
}

function isFirstLevelDirectoryMatch(filepath, filepathPattern) {
	if (filepathPattern.indexOf('/*') !== -1) {
		if (filepathPattern == '/*') {
			if (!filepath.includes('/')) {
				return true;
			}
		} else {
			let filepathSplit = filepath.split('/');
			let fileDirectory = filepathSplit[filepathSplit.length - 2];

			return filepathPattern.includes(fileDirectory);
		}
	}

	return false;
}

function isFullDirectoryMatch(filepath, filepathPattern) {
	if (filepathPattern.substring(filepathPattern.length - 1) == '/') {
		return filepath.includes(filepathPattern.substring(1));
	}

	return false;
}

function isMatch(filepath, filepathPattern) {
	/*
	const matchingFunctions = [
		minimatch,
		isFileExtensionMatch,
		isFullDirectoryMatch,
		isFirstLevelDirectoryMatch
	];

	matchingFunctions.forEach((matchingFunction) => {
		if (matchingFunction(filepath, filepathPattern)) {
			return true;
		}
	});
	*/

	if (minimatch(filepath, filepathPattern)) {
		return true;
	} else 	if (isFileExtensionMatch(filepath, filepathPattern)) {
		return true;
	} else 	if (isFullDirectoryMatch(filepath, filepathPattern)) {
		return true;
	} else 	if (isFirstLevelDirectoryMatch(filepath, filepathPattern)) {
		return true;
	} else {
		return false;
	}
}

function validateCodeowners() {
	/*
	const validTeams = null;

	const repoName = github.context.payload.repository.full_name.split('/')[1];
	console.log('Running codeowners-validator action for the ' + repoName + ' repository...');

	const apiToken = core.getInput(INPUT_API_TOKEN);
	const codeownersPath = core.getInput(INPUT_CODEOWNERS_PATH);
	const changedFilesSpaceDelimitedList = core.getInput(INPUT_CHANGED_FILES);
	const changedFiles = changedFilesSpaceDelimitedList.split(' ');

	if (apiToken != null) {
		getTeams(apiToken);
	}

	console.log(validTeams);

	console.log('');
	console.log('Changed files in this commit:');
	console.log(changedFiles);

	const codeownersMetadata = fs.readFileSync(codeownersPath, 'utf8');
	const codeownersLines = codeownersMetadata.split('\n');
	*/

	const apiToken = null;

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
		'/src/nSECURE/juice-shop/ @juiceShopOwner',
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

	const changedFiles = [
		'src/action.js',
		'src/objects/testObject.js',
		'LICENSE',
		'package.json',
		'.github/workflows/ExampleWorkflow.yml',
		'src/nSECURE/juice-shop/classes/JuiceShopController.cls',
		'dist/index.js'
	];

	const validTeams = [ '@garretpatten' ];

	const codeownersMap = buildCodeownersMap(codeownersLines);

	console.log('codeownersMap');
	console.log(codeownersMap);
	console.log('');

	const changedFilesWithoutOwnership = getChangedFilesWithoutOwnership(
		changedFiles,
		codeownersMap
	);

	console.log('');
	console.log('Changed files without ownership in this commit:');
	console.log(changedFilesWithoutOwnership);

	if (validTeams != null) {
		let invalidTeams = [];
		let owners;

		for (let key of codeownersMap.keys()) {
			owners = codeownersMap.get(key);
			owners.forEach((owner) => {
				if (!validTeams.includes(owner)) {
					invalidTeams.push(owner);
				}
			});
		}

		if (invalidTeams.length > 0) {
			let errorMessage = 'There are invalid Teams in the CODEOWNERS file: ';

			invalidTeams.forEach((team) => {
				errorMessage += team + ' '
			});


			// core.setFailed(errorMessage);
			console.log(errorMessage);
		}
	}

	/*
	core.setOutput(
		OUTPUT_TIMESTAMP,
		new Date().toTimeString()
	);
	*/
	console.log(new Date().toTimeString());
}

validateCodeowners();