import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { fetch } from 'node-fetch-native'
import type { GitInfo } from './types'

export function getTarUrl (opts: GitInfo) {
  if (opts.provider === 'github') {
    return `https://github.com/${opts.repo}/archive/${opts.ref}.tar.gz`
  }
  if (opts.provider === 'gitlab') {
    return `https://gitlab.com/${opts.repo}/-/archive/${opts.ref}.tar.gz`
  }
  if (opts.provider === 'bitbucket') {
    return `https://bitbucket.org/${opts.repo}/get/${opts.ref}.tar.gz`
  }
}

export function getUrl (opts: GitInfo) {
  if (opts.provider === 'github') {
    return `https://github.com/${opts.repo}/tree/${opts.ref}${opts.subdir}`
  }
  if (opts.provider === 'gitlab') {
    return `https://gitlab.com/${opts.repo}/tree/${opts.ref}${opts.subdir}`
  }
  if (opts.provider === 'bitbucket') {
    return `https://bitbucket.com/${opts.repo}/src/${opts.ref}${opts.subdir}`
  }
}

export async function download (url: string, filePath: string) {
  const res = await fetch(url)
  const stream = createWriteStream(filePath)
  if (res.status >= 400) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`)
  }
  await pipeline(res.body as any, stream)
}

const inputRegex = /^(?<provider>[^:]+:)?(?<repo>\w+\/\w+)(?<subdir>[^#]+)?(?<ref>#\w+)?/

export function parseInput (input: string): GitInfo {
  const m = input.match(inputRegex)?.groups
  return <GitInfo> {
    provider: m.provider ? m.provider.substring(0, m.provider.length - 1) : 'github',
    repo: m.repo,
    subdir: m.subdir || '/',
    ref: m.ref ? m.ref.substring(1) : 'main'
  }
}
