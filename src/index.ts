import os from 'node:os'
import path from 'node:path'
import * as core from '@actions/core'
import * as io from '@actions/io'
import { configureWallet } from './configure-wallet.ts'
import { ensureSuiInstalled } from './ensure-sui-installed.ts'
import { resolvePlatformSpec } from './platform.ts'

const SUPPORTED_NETWORKS = new Set(['mainnet', 'testnet'])
const DEFAULT_VERSION_BY_NETWORK: Record<string, string> = {
  mainnet: 'mainnet-v1.69.2',
  testnet: 'testnet-v1.70.1',
}

async function main(): Promise<void> {
  const network = core.getInput('network') || 'testnet'
  const privateKey = core.getInput('private_key')

  if (!SUPPORTED_NETWORKS.has(network)) {
    throw new Error(
      `Unsupported network '${network}'. Supported values are: mainnet, testnet.`
    )
  }

  const version = core.getInput('version') || DEFAULT_VERSION_BY_NETWORK[network]

  const installDir = path.join(os.homedir(), '.local', 'bin')
  const { binaryName } = resolvePlatformSpec()
  const suiBinPath = path.join(installDir, binaryName)

  await io.mkdirP(installDir)
  core.addPath(installDir)

  await ensureSuiInstalled(version, installDir, suiBinPath)

  if (privateKey) {
    await configureWallet(network, privateKey)
  } else {
    core.warning(
      'private_key input is empty; installed Sui CLI only and skipped wallet configuration.'
    )
  }
}

try {
  await main()
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : String(error))
}
