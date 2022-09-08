import { expect, it, describe } from 'vitest'
import { parseInput } from '../src/_utils'

describe('parseInput', () => {
  const defaults = { repo: 'org/repo', provider: 'github', subdir: '/', ref: 'main' }
  const tests = [
    { input: 'org/repo', output: {} },
    { input: 'org/repo#ref', output: { ref: 'ref' } },
    { input: 'foo:org/repo', output: { provider: 'foo' } },
    { input: 'org/repo/foo/bar', output: { subdir: '/foo/bar' } },
    { input: 'foo:org/repo/foo/bar#ref', output: { provider: 'foo', subdir: '/foo/bar', ref: 'ref' } }
  ]

  for (const test of tests) {
    it(test.input, () => {
      expect(parseInput(test.input)).toMatchObject({ ...defaults, ...test.output })
    })
  }
})
