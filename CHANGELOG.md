# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## v3.1.0

[compare changes](https://github.com/unjs/giget/compare/v3.0.0...v3.1.0)

### 🚀 Enhancements

- Allow passing install options to nypm ([c420507](https://github.com/unjs/giget/commit/c420507))

### 🔥 Performance

- Lazy load nypm ([1a717a8](https://github.com/unjs/giget/commit/1a717a8))
- Lazy import `tar` ([baa58db](https://github.com/unjs/giget/commit/baa58db))

### ❤️ Contributors

- Pooya Parsa ([@pi0](https://github.com/pi0))

## v3.0.0

[compare changes](https://github.com/unjs/giget/compare/v2.0.0...v3.0.0)

### 💅 Refactors

- **cli:** Fix usage grammar issues ([#233](https://github.com/unjs/giget/pull/233))
- Stricter types ([93161e3](https://github.com/unjs/giget/commit/93161e3))
- ⚠️  Zero dependency ([#248](https://github.com/unjs/giget/pull/248))
- **cli:** Template positional arg is required ([0a52e78](https://github.com/unjs/giget/commit/0a52e78))

### 📖 Documentation

- Add `gitpick` to related projects ([#221](https://github.com/unjs/giget/pull/221))

### 📦 Build

- Migrate to obuild / rolldown ([fe78c04](https://github.com/unjs/giget/commit/fe78c04))
- Migrate to tar v7 ([#250](https://github.com/unjs/giget/pull/250))
- Min libs ([407f55a](https://github.com/unjs/giget/commit/407f55a))

### 🏡 Chore

- Add h3 starter ([066750b](https://github.com/unjs/giget/commit/066750b))
- Update lockfile ([74f6674](https://github.com/unjs/giget/commit/74f6674))
- Update deps ([0aacff9](https://github.com/unjs/giget/commit/0aacff9))
- Update lockfile ([5916942](https://github.com/unjs/giget/commit/5916942))
- Fix type issue ([5c9b19f](https://github.com/unjs/giget/commit/5c9b19f))

### 🤖 CI

- Run on windows ([#249](https://github.com/unjs/giget/pull/249))

#### ⚠️ Breaking Changes

- ⚠️  Zero dependency ([#248](https://github.com/unjs/giget/pull/248))

### ❤️ Contributors

- Pooya Parsa ([@pi0](https://github.com/pi0))
- Eugene ([@outslept](https://github.com/outslept))
- Neeraj Dalal <nd941z@gmail.com>

## v2.0.0

[compare changes](https://github.com/unjs/giget/compare/v1.2.5...v2.0.0)

### 🩹 Fixes

- ⚠️  Use correct temp dir in windows for cache ([#182](https://github.com/unjs/giget/pull/182))
- Patch tar for bun on windows ([#217](https://github.com/unjs/giget/pull/217))

### 📦 Build

- ⚠️  Esm-only dist ([d708f2b](https://github.com/unjs/giget/commit/d708f2b))
- Bundle tar ([#214](https://github.com/unjs/giget/pull/214))
- Minify bundled tar dependencies ([946ea3f](https://github.com/unjs/giget/commit/946ea3f))

### 🏡 Chore

- Update ci ([96f9bb0](https://github.com/unjs/giget/commit/96f9bb0))
- Update ci ([0764410](https://github.com/unjs/giget/commit/0764410))
- Update deps ([567c304](https://github.com/unjs/giget/commit/567c304))
- Update to nypm 0.6 ([6d47921](https://github.com/unjs/giget/commit/6d47921))

#### ⚠️ Breaking Changes

- ⚠️  Use correct temp dir in windows for cache ([#182](https://github.com/unjs/giget/pull/182))
- ⚠️  Esm-only dist ([d708f2b](https://github.com/unjs/giget/commit/d708f2b))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v1.2.5

[compare changes](https://github.com/unjs/giget/compare/v1.2.4...v1.2.5)

### 🏡 Chore

- Remove unused ohash dependency ([be5888c](https://github.com/unjs/giget/commit/be5888c))
- Update dependencies ([4eab58e](https://github.com/unjs/giget/commit/4eab58e))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))

## v1.2.4

[compare changes](https://github.com/unjs/giget/compare/v1.2.3...v1.2.4)

### 💅 Refactors

- Upgrade to tar v7 ([3d5d7cf](https://github.com/unjs/giget/commit/3d5d7cf))
- Revert tar upgrade back to v6 ([#208](https://github.com/unjs/giget/pull/208))

### 📖 Documentation

- Correct function name ([#156](https://github.com/unjs/giget/pull/156))
- Add github actions example for private repo ([#197](https://github.com/unjs/giget/pull/197))

### 🏡 Chore

- **release:** V1.2.3 ([60025b5](https://github.com/unjs/giget/commit/60025b5))
- Update deps ([b518578](https://github.com/unjs/giget/commit/b518578))
- Update eslint config ([16941fc](https://github.com/unjs/giget/commit/16941fc))
- Stricter tsconfig ([6e28106](https://github.com/unjs/giget/commit/6e28106))
- Use new `onReadEntry` ([d2eb10e](https://github.com/unjs/giget/commit/d2eb10e))
- Update nypm to 0.4 ([0b4a08b](https://github.com/unjs/giget/commit/0b4a08b))
- Update deps ([4008d7c](https://github.com/unjs/giget/commit/4008d7c))
- Update deps ([5c96b19](https://github.com/unjs/giget/commit/5c96b19))
- Update deps ([6c7a965](https://github.com/unjs/giget/commit/6c7a965))
- Update deps ([c508000](https://github.com/unjs/giget/commit/c508000))
- Update nypm to 0.5 ([727c2f5](https://github.com/unjs/giget/commit/727c2f5))
- Update lock ([65a1efa](https://github.com/unjs/giget/commit/65a1efa))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Martijn Halekor <martijnhalekor@icloud.com>
- Werheng Zhang ([@werheng](http://github.com/werheng))

## v1.2.3

[compare changes](https://github.com/unjs/giget/compare/v1.2.2...v1.2.3)

### 🏡 Chore

- **release:** V1.2.2 ([cd3d4d7](https://github.com/unjs/giget/commit/cd3d4d7))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))

## v1.2.2

[compare changes](https://github.com/unjs/giget/compare/v1.2.1...v1.2.2)

### 🩹 Fixes

- **cli:** Add missing shebang ([#135](https://github.com/unjs/giget/pull/135))

### 📖 Documentation

- Correct `downloadTemplate` options ([#144](https://github.com/unjs/giget/pull/144))

### 🏡 Chore

- **release:** V1.2.1 ([1379a03](https://github.com/unjs/giget/commit/1379a03))
- Remove bundle badge ([#136](https://github.com/unjs/giget/pull/136))
- Add `maizzle` template ([#138](https://github.com/unjs/giget/pull/138))
- Update deps and lockfile ([8821ee1](https://github.com/unjs/giget/commit/8821ee1))
- Update lockfile ([a61d394](https://github.com/unjs/giget/commit/a61d394))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Sunil Pai <threepointone@gmail.com>
- Cosmin Popovici ([@cossssmin](http://github.com/cossssmin))
- Estéban ([@Barbapapazes](http://github.com/Barbapapazes))

## v1.2.1

[compare changes](https://github.com/unjs/giget/compare/v1.2.0...v1.2.1)

### 🩹 Fixes

- **cli:** Add missing shebang ([#135](https://github.com/unjs/giget/pull/135))

### 🏡 Chore

- Update badge urls ([d612198](https://github.com/unjs/giget/commit/d612198))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))

## v1.2.0

[compare changes](https://github.com/unjs/giget/compare/v1.1.3...v1.2.0)

### 🚀 Enhancements

- Support cloning from http(s) inputs ([#129](https://github.com/unjs/giget/pull/129))
- Support proxy for node.js with native fetch ([#133](https://github.com/unjs/giget/pull/133))
- Support installing dependencies ([#134](https://github.com/unjs/giget/pull/134))

### 🩹 Fixes

- **http:** Remove `text/plain` check for content type ([1945818](https://github.com/unjs/giget/commit/1945818))
- **gitlab:** Workaround hotlinking  protection (406 Not Acceptable) ([#123](https://github.com/unjs/giget/pull/123))
- **cli:** Display the current directory when cloning into current dir ([#132](https://github.com/unjs/giget/pull/132))
- Add url to undici's `fetch failed` error ([6e2455a](https://github.com/unjs/giget/commit/6e2455a))
- Create dst dir only after source successfully downloaded ([#119](https://github.com/unjs/giget/pull/119))

### 💅 Refactors

- Use citty for cli ([#113](https://github.com/unjs/giget/pull/113))
- Use `node-fetch-native/proxy` ([efa4f7a](https://github.com/unjs/giget/commit/efa4f7a))
- Add error cause for sendFetch ([174bf8d](https://github.com/unjs/giget/commit/174bf8d))

### 📖 Documentation

- Add more info about auth ([ab28a9f](https://github.com/unjs/giget/commit/ab28a9f))

### 📦 Build

- Update types exports ([150c1fe](https://github.com/unjs/giget/commit/150c1fe))

### 🏡 Chore

- **release:** V1.1.3 ([46c34ac](https://github.com/unjs/giget/commit/46c34ac))
- Update lockfile ([ead082c](https://github.com/unjs/giget/commit/ead082c))
- Simplify exports ([03053bd](https://github.com/unjs/giget/commit/03053bd))
- Update badges ([0a43d81](https://github.com/unjs/giget/commit/0a43d81))
- Add http proxy to the docs ([cde2cb8](https://github.com/unjs/giget/commit/cde2cb8))
- Update readme ([4fbc0cf](https://github.com/unjs/giget/commit/4fbc0cf))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Uncenter 
- Andreymart-test 
- Estéban ([@Barbapapazes](http://github.com/Barbapapazes))

## v1.1.3

[compare changes](https://github.com/unjs/giget/compare/v1.1.2...v1.1.3)

### 🩹 Fixes

- **github:** Use `api.github.com` for private repository support ([#93](https://github.com/unjs/giget/pull/93))
- Allow `/` in git refs ([#102](https://github.com/unjs/giget/pull/102))

### 💅 Refactors

- Apply strict typescript checks + fixes ([9704865](https://github.com/unjs/giget/commit/9704865))
- Lazy import `https-proxy-agent` ([8372e55](https://github.com/unjs/giget/commit/8372e55))

### 🏡 Chore

- Update dev dependencies ([f94bb77](https://github.com/unjs/giget/commit/f94bb77))
- Update all dependencies ([082f95b](https://github.com/unjs/giget/commit/082f95b))
- Add autofix ci ([adc0ced](https://github.com/unjs/giget/commit/adc0ced))
- Apply automated fixes ([ae68871](https://github.com/unjs/giget/commit/ae68871))
- Add `.prettierrc` ([5ea5d96](https://github.com/unjs/giget/commit/5ea5d96))

### 🎨 Styles

- Format with prettier v3 ([9fdb553](https://github.com/unjs/giget/commit/9fdb553))

### 🤖 CI

- Test with node 18 ([9f8c218](https://github.com/unjs/giget/commit/9f8c218))

### ❤️ Contributors

- Nick-genesis 
- Pooya Parsa ([@pi0](http://github.com/pi0))
- Ishan Jain <contact@ishanjain.me>

## v1.1.2

[compare changes](https://github.com/unjs/giget/compare/v1.1.1...v1.1.2)


### 🩹 Fixes

  - Provide empty object for headers ([#83](https://github.com/unjs/giget/pull/83))

### ❤️  Contributors

- Daniel Roe <daniel@roe.dev>

## v1.1.1

[compare changes](https://github.com/unjs/giget/compare/v1.1.0...v1.1.1)


### 🩹 Fixes

  - Normalize fetch headers ([#82](https://github.com/unjs/giget/pull/82))

### 🏡 Chore

  - Update deps ([62e0504](https://github.com/unjs/giget/commit/62e0504))

### ❤️  Contributors

- Pooya Parsa <pooya@pi0.io>

## v1.1.0

[compare changes](https://github.com/unjs/giget/compare/v1.0.0...v1.1.0)


### 🚀 Enhancements

  - Support `GIGET_GITHUB_URL` and `GIGET_GITLAB_URL` env variables ([#71](https://github.com/unjs/giget/pull/71))

### 🩹 Fixes

  - Respect `XDG_CACHE_HOME` environment variable ([#31](https://github.com/unjs/giget/pull/31))
  - Cli name typo in usage ([#63](https://github.com/unjs/giget/pull/63))
  - Pass auth to custom registry ([#77](https://github.com/unjs/giget/pull/77))

### 📖 Documentation

  - Dir is part of options not standalone argument ([#80](https://github.com/unjs/giget/pull/80))

### 🏡 Chore

  - Fix typos ([#50](https://github.com/unjs/giget/pull/50))
  - Update dependencies ([fc51e23](https://github.com/unjs/giget/commit/fc51e23))
  - Switch to changelogen for release ([accb900](https://github.com/unjs/giget/commit/accb900))
  - Add .prettierignore ([37bb7f8](https://github.com/unjs/giget/commit/37bb7f8))

### 🎨 Styles

  - Format with prettier ([02d2661](https://github.com/unjs/giget/commit/02d2661))

### ❤️  Contributors

- Pooya Parsa <pooya@pi0.io>
- Hanzoz <hanzoz@gmail.com>
- Christian Preston <christianpreston@ymail.com>
- Peter <peter.placzek1996@gmail.com>
- Marvin-j97 
- Burner

## [1.0.0](https://github.com/unjs/giget/compare/v0.1.7...v1.0.0) (2022-11-15)


### Features

* add `stacks` template ([#22](https://github.com/unjs/giget/issues/22)) ([663acff](https://github.com/unjs/giget/commit/663acff2e58ce6abcb4fb706de59e637478a2fd2))
* support http proxy ([#24](https://github.com/unjs/giget/issues/24)) ([e579a2f](https://github.com/unjs/giget/commit/e579a2f5347356f3abed42459a90199adcc2df52))

### [0.1.7](https://github.com/unjs/giget/compare/v0.1.6...v0.1.7) (2022-09-19)


### Bug Fixes

* use non-promise version of pipeline for node 14 support ([#18](https://github.com/unjs/giget/issues/18)) ([822fe2d](https://github.com/unjs/giget/commit/822fe2d02bc3fa9c7ac129c226483fb9790720e7))

### [0.1.6](https://github.com/unjs/giget/compare/v0.1.5...v0.1.6) (2022-09-14)


### Features

* add sourcehut provider ([#15](https://github.com/unjs/giget/issues/15)) ([aa21643](https://github.com/unjs/giget/commit/aa216438da402d16f3f686ae1d6571fee33e8c51))
* support `GIGET_REGISTRTY` and `GIGET_AUTH` environment variables ([8cfabff](https://github.com/unjs/giget/commit/8cfabff84da31e5597a817b101126227672dbfdb))
* support authotization (resolves [#12](https://github.com/unjs/giget/issues/12)) ([8853342](https://github.com/unjs/giget/commit/88533428f239da561f1ada31b68127c746d1837a))
* support cwd ([9e1a34a](https://github.com/unjs/giget/commit/9e1a34adfebe5b45b254f34a3ab5bd73ad83cdbb))


### Bug Fixes

* fix type for `downloadTemplate` to return template info params ([24e34d4](https://github.com/unjs/giget/commit/24e34d4d31880896935e26dc7e06eb78ffb758e6))
* subdir filter for dirs with shared prefix ([#14](https://github.com/unjs/giget/issues/14)) ([c6ab563](https://github.com/unjs/giget/commit/c6ab5634f2824dafe02bff19426fecadba2e0619))

### [0.1.5](https://github.com/unjs/giget/compare/v0.1.4...v0.1.5) (2022-09-10)


### Bug Fixes

* **cli:** `--registry` is string ([00447d8](https://github.com/unjs/giget/commit/00447d8ee1f25c4ef3160f1f1b887f5d6a4919fc))

### [0.1.4](https://github.com/unjs/giget/compare/v0.1.3...v0.1.4) (2022-09-10)


### Features

* `defaultDir` ([e4e82a0](https://github.com/unjs/giget/commit/e4e82a015326a462fac123bcbcb95adc037c3452))

### [0.1.3](https://github.com/unjs/giget/compare/v0.1.2...v0.1.3) (2022-09-10)

### [0.1.2](https://github.com/unjs/giget/compare/v0.1.1...v0.1.2) (2022-09-10)


### Features

* **cli:** support `--verbose` ([f7cc6e6](https://github.com/unjs/giget/commit/f7cc6e653cc3d4c5c0e6f8837908e97aed4def04))


### Bug Fixes

* handle subdir for git providers ([f4d39d2](https://github.com/unjs/giget/commit/f4d39d23403c2e83ef925f7575aac625b13021e0))

### [0.1.1](https://github.com/unjs/giget/compare/v0.1.0...v0.1.1) (2022-09-10)


### Features

* expose `registryProvider` ([2d84d26](https://github.com/unjs/giget/commit/2d84d2667100710498f841a8ce296c0618f5d361))


### Bug Fixes

* allow dash and dot in input strings ([c322521](https://github.com/unjs/giget/commit/c322521bb86a556e6ef499beab601e70b4d571d5))

## [0.1.0](https://github.com/unjs/giget/compare/v0.0.4...v0.1.0) (2022-09-09)


### ⚠ BREAKING CHANGES

* custom template provider support

### Features

* custom template provider support ([9678b98](https://github.com/unjs/giget/commit/9678b98de2119daacac34b7c59ae604373e0c9e1))
* template registry ([ce75c25](https://github.com/unjs/giget/commit/ce75c25e54e663ee1e8a29c529ae176790fefc01))


### Bug Fixes

* allow empty dir ([bc4ba5e](https://github.com/unjs/giget/commit/bc4ba5e06047f845270876257b9ea1a7fcddd77f))
* fix provider regex matcher ([3353d02](https://github.com/unjs/giget/commit/3353d02fcedb9e5af5c0a42aaba9f7267b22286f))
* update cli ([61e4943](https://github.com/unjs/giget/commit/61e4943d36884e478adb8ff0e3b10b2ff3c7bd35))
* use github cdn for now ([da327b5](https://github.com/unjs/giget/commit/da327b5a602fa542360b0d2b7588d520c4177dff))

### [0.0.4](https://github.com/unjs/giget/compare/v0.0.3...v0.0.4) (2022-09-08)


### Features

* add experimental `--shell` (resolves [#2](https://github.com/unjs/giget/issues/2)) ([a04fc53](https://github.com/unjs/giget/commit/a04fc538197e03490daa6b6c5ce8bd0c72139f20))


### Bug Fixes

* output directory is optional ([#5](https://github.com/unjs/giget/issues/5)) ([50035ef](https://github.com/unjs/giget/commit/50035ef68bbbc17d731a3374b9e6db246a6410c4))

### [0.0.3](https://github.com/unjs/giget/compare/v0.0.2...v0.0.3) (2022-09-08)

### [0.0.2](https://github.com/unjs/giget/compare/v0.0.1...v0.0.2) (2022-09-08)


### Features

* force and force-clean options ([8b0c4d6](https://github.com/unjs/giget/commit/8b0c4d6087cda65c941d53c1b004ea7e96fe04e7))
* generate git url to open in browser ([7220de2](https://github.com/unjs/giget/commit/7220de2b48026dfa3ee824591bfa894da753a0b4))
* offline and prefer-offline ([623c34c](https://github.com/unjs/giget/commit/623c34ce8fd8a1ec31218c2c5051affc1822415a))


### Bug Fixes

* fix normalized source to include path filter leading slash ([b28bdcb](https://github.com/unjs/giget/commit/b28bdcb2b9e5d5fc9c5ac9094f99d3156c17b023))

### 0.0.1 (2022-09-08)


### Features

* implement network fallback ([9d92c9a](https://github.com/unjs/giget/commit/9d92c9af47c3dc01b7881784a65e05bd85fa3f50))


### Bug Fixes

* use org-name for default dir ([c7cfa93](https://github.com/unjs/giget/commit/c7cfa9385888a7fa8be51a6eaeb6fe96f0ceaeb8))
