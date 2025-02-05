import { beforeEach, describe, expect, test } from "vitest";
import { git } from "../src/providers";

describe('provider: git', () => {
  beforeEach(() => {
    delete process.env.GIGET_GIT_USERNAME
    delete process.env.GIGET_GIT_PASSWORD
  })

  test('default git URL', async () => {
    const input = 'git@github.com:unjs/template.git'

    expect(await git(input, {})).toEqual({
      name: 'github.com-unjs-template',
      git: 'git@github.com:unjs/template.git'
    })
  })

  test('.git does not matter in git URL, but remove it from name', async () => {
    const input = 'git@github.com:unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'github.com-unjs-template',
      git: 'git@github.com:unjs/template'
    })
  })

  test('Provide git@ user if not provided', async () => {
    const input = 'github.com:unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'github.com-unjs-template',
      git: 'git@github.com:unjs/template'
    })
  })

  test('Use GIGET_GIT_USERNAME instead of git if provided', async () => {
    process.env.GIGET_GIT_USERNAME = 'custom-git-user'

    const input = 'github.com:unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'github.com-unjs-template',
      git: 'custom-git-user@github.com:unjs/template'
    })
  })

  test('Use GIGET_GIT_PASSWORD if provided', async () => {
    process.env.GIGET_GIT_USERNAME = 'custom-git-user'
    process.env.GIGET_GIT_PASSWORD = 'custom-git-password'

    const input = 'github.com:unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'github.com-unjs-template',
      git: 'custom-git-user:custom-git-password@github.com:unjs/template'
    })
  })

  test('Add github.com host if host is github:', async () => {
    const input = 'github:unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'github.com-unjs-template',
      git: 'git@github.com:unjs/template'
    })
  })

  test('Add github.com host if host is gh:', async () => {
    const input = 'gh:unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'github.com-unjs-template',
      git: 'git@github.com:unjs/template'
    })
  })

  test('Add github.com host if host is not provided', async () => {
    const input = 'unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'github.com-unjs-template',
      git: 'git@github.com:unjs/template'
    })
  })

  test('Use GIGET_GIT_HOST instead of github.com if host is not provided', async () => {
    process.env.GIGET_GIT_HOST = 'git.mycompany.com'

    const input = 'unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'git.mycompany.com-unjs-template',
      git: 'git@git.mycompany.com:unjs/template'
    })
  })

  test('Add gitlab.com host if host is gitlab:', async () => {
    const input = 'gitlab:unjs/template'

    expect(await git(input, {})).toEqual({
      name: 'gitlab.com-unjs-template',
      git: 'git@gitlab.com:unjs/template'
    })
  })

  test('Add version ref if provided', async () => {
    const input = 'gitlab:unjs/template#abcd1234'

    expect(await git(input, {})).toEqual({
      name: 'gitlab.com-unjs-template',
      git: 'git@gitlab.com:unjs/template',
      version: 'abcd1234'
    })
  })
})
