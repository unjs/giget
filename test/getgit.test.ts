import { existsSync } from 'fs'
import { rm, mkdir, writeFile } from 'fs/promises'
import { expect, it, describe, beforeAll } from 'vitest'
import { resolve } from 'pathe'
import { downloadTemplate } from '../src'

describe('downloadTemplate', () => {
  beforeAll(async () => {
    await rm(resolve(__dirname, '.tmp'), { recursive: true, force: true })
  })

  it('clone unjs/template', async () => {
    const dstDir = resolve(__dirname, '.tmp/cloned')
    const { dir } = await downloadTemplate('gh:unjs/template', { dir: dstDir, preferOffline: true })
    expect(await existsSync(resolve(dir, 'package.json')))
  })

  it('do not clone to exisiting dir', async () => {
    const dstDir = resolve(__dirname, '.tmp/exisiting')
    await mkdir(dstDir).catch(() => {})
    await writeFile(resolve(dstDir, 'test.txt'), 'test')
    await expect(downloadTemplate('gh:unjs/template', { dir: dstDir })).rejects.toThrow('already exists')
  })
})
