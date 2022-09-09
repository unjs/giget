import { expect, it, describe } from 'vitest'
import { parseGitURI } from '../src/_utils'

describe('parseGitURI', () => {
  const defaults = { repo: 'org/repo', provider: 'github', subdir: '/', ref: 'main' }
  const tests = [
    { input: 'org/repo', output: {} },
    { input: 'org/repo#ref', output: { ref: 'ref' } },
    { input: 'org/repo/foo/bar', output: { subdir: '/foo/bar' } }
  ]

  for (const test of tests) {
    it(test.input, () => {
      expect(parseGitURI(test.input)).toMatchObject({ ...defaults, ...test.output })
    })
  }
})
