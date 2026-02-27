import { defineConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const useExternalBaseURL = Boolean(process.env.PLAYWRIGHT_BASE_URL)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'output/playwright/report' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: ['--no-proxy-server'],
    },
  },
  webServer: useExternalBaseURL
    ? undefined
    : [
        {
          command: 'node e2e/mock-backend-server.cjs',
          port: 8787,
          timeout: 120_000,
          reuseExistingServer: false,
        },
        {
          command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
          port: 3000,
          timeout: 180_000,
          reuseExistingServer: false,
          env: {
            ...process.env,
            DISABLE_AUTH_FOR_E2E: 'true',
            NEXT_PUBLIC_DISABLE_AUTH_FOR_E2E: 'true',
            PYTHON_API_URL: 'http://127.0.0.1:8787',
            BRAIN_API_KEY: 'test-key',
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k',
            CLERK_SECRET_KEY: 'sk_test_e2e_1234567890',
          },
        },
      ],
})
