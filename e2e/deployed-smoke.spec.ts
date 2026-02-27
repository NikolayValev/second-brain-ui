import { test, expect, Page } from '@playwright/test'

const isDeployedRun = Boolean(process.env.PLAYWRIGHT_BASE_URL)

function isAuthRedirect(url: string): boolean {
  return /accounts\.dev\/sign-in|accounts\.clerk\.com\/sign-in|\/sign-in/i.test(url)
}

async function expectRouteOrAuthGate(page: Page) {
  const url = page.url()
  if (isAuthRedirect(url)) {
    await expect(page).toHaveURL(/sign-in|accounts\.dev|accounts\.clerk\.com/i)
    return
  }

  await expect(page.locator('main')).toBeVisible()
}

test.describe('Deployed smoke checks', () => {
  test.skip(!isDeployedRun, 'Run only when PLAYWRIGHT_BASE_URL is set.')

  test('homepage loads without server error', async ({ page }) => {
    const response = await page.goto('/')
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(500)

    await expect(page).toHaveTitle(/Second Brain/i)
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible()
  })

  test('search route is reachable (content or auth gate)', async ({ page }) => {
    const response = await page.goto('/search')
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(500)

    await expectRouteOrAuthGate(page)
  })

  test('ask route is reachable (content or auth gate)', async ({ page }) => {
    const response = await page.goto('/ask')
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(500)

    await expectRouteOrAuthGate(page)
  })
})
