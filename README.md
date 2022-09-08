# ✨ giget

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Easily download git repositories

## Features

✔ Multi provider support (github, gitlab and bitbucket)

✔ Super fast cloning using tarball gzip without depending on local `git` or `tar` commands.

✔ Works online and offline with fallback

✔ Support extracting with subpath

## Usage (CLI)

```
npx giget@latest <repo> [<dir>]
```

### Arguments

- **repo**: A uri describing provider, repository, subpath and branch/ref.
  - Format is `[provider]:orgOrUser/name[/path][#ref]`. See examples.
- ***dst**: An absolute or relative path where to extract the repository.
  - If not provider, name of repo will be used as directory name in current working directory.

### Examples

```sh
# Clone main branch of github.com/unjs/template to unjs-template directory
npx giget@latest unjs/template

# Clone to myProject directory
npx giget@latest unjs/template myProject

# Clone dev branch
npx giget@latest unjs/template#dev

# Clone /test directory from main branch
npx giget@latest unjs/template/test

# Clone from gitlab
npx giget@latest gitlab:unjs/template

# Clone from bitbucket
npx giget@latest butbucket:unjs/template
```

## Usage (Programmatic)

Install package:

```sh
# npm
npm install giget

# yarn
yarn install giget

# pnpm
pnpm install giget
```

Import:

```js
// ESM
import { downloadRepo } from 'giget'

// CommonJS
const { downloadRepo } = require('giget')
```

### `downloadRepo(input, options)`

**Example:**

```js
const { source, dir } = await downloadRepo('github:unjs/template')
```

**Options:**

Options are usually inferred from input string. But you can choose to override them.

- `provider`: (string) Either `github`, `gitlab` or `bitbucket`. Default is `github`.
- `repo`: (string) Name of repository in format of `{username}/{reponame}`.
- `ref`: (string) Git ref (branch or commit or tag). Default is `main`.
- `subpathpath`: (string) subpath of repo to clone from. Default is none.

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## Related projects

- https://github.com/samsonjs/gitter
- https://github.com/tiged/tiged
- https://github.com/Rich-Harris/degit


## License

Made with 💛

Published under [MIT License](./LICENSE).

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/giget?style=flat-square
[npm-version-href]: https://npmjs.com/package/giget

[npm-downloads-src]: https://img.shields.io/npm/dm/giget?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/giget

[github-actions-src]: https://img.shields.io/github/workflow/status/unjs/giget/ci/main?style=flat-square
[github-actions-href]: https://github.com/unjs/giget/actions?query=workflow%3Aci

[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/giget/main?style=flat-square
[codecov-href]: https://codecov.io/gh/unjs/giget
