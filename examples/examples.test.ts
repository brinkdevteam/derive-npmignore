import * as assert from 'assert';
import * as fs from 'fs';
import {
  deriveNpmignoreAsync,
  readFileAsync,
} from '../index';
import * as mocha from 'mocha'
import * as path from 'path';

mocha.describe('examples', function () {
  for (const entry of fs.readdirSync(__dirname)) {
    const entryMatches = /(.*)\.gitignore$/.exec(entry);
    if (entryMatches !== null) {
      const basename = entryMatches[1];
      mocha.describe(`${basename}`, function () {
        mocha.it('generates the expected output', async function () {
          const inputPath = path.join(__dirname, entry);
          const expectedPath = path.join(__dirname, `${basename}.npmignore`);
          // Something that matches .gitignore.
          const outputPath = path.join(__dirname, `${basename}.npmignore.actual~`);
          const expectedPromise = readFileAsync(expectedPath);
          await deriveNpmignoreAsync(inputPath, outputPath, 'brinkdevteam-derive-npmignore');
          const output = await readFileAsync(outputPath);
          assert.strictEqual(output, await expectedPromise);
        });
      });
    }
  }
});
