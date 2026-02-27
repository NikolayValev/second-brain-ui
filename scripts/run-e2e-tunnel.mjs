import { spawn } from 'node:child_process'
import { once } from 'node:events'
import localtunnel from 'localtunnel'

function run(command, args, options = {}) {
  if (process.platform === 'win32' && (command === 'npm' || command === 'npx')) {
    return spawn('cmd.exe', ['/c', command, ...args], {
      stdio: 'inherit',
      shell: false,
      ...options,
    })
  }

  return spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  })
}

async function waitForHttp(url, timeoutMs = 120_000) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Retry until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Timed out waiting for ${url}`)
}

async function main() {
  console.log('[e2e:tunnel] starting mock backend...')
  const mockBackend = run('node', ['e2e/mock-backend-server.cjs'])

  const appEnv = {
    ...process.env,
    DISABLE_AUTH_FOR_E2E: 'true',
    NEXT_PUBLIC_DISABLE_AUTH_FOR_E2E: 'true',
    PYTHON_API_URL: 'http://127.0.0.1:8787',
    BRAIN_API_KEY: 'test-key',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k',
    CLERK_SECRET_KEY: 'sk_test_e2e_1234567890',
  }
  console.log('[e2e:tunnel] starting Next.js dev server...')
  const appServer = run('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3000'], {
    env: appEnv,
  })

  let tunnel
  try {
    console.log('[e2e:tunnel] waiting for app server...')
    await waitForHttp('http://127.0.0.1:3000/')

    console.log('[e2e:tunnel] opening public tunnel...')
    tunnel = await Promise.race([
      localtunnel({
        port: 3000,
        local_host: '127.0.0.1',
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timed out creating localtunnel URL')), 60_000)
      ),
    ])

    console.log(`\n[playwright] tunnel URL: ${tunnel.url}\n`)

    const testEnv = {
      ...process.env,
      PLAYWRIGHT_BASE_URL: tunnel.url,
    }
    const tests = run('npx', ['playwright', 'test'], { env: testEnv })
    const [code] = await once(tests, 'exit')
    process.exitCode = Number(code ?? 1)
  } finally {
    if (tunnel) {
      await tunnel.close()
    }
    appServer.kill()
    mockBackend.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
