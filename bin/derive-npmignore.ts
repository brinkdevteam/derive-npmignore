#!/usr/bin/env node
import * as fs from 'fs';

function readFileAsync(path: string, encoding: string = 'utf8') {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, encoding, (ex, text) => {
      if (ex !== null) {
        reject(ex);
      } else {
        resolve(text);
      }
    });
  });
}

function writeFileAsync(path: string, text: string) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, text, ex => {
      if (ex !== null) {
        reject(ex);
      } else {
        resolve();
      }
    });
  });
}

function getArgs(argv: string[], opts: {
  [key: string]: () => boolean;
}) {
  const args = [];
  let escaped = false;
  for (const arg of argv.slice(2)) {
    if (!escaped) {
      if (arg === '--') {
        escaped = true;
        continue;
      }
      if (opts[arg] !== undefined) {
        if (opts[arg]()) {
          continue;
        } else {
          return;
        }
      }
      if (arg[0] === '-') {
        throw new Error(`Argument “${arg}” not supported. See README for usage instructions.`);
      }
    }
    args.push(arg);
  }
  return args;
}

void (async () => {
  try {
    const args = getArgs(process.argv, {
      '-h': () => {
        console.log(`Usage: ${process.argv[1]} [-h] [--] [path-to-.gitignore [path-to-.npmignore]]`);
        return false;
      },
    });
    if (args === undefined) {
      return;
    }

    const inputFile = args.length > 0 ? args[0] : '.gitignore';
    const outputFile = args.length > 1 ? args[1] : '.npmignore';

    const text = await readFileAsync(inputFile);
    const replacedText = text.replace(/^#BEGIN_NPMIGNORE_EXCLUDE$[^]*^#END_NPMIGNORE_EXCLUDE$/gm, '').replace(/^#BEGIN_NPMIGNORE_INCLUDE$([^]*)^#END_NPMIGNORE_INCLUDE$/gm, (match, body: string) => {
      // Empty strings don’t split well, so just don’t deal with it.
      if (body.length < 0) {
        return body;
      }
      return body.split(/^/gm).map(line => {
        // Allow empty lines as an exception.
        const lineBodyMatch = /^(.*)$/m.exec(line);
        if (lineBodyMatch === null) {
          throw new Error('Unexpected regexp failure on line');
        }
        const lineBody = lineBodyMatch[1];
        // Allow empty lines to not be prefixed with “#”.
        if (lineBody.length === 0) {
          return line;
        }
        // Require every line in body to begin with “#”.
        if (line[0] !== '#') {
          throw new Error(`Line inside of #BEGIN_NPMIGNORE_INCLUDE…#END_NPMIGNORE_INCLUDE block does not start with “#”: ${line}`);
        }
        // Be sure to include the EOL characters when returning. I.e.,
        // return line—not lineBody.
        return line.substring(1);
      }).join('');
    });
    if (replacedText === text) {
      console.warn(`brinkdevteam-derive-npmignore: No regions of .gitignore were altered when building “${outputFile}”`);
    }
    await writeFileAsync(outputFile, replacedText);
  } catch (ex) {
    // tslint:disable-next-line:no-console
    console.log(`brinkdevteam-derive-npmignore:`, ex);
    process.exitCode = 1;
  }
})();
