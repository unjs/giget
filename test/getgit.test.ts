import { existsSync } from 'fs'
import { rm, mkdir } from 'fs/promises'
import { expect, it, describe, beforeAll } from 'vitest'
import { resolve } from 'pathe'
import { downloadRepo } from '../src'

describe('downloadRepo', () => {
  beforeAll(async () => {
    await rm(resolve(__dirname, '.tmp'), { recursive: true, force: true })
  })

  it('clone unjs/template', async () => {
    const dstDir = resolve(__dirname, '.tmp/cloned')
    const { dir } = await downloadRepo('unjs/template', dstDir, { preferOffline: true })
    expect(await existsSync(resolve(dir, 'package.json')))
  })

  it('do not clone to exisiting dir', async () => {
    const dstDir = resolve(__dirname, '.tmp/exisiting')
    await mkdir(dstDir).catch(() => {})
    await expect(downloadRepo('unjs/template', dstDir)).rejects.toThrow('already exists')
  })
})
