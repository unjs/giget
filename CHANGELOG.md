# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
