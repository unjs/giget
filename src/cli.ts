#!/usr/bin/env node
import { relative } from 'node:path'
import mri from 'mri'
import { cyan } from 'colorette'
import { downloadRepo } from './giget'

async function main () {
  const args = mri(process.argv.slice(2))

  const input = args._[0]
  const dst = args._[1]
  if (!input) {
    console.error('Usage: npx getgit@latest <input> [<dst>]')
    process.exit(1)
  }

  const { source, dir } = await downloadRepo(input, dst)
  console.log(`✨ Successfully cloned ${cyan(source)} to ${cyan(relative(process.cwd(), dir))}\n`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
