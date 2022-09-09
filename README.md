# ✨ giget

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Easily download git repositories

## Features

✔ Multi-provider support (GitHub, GitLab, and Bitbucket).

✔ Fast cloning using tarball gzip without depending on local `git` and `tar` commands or downloading history.

✔ Works online and offline with disk cache support.

✔ Support extracting with a subdir.

## Usage (CLI)

```bash
npx giget@latest unjs/template my-lib

# ✨ Successfully cloned https://github.com/unjs/template/tree/main/ to my-lib
```

```bash
npx giget@latest <repo> [<dir>] [...options]
```

### Arguments

- **repo**: A URI describing provider, repository, subdir, and branch/ref.
  - Format is `[provider]:repo[/subpath][#ref]`.
- **dir**: A relative or absolute path where to extract the repository.
  - If not provided, the name of the org + repo will be used as the name.

### Options

- `--force`: Clone to exsiting directory even if exists.
- `--offline`: Do not attempt to download and use cached version.
- `--prefer-offline`: Use cache if exists otherwise try to download.
- `--force-clean`: ⚠️ Remove any existing directory or file recusively before cloning.
- `--shell`: ⚠️ Open a new shell with current working directory in cloned dir. (Experimental)

### Examples

```sh
# Clone the main branch of github.com/unjs/template to unjs-template directory
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
npx giget@latest bitbucket:unjs/template
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

### `downloadRepo(source, dir?, options?)`

**Example:**

```js
const { source, dir } = await downloadRepo('github:unjs/template')
```

**Parameters:**

- `source`: (string) Input source in format of `[provider]:repo[/subpath][#ref]`.
- `dir`: (string) Destination directory to clone to. If not provided, `user-name` will be used relative to the current directory.
- `options`: (object) Options are usually inferred from the input string. You can customize them.
  - `provider`: (string) Either `github`, `gitlab` or `bitbucket`. The default is `github`.
  - `repo`: (string) Name of repository in format of `{username}/{reponame}`.
  - `ref`: (string) Git ref (branch or commit or tag). The default value is `main`.
  - `subdirpath`: (string) subdir of the repo to clone from. The default value is none.
  - `force`: (boolean) Extract to the exisiting dir even if already exsists.
  - `forceClean`: (boolean) ⚠️ Clean ups any existing directory or file before cloning.
  - `offline`: Do not attempt to download and use cached version.
  - `preferOffline`: Use cache if exists otherwise try to download.

**Return value:**

The return value is a promise that resolves to an object with the following properties:

- `dir`: (string) Path to extracted dir.
- `url`: (string) URL of repostiroy that can be opened in browser. Useful for logging.
- `source`: (string) Normalized version of the input source. Useful for logging.

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
