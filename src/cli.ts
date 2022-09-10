#!/usr/bin/env node
import { relative } from 'node:path'
import mri from 'mri'
import { cyan } from 'colorette'
import { downloadTemplate } from './giget'
import { startShell } from './_utils'

async function main () {
  const args = mri(process.argv.slice(2), {
    boolean: ['help', 'force', 'force-clean', 'offline', 'prefer-offline', 'shell', 'registry', 'verbose']
  })

  const input = args._[0]
  const dir = args._[1]

  if (!input || args.help || args.h) {
    console.error('Usage: npx getgit@latest <input> [<dir>] [--force] [--force-clean] [--offline] [--prefer-offline] [--shell] [--registry]  [--no-registry] [--verbose]')
    process.exit(1)
  }

  if (args.verbose) {
    process.env.DEBUG = process.env.DEBUG || 'true'
  }

  const r = await downloadTemplate(input, {
    dir,
    force: args.force,
    forceClean: args['force-clean'],
    offline: args.offline,
    registry: args.registry
  })

  console.log(`✨ Successfully cloned ${cyan(r.name || r.url)} to ${cyan(relative(process.cwd(), r.dir))}\n`)

  if (args.shell) {
    startShell(r.dir)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
