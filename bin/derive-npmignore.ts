#!/usr/bin/env node
import {
  deriveNpmignoreAsync,
} from '../index';

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
        throw new Error(`Argument “${arg}” not supported. See ${process.argv[1]} -h for usage instructions.`);
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

    await deriveNpmignoreAsync(inputFile, outputFile, process.argv[1]);
  } catch (ex) {
    // tslint:disable-next-line:no-console
    console.log(`${process.argv[1]}:`, ex);
    process.exitCode = 1;
  }
})();
