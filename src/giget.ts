import { mkdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { existsSync } from 'node:fs'
import { extract } from 'tar'
import { resolve, dirname } from 'pathe'
import { parseInput, getUrl, getTarUrl, download } from './_utils'
import type { GitInfo } from './types'

export interface DownloadRepoOptions extends Partial<GitInfo> {
  force?: boolean
  forceClean?: boolean
  offline?: boolean
  preferOffline?: boolean
}

function debug (...args) {
  if (process.env.DEBUG) {
    console.debug('[giget]', ...args)
  }
}

export async function downloadRepo (input: string, dir?: string, _opts: DownloadRepoOptions = {}) {
  const parsed = parseInput(input)
  const opts = { ...parsed, ..._opts }

  const extractPath = resolve(dir || opts.repo.replace('/', '-'))
  if (opts.forceClean) {
    await rm(extractPath, { recursive: true, force: true })
  }
  if (!opts.force && existsSync(extractPath)) {
    throw new Error(`Destination ${extractPath} already exists.`)
  }
  await mkdir(extractPath, { recursive: true })

  const tmpDir = resolve(homedir(), '.giget', opts.provider, opts.repo)
  const tarPath = resolve(tmpDir, opts.ref + '.tar.gz')

  if (opts.preferOffline && existsSync(tarPath)) {
    opts.offline = true
  }
  if (!opts.offline) {
    await mkdir(dirname(tarPath), { recursive: true })
    const tarUrl = getTarUrl(opts)
    const s = Date.now()
    await download(tarUrl, tarPath).catch((err) => {
      if (!existsSync(tarPath)) {
        throw err
      }
      // Accept netwrok errors if we have a cached version
      debug('Download error. Using cached version:', err)
      opts.offline = true
    })
    debug(`Downloaded ${tarUrl} to ${tarPath} in ${Date.now() - s}ms`)
  }

  if (!existsSync(tarPath)) {
    throw new Error(`Tarball not found: ${tarPath} (offline: ${opts.offline})`)
  }

  const s = Date.now()
  const subdir = opts.subdir.replace(/^\//, '')
  await extract({
    file: tarPath,
    cwd: extractPath,
    onentry (entry) {
      entry.path = entry.path.split('/').splice(1).join('/')
      if (subdir) {
        if (entry.path.startsWith(subdir)) {
          // Rewrite path
          entry.path = entry.path.substring(subdir.length)
        } else {
          // Skip
          entry.path = ''
        }
      }
    }
  })
  debug(`Extracted to ${extractPath} in ${Date.now() - s}ms`)

  return {
    source: `${opts.provider}:${opts.repo}${subdir ? `/${subdir}` : ''}#${opts.ref}`,
    url: getUrl(opts),
    dir: extractPath
  }
}
