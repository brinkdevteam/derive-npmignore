If you use transpilation for your package, you may want to avoid committing the compiled JavaScript to your repository while still publishing your scripts to npmjs.
However, `npm publish`/`npm pack` will use `.gitignore` to decide on files to exclude from the package unless you create a `.npmignore`.
Thus, one option you have is to maintain both `.gitignore` and `.npmignore`.
However, this duplicates code.

With this script, you have a second option.
Write `.gitignore`, mark a few lines as excluded from `.npmgignore`, and you’re done!

The script provided by this package, `brinkdevteam-derive-npmignore`, will automatically read your `.gitignore`, filter out any lines between `#BEGIN_NPMIGNORE_EXCLUDE` and `#END_NPMIGNORE_EXCLUDE`, and output the result to `.npmignore`.
It will also take any lines between `#BEGIN_NPMIGNORE_INCLUDE` and `#END_NPMIGNORE_INCLUDE` and remove exactly one `#` from the beginning of each line.

# Example

This example shows how one might combine this with a pattern of developing in TypeScript and publishing compiled JavaScript files with type definitions.

Note that `.npmignore` is considered a built file when using this pattern!

`.gitignore`:

```
# Common editor swap files
*.swp
*~
*\#*

# Build/restored
*.tgz
package-lock.json
node_modules

#BEGIN_NPMIGNORE_EXCLUDE

# Ignore built files.
*.d.ts
*.map
.npmignore

# However, sometimes we need to author and commit custom typings for untyped
# modules or to augment modules which have not been pushed upstream yet. Put
# these *.d.ts files inside of any directory called “types”:
!**/types/*.d.ts

#END_NPMIGNORE_EXCLUDE

#BEGIN_NPMIGNORE_INCLUDE
## TypeScript consumers generally cannot handle it when packages
## publish the source .ts depending on what loader is used to consume
## the files.
#*.ts
#!*.d.ts
#*.tsx
#END_NPMIGNORE_INCLUDE
```

Put your compilation and call to this sript in the `prepare` hook which is automatically called by `npm pack`/`npm publish` and also called whenever your module is included via a VCS reference.

`package.json`:

```json
{
  "devDependencies": {
    "@brinkdevteam/derive-npmignore": "^1.1.0",
    "typescript": "^3.0.1"
  },
  "scripts": {
    "prepare": "tsc -d && brinkdevteam-derive-npmignore"
  }
}
```

# Usage

`brinkdevteam-derive-npmignore [-h] [--] [path-to-.gitignore [path-to-.npmignore]]`

* `-h`: Prints the basic usage line and exits.

* `--`: Disabled interpretation of `-` for the remainder of the
  arguments. Useful if you may refer to paths starting with `-`.

* `path-to-.gitignore`: (Default: `.gitignore`) You may supply the
  path to the `.gitignore` file to use as a template. For example, in
  one of my projects, that is `../../.gitignore`. Regardless of the
  path to `.gitignore`, `.npmignore` will be output to the current
  directory by default.

* `path-to-.npmignore`: (Default: `.npmignore`) You may supply an
  alternate output path for the `.npmignore`. For example, you may
  wish to run this command from outside of the directory which you
  want to package.
