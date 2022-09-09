import { mkdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { existsSync, readdirSync } from 'node:fs'
import { extract } from 'tar'
import { resolve, dirname } from 'pathe'
import { download, debug } from './_utils'
import { providers } from './providers'
import { createRegistryProvider } from './registry'
import type { TemplateProvider } from './types'

export interface DownloadTemplateOptions {
  provider?: string
  force?: boolean
  forceClean?: boolean
  offline?: boolean
  preferOffline?: boolean
  providers?: Record<string, TemplateProvider>
  dir?: string
  registry?: false | string
}

const sourceProtoRe = /^(\w):\/\//

export async function downloadTemplate (input: string, opts: DownloadTemplateOptions = {}) {
  const registryProvider = opts.registry !== false ? createRegistryProvider(opts.registry) : null
  let providerName: string = opts.provider || (registryProvider ? 'registry' : 'github')
  let source: string = input
  const sourceProvierMatch = input.match(sourceProtoRe)
  if (sourceProvierMatch) {
    providerName = sourceProvierMatch[1]
    source = input.substring(sourceProvierMatch[0].length)
  }

  const provider = opts.providers?.[providerName] || providers[providerName] || registryProvider
  if (!provider) {
    throw new Error(`Unsupported provider: ${providerName}`)
  }
  const template = await provider(source).catch((err) => {
    throw new Error(`Failed to download template from ${providerName}: ${err.message}`)
  })
  template.name = template.name.replace(/[^a-zA-Z0-9-]/g, '-')

  const extractPath = resolve(opts.dir || template.name)
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
    await download(template.tar, tarPath).catch((err) => {
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
    ...template,
    source,
    dir: extractPath
  }
}
