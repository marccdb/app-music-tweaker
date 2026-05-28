import { execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const platformTargetByOs = {
  linux: '--linux',
  darwin: '--mac',
  win32: '--win',
}

const targetFlag = process.env.PACKAGE_SMOKE_TARGET || platformTargetByOs[process.platform]
if (!targetFlag) {
  console.error(`Unsupported platform for package smoke: ${process.platform}`)
  process.exit(1)
}

const electronBuilderCli = path.resolve('node_modules', 'electron-builder', 'cli.js')
const args = ['--dir', '--publish', 'never', '--config.compression=store', targetFlag]

console.log(`Running package smoke: ${process.execPath} ${electronBuilderCli} ${args.join(' ')}`)
execFileSync(process.execPath, [electronBuilderCli, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: process.env.CSC_IDENTITY_AUTO_DISCOVERY ?? 'false',
  },
})
