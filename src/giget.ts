import { mkdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { existsSync, readdirSync } from 'node:fs'
import { extract } from 'tar'
import { resolve, dirname } from 'pathe'
import { defu } from 'defu'
import { download, debug } from './_utils'
import { providers } from './providers'
import { registryProvider } from './registry'
import type { TemplateInfo, TemplateProvider } from './types'

export interface DownloadTemplateOptions {
  provider?: string
  force?: boolean
  forceClean?: boolean
  offline?: boolean
  preferOffline?: boolean
  providers?: Record<string, TemplateProvider>
  dir?: string
  registry?: false | string
  cwd?: string
  auth?: string
}

const sourceProtoRe = /^([\w-.]+):/

export type DownloadTemplateResult = Omit<TemplateInfo, 'dir' | 'source'> & { dir: string, source: string }

export async function downloadTemplate (input: string, opts: DownloadTemplateOptions = {}): Promise<DownloadTemplateResult> {
  opts = defu({
    registry: process.env.GIGET_REGISTRY,
    auth: process.env.GIGET_AUTH
  }, opts)

  const registry = opts.registry !== false ? registryProvider(opts.registry) : null
  let providerName: string = opts.provider || (registryProvider ? 'registry' : 'github')
  let source: string = input
  const sourceProvierMatch = input.match(sourceProtoRe)
  if (sourceProvierMatch) {
    providerName = sourceProvierMatch[1]
    source = input.substring(sourceProvierMatch[0].length)
  }

  const provider = opts.providers?.[providerName] || providers[providerName] || registry
  if (!provider) {
    throw new Error(`Unsupported provider: ${providerName}`)
  }
  const template = await Promise.resolve().then(() => provider(source, { auth: opts.auth })).catch((err) => {
    throw new Error(`Failed to download template from ${providerName}: ${err.message}`)
  })

  // Sanetize name and defaultDir
  template.name = (template.name || 'template').replace(/[^a-z0-9-]/gi, '-')
  template.defaultDir = (template.defaultDir || template.name).replace(/[^a-z0-9-]/gi, '-')

  const cwd = resolve(opts.cwd || '.')
  const extractPath = resolve(cwd, opts.dir || template.defaultDir)
  if (opts.forceClean) {
    await rm(extractPath, { recursive: true, force: true })
  }
  if (!opts.force && existsSync(extractPath) && readdirSync(extractPath).length) {
    throw new Error(`Destination ${extractPath} already exists.`)
  }
  await mkdir(extractPath, { recursive: true })

  const tmpDir = resolve(homedir(), '.giget', opts.provider, template.name)
  const tarPath = resolve(tmpDir, (template.version || template.name) + '.tar.gz')

  if (opts.preferOffline && existsSync(tarPath)) {
    opts.offline = true
  }
  if (!opts.offline) {
    await mkdir(dirname(tarPath), { recursive: true })
    const s = Date.now()
    await download(template.tar, tarPath, { headers: template.headers }).catch((err) => {
      if (!existsSync(tarPath)) {
        throw err
      }
      // Accept netwrok errors if we have a cached version
      debug('Download error. Using cached version:', err)
      opts.offline = true
    })
    debug(`Downloaded ${template.tar} to ${tarPath} in ${Date.now() - s}ms`)
  }

  if (!existsSync(tarPath)) {
    throw new Error(`Tarball not found: ${tarPath} (offline: ${opts.offline})`)
  }

  const s = Date.now()
  const subdir = template.subdir?.replace(/^\//, '') || ''
  await extract({
    file: tarPath,
    cwd: extractPath,
    onentry (entry) {
      entry.path = entry.path.split('/').splice(1).join('/')
      if (subdir) {
        if (entry.path.startsWith(subdir + '/')) {
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
    ...template,
    source,
    dir: extractPath
  }
}
