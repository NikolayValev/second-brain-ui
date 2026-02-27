import { spawn } from 'node:child_process'

const defaultProdURL = 'https://secondbrain.nikolayvalev.com'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || defaultProdURL

async function looksLikeBackendUrl() {
  try {
    const [health, apiHealth] = await Promise.all([
      fetch(`${baseURL.replace(/\/$/, '')}/health`, { redirect: 'follow' }),
      fetch(`${baseURL.replace(/\/$/, '')}/api/health`, { redirect: 'follow' }),
    ])

    const healthJson = health.headers.get('content-type')?.includes('application/json')
      ? await health.json().catch(() => null)
      : null

    const isBackendHealth =
      health.status === 200 &&
      healthJson &&
      typeof healthJson === 'object' &&
      'status' in healthJson

    const apiHealthWorks = apiHealth.status === 200
    return Boolean(isBackendHealth && !apiHealthWorks)
  } catch {
    return false
  }
}

if (await looksLikeBackendUrl()) {
  console.error(`PLAYWRIGHT_BASE_URL appears to be a backend API URL: ${baseURL}`)
  console.error('Use a deployed frontend URL for E2E browser tests.')
  console.error('For backend checks, run: npm run test:live')
  process.exit(1)
}

process.env.PLAYWRIGHT_BASE_URL = baseURL

const npxCommand = process.platform === 'win32' ? 'cmd.exe' : 'npx'
const npxArgs =
  process.platform === 'win32'
    ? ['/c', 'npx', 'playwright', 'test', 'e2e/deployed-smoke.spec.ts']
    : ['playwright', 'test', 'e2e/deployed-smoke.spec.ts']
const child = spawn(npxCommand, npxArgs, {
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
