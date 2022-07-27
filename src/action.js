/* GitHub Dependencies */
const core = require('@actions/core');
const github = require('@actions/github');

/* Node Dependencies */
const fs = require('fs');

/* I/O */
const INPUT_CODEOWNERS_PATH = 'codeownersPath';
const INPUT_CHANGED_FILES = 'changedFiles';
const OUTPUT_TIMESTAMP = 'timestamp';

// const repoName = github.context.payload.repository.full_name.split('/')[1];

// TODO: Determine if given filepath has
// a corresponding codeowners entry
function isFilepathInCodeowners(filepath, codeownersFilepaths) {
	console.log('isFilepathInCodeowners has been called with:');
	console.log(filepath);
	if (filepath == 'LICENSE') { return false; }
	else { return true; }
}

function run() {
	/*
	console.log('Running codeowners-validator action for the ' + repoName + ' repository...');

	const codeownersPath = core.getInput(INPUT_CODEOWNERS_PATH);
	const changedFiles = core.getInput(INPUT_CHANGED_FILES);

	const codeownersMetadata = fs.readFileSync(codeownersPath, 'utf8');
	const codeownersLines = codeownersMetadata.split('\n');
	*/

	// TODO: Remove mocks
	const codeownersLines = [
		'# This should be validated',
		'/.github/* @garretpatten',
		'',
		'# This should lead to an error',
		'/dist/* @aldjkdjflsd-jsdjflsdkf',
		'',
		'# This should be validated',
		'**/action.js @garretpatten'
	];
	const diffFiles = [
		'/src/action.js',
		'/LICENSE',
		'/.github/workflows/ExampleWorkflow.yml'
	];
	const validTeams = [ '@garretpatten' ];

	let codeownerEntry;
	const codeownersMap = new Map();
	for (let codeownerLine of codeownersLines) {
		// Filter out comments and blank lines
		if (codeownerLine.substring(0,1) !== '#'
			&& codeownerLine.length > 1) {
			codeownerEntry = codeownerLine.split(' ');
			codeownersMap.set(
				codeownerEntry[0],
				codeownerEntry[1]
			);
		}
	}

	console.log('codeownersMap');
	console.log(codeownersMap);
	console.log('');

	/* TODO:
		- Iterate through changed files
		- If a changed file is identified that is not
		  in the codeownersFilepaths, then the
		  check should fail
	*/
	const codeownersFilepaths = codeownersMap.keys();
	// const diffFiles = [];
	for (let filepath of diffFiles) {
		if (!isFilepathInCodeowners(filepath, codeownersFilepaths)) {
			// core.setFailed('Updates have been made that do not have a corresponding codeowners entry');
			console.log('An updated filepath has been found that is not in the CODEOWNERS file');
			console.log(filepath);
		}
	}

	/* TODO:
		- Iterate through the codeownersMap
		- Ensure that every filepath is
		  pointing to a valid GitHub
		  Team or individual
		- If an invalid GitHub Team or
		  individual is found, then
		  the check should fail
	*/
	let owner;
	for (let key of codeownersMap.keys()) {
		owner = codeownersMap.get(key);
		if (!validTeams.includes(owner)) {
			let errorMessage = 'The owner ' + owner + ' is not a valid GitHub Team. ';
			errorMessage += 'Resolve the codeowners entry for ' + key;
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
}

run();