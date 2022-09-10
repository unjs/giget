import type { TemplateProvider } from './types'
import { parseGitURI } from './_utils'

export const github: TemplateProvider = (input) => {
  const parsed = parseGitURI(input)
  return {
    name: parsed.repo.replace('/', '-'),
    version: parsed.ref,
    subdir: parsed.subdir,
    url: `https://github.com/${parsed.repo}/tree/${parsed.ref}${parsed.subdir}`,
    tar: `https://github.com/${parsed.repo}/archive/${parsed.ref}.tar.gz`
  }
}

export const gitlab: TemplateProvider = (input) => {
  const parsed = parseGitURI(input)
  return {
    name: parsed.repo.replace('/', '-'),
    version: parsed.ref,
    subdir: parsed.subdir,
    url: `https://gitlab.com/${parsed.repo}/tree/${parsed.ref}${parsed.subdir}`,
    tar: `https://gitlab.com/${parsed.repo}/-/archive/${parsed.ref}.tar.gz`
  }
}

export const bitbucket: TemplateProvider = (input) => {
  const parsed = parseGitURI(input)
  return {
    name: parsed.repo.replace('/', '-'),
    version: parsed.ref,
    subdir: parsed.subdir,
    url: `https://bitbucket.com/${parsed.repo}/src/${parsed.ref}${parsed.subdir}`,
    tar: `https://bitbucket.org/${parsed.repo}/get/${parsed.ref}.tar.gz`
  }
}

export const providers: Record<string, TemplateProvider> = {
  github,
  gh: github,
  gitlab,
  bitbucket
}
