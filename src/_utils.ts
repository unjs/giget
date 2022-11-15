import { createWriteStream, existsSync } from 'node:fs'
import { pipeline } from 'node:stream'
import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { relative, resolve } from 'pathe'
import { fetch } from 'node-fetch-native'
import createHttpsProxyAgent from 'https-proxy-agent'
import type { GitInfo } from './types'

export async function download (url: string, filePath: string, opts: { headers?: Record<string, string> } = {}) {
  const infoPath = filePath + '.json'
  const info: { etag?: string } = JSON.parse(await readFile(infoPath, 'utf8').catch(() => '{}'))
  const headRes = await sendFetch(url, { method: 'HEAD', headers: opts.headers }).catch(() => null)
  const etag = headRes?.headers.get('etag')
  if (info.etag === etag && existsSync(filePath)) {
    // Already downloaded
    return
  }
  info.etag = etag

  const res = await sendFetch(url, { headers: opts.headers })
  if (res.status >= 400) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`)
  }

  const stream = createWriteStream(filePath)
  await promisify(pipeline)(res.body as any, stream)

  await writeFile(infoPath, JSON.stringify(info), 'utf8')
}

const inputRegex = /^(?<repo>[\w.-]+\/[\w.-]+)(?<subdir>[^#]+)?(?<ref>#[\w.-]+)?/

export function parseGitURI (input: string): GitInfo {
  const m = input.match(inputRegex)?.groups
  return <GitInfo> {
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

export async function sendFetch (url: string, options?: RequestInit) {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy
  const requestOptions = proxy ? { agent: createHttpsProxyAgent(proxy), ...options } : options
  return await fetch(url, requestOptions)
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
