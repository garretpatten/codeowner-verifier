/* GitHub Dependencies */
const core = require('@actions/core');
const github = require('@actions/github');

/* Node Dependencies */
const fs = require('fs');

/* I/O */
const INPUT_CODEOWNERS_PATH = 'codeownersPath';
const OUTPUT_TIMESTAMP = 'timestamp';

const repoName = github.context.payload.repository.full_name.split('/')[1];

function run() {
	console.log('Running codeowners-validator action for the ' + repoName + ' repository...');

	const codeownersPath = core.getInput(INPUT_CODEOWNERS_PATH);

	const codeownersMetadata = fs.readFileSync(codeownersPath, 'utf8');
	const codeownersLines = codeownersMetadata.split('\n');

	const codeownersEntries = [];
	for (let codeownerLine of codeownersLines) {
		// Filter out comments and blank lines
		if (codeownerLine.substring(0,1) !== '#'
			|| codeownerLine !== '') {
			codeownersEntries.push(codeownerLine);
		}
	}

	console.log('These are the codeownersLines');
	console.log(codeownersLines);
	console.log('');
	console.log('These are the codeownersEntries');
	console.log(codeownersEntries);

	core.setOutput(
		OUTPUT_TIMESTAMP,
		new Date().toTimeString()
	);
}

run();