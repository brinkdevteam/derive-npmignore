import * as fs from 'fs';

export function readFileAsync(path: string, encoding: string = 'utf8') {
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
    fs.writeFile(path, text, (ex) => {
      if (ex !== null) {
        reject(ex);
      } else {
        resolve();
      }
    });
  });
}

export async function deriveNpmignoreAsync(inputFile: string, outputFile: string, logPrefix: string) {
  const text = await readFileAsync(inputFile);
  const replacedText = text.replace(/^#BEGIN_NPMIGNORE_EXCLUDE$[^]*?^#END_NPMIGNORE_EXCLUDE$\n?/gm, '').replace(/^#BEGIN_NPMIGNORE_INCLUDE$\n?([^]*?)^#END_NPMIGNORE_INCLUDE$\n?/gm, (match, body: string) => {
    // Empty strings don’t split well, so just don’t deal with it.
    if (body.length < 0) {
      return body;
    }
    return body.split(/^/gm).map((line) => {
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
    // tslint:disable-next-line:no-console
    console.warn(`${logPrefix}: No regions of .gitignore were altered when building “${outputFile}”`);
  }
  await writeFileAsync(outputFile, replacedText);
}
