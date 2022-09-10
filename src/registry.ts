import fetch from 'node-fetch-native'
import type { TemplateInfo, TemplateProvider } from './types'
import { debug } from './_utils'

// const DEFAULT_REGISTRY = 'https://cdn.jsdelivr.net/gh/unjs/giget/templates'
const DEFAULT_REGISTRY = 'https://raw.githubusercontent.com/unjs/giget/main/templates'

export const registryProvider = (registryEndpoint: string = DEFAULT_REGISTRY) => {
  return <TemplateProvider>(async (input) => {
    const start = Date.now()
    const registryURL = `${registryEndpoint}/${input}.json`
    const res = await fetch(registryURL)
    if (res.status >= 400) {
      throw new Error(`Failed to download ${input} template info from ${registryURL}: ${res.status} ${res.statusText}`)
    }
    const info = await res.json() as TemplateInfo
    if (!info.tar || !info.name) {
      throw new Error(`Invalid template info from ${registryURL}. name or tar fields are missing!`)
    }
    debug(`Fetched ${input} template info from ${registryURL} in ${Date.now() - start}ms`)
    return info
  })
}
