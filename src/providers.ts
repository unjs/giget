import type { TemplateProvider } from './types'
import { parseGitURI } from './_utils'

export const github: TemplateProvider = (input, opts) => {
  const parsed = parseGitURI(input)
  return {
    name: parsed.repo.replace('/', '-'),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: { Authorization: opts.auth ? `Bearer ${opts.auth}` : undefined },
    url: `https://github.com/${parsed.repo}/tree/${parsed.ref}${parsed.subdir}`,
    tar: `https://github.com/${parsed.repo}/archive/${parsed.ref}.tar.gz`
  }
}

export const gitlab: TemplateProvider = (input, opts) => {
  const parsed = parseGitURI(input)
  return {
    name: parsed.repo.replace('/', '-'),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: { Authorization: opts.auth ? `Bearer ${opts.auth}` : undefined },
    url: `https://gitlab.com/${parsed.repo}/tree/${parsed.ref}${parsed.subdir}`,
    tar: `https://gitlab.com/${parsed.repo}/-/archive/${parsed.ref}.tar.gz`
  }
}

export const bitbucket: TemplateProvider = (input, opts) => {
  const parsed = parseGitURI(input)
  return {
    name: parsed.repo.replace('/', '-'),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: { Authorization: opts.auth ? `Bearer ${opts.auth}` : undefined },
    url: `https://bitbucket.com/${parsed.repo}/src/${parsed.ref}${parsed.subdir}`,
    tar: `https://bitbucket.org/${parsed.repo}/get/${parsed.ref}.tar.gz`
  }
}

export const sourcehut: TemplateProvider = (input, opts) => {
  const parsed = parseGitURI(input)
  return {
    name: parsed.repo.replace('/', '-'),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: { Authorization: opts.auth ? `Bearer ${opts.auth}` : undefined },
    url: `https://git.sr.ht/~${parsed.repo}/tree/${parsed.ref}/item${parsed.subdir}`,
    tar: `https://git.sr.ht/~${parsed.repo}/archive/${parsed.ref}.tar.gz`
  }
}

export const providers: Record<string, TemplateProvider> = {
  github,
  gh: github,
  gitlab,
  bitbucket,
  sourcehut
}
