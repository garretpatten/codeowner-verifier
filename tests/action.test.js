/* Built-in Mocks */
jest.spyOn(console, 'log').mockImplementation(() => {});

const {
    verifyCodeowners
} = require('../src/action');

const core = require('@actions/core');
const fs = require('fs');

/* Test Suite */
describe('Codeowner Verifier GitHub Action', () => {
    beforeEach(() => {
        jest.resetAllMocks();

        jest.spyOn(core, 'getInput').mockImplementation((name) => {
            if (name === 'changedFiles') {
                return 'file1.js file2.js file3.js file4.js file5.js';
            } else if (name === 'deletedFiles') {
                return 'deleted1.js deleted2.js';
            }
            return '';
        });

        jest.spyOn(core, 'setFailed').mockImplementation((error) => {});
        jest.spyOn(core, 'setOutput').mockImplementation((name, value) => {});
    });

    test('verifyCodeowners passes when there is a default owner in CODEOWNERS', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementation((filepath, options) => {
            if (filepath === '.github/CODEOWNERS') {
                return '* @defaultOwner\n';
            }

            return '';
        });

        verifyCodeowners();

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(core.setOutput).not.toHaveBeenCalled();
    });

    test('verifyCodeowners passes when all changes files are owned in CODEOWNERS', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementation((filepath, options) => {
            if (filepath === '.github/CODEOWNERS') {
                return 'file1.js @team1\nfile2.js @team2\nfile3.js @team3\nfile4.js @team4\nfile5.js @team5\n';
            }

            return '';
        });

        verifyCodeowners();

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(core.setOutput).not.toHaveBeenCalled();
    });

    test('verifyCodeowners passes when all changes files are owned in CODEOWNERS and there are lots of comments', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementation((filepath, options) => {
            if (filepath === '.github/CODEOWNERS') {
                return 'file1.js @team1 # here is an inline comment\n# this is a standalone comment\nfile2.js @team2 # another inline comment\nfile3.js @team3\n# team 4 is better than team 3\nfile4.js @team4\nfile5.js @team5\n### something weird and unusual 12345 #######\n';
            }

            return '';
        });

        verifyCodeowners();

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(core.setOutput).not.toHaveBeenCalled();
    });

    test('verifyCodeowners does not evaluate ownership lines that are commented out', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementation((filepath, options) => {
            if (filepath === '.github/CODEOWNERS') {
                return 'file1.js @team1\n# file2.js @team2\nfile3.js @team3\n### file4.js @team4 ###\nfile5.js @team5\n';
            }

            return '';
        });

        verifyCodeowners();

        expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Review the ownership of the following files:'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.not.stringContaining('file1.js'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.stringContaining('file2.js'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.not.stringContaining('file3.js'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.stringContaining('file4.js'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.not.stringContaining('file5.js'));
    });

    test('verifyCodeowners fails when unowned files are changed', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementation((filepath, options) => {
            if (filepath === '.github/CODEOWNERS') {
                return 'file1.js @team1\nfile2.js @team2\nfile3.js @team3\nfile4.js @team4\n';
            }

            return '';
        });

        verifyCodeowners();

        expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Review the ownership of the following files:'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.not.stringContaining('file1.js'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.not.stringContaining('file2.js'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.not.stringContaining('file3.js'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.not.stringContaining('file4.js'));
        expect(core.setOutput).toHaveBeenCalledWith('errorMessage', expect.stringContaining('file5.js'));
    });
});
