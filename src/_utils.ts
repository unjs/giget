import { createWriteStream, existsSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'pathe'
import { fetch } from 'node-fetch-native'
import type { GitInfo } from './types'

export async function download (url: string, filePath: string) {
  const infoPath = filePath + '.json'
  const info: { etag?: string } = JSON.parse(await readFile(infoPath, 'utf8').catch(() => '{}'))
  const headRes = await fetch(url, { method: 'HEAD' }).catch(() => null)
  const etag = headRes?.headers.get('etag')
  if (info.etag === etag && existsSync(filePath)) {
    // Already downloaded
    return
  }
  info.etag = etag

  const res = await fetch(url)
  if (res.status >= 400) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`)
  }

  const stream = createWriteStream(filePath)
  await pipeline(res.body as any, stream)

  await writeFile(infoPath, JSON.stringify(info), 'utf8')
}

const inputRegex = /^(?<repo>\w+\/\w+)(?<subdir>[^#]+)?(?<ref>#\w+)?/

export function parseGitURI (input: string): GitInfo {
  const m = input.match(inputRegex)?.groups
  return <GitInfo> {
    provider: m.provider ? m.provider.substring(0, m.provider.length - 1) : 'github',
    repo: m.repo,
    subdir: m.subdir || '/',
    ref: m.ref ? m.ref.substring(1) : 'main'
  }
}

export function debug (...args) {
  if (process.env.DEBUG) {
    console.debug('[giget]', ...args)
  }
}

// -- Experimental --

export function currentShell () {
  if (process.env.SHELL) {
    return process.env.SHELL
  }
  if (process.platform === 'win32') {
    return 'cmd.exe'
  }
  return '/bin/bash'
}

export function startShell (cwd: string) {
  cwd = resolve(cwd)
  const shell = currentShell()
  console.info(`(experimental) Opening shell in ${relative(process.cwd(), cwd)}...`)
  spawnSync(shell, [], {
    cwd,
    shell: true,
    stdio: 'inherit'
  })
}
