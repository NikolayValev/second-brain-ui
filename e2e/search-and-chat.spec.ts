import { test, expect } from '@playwright/test'

const isDeployedRun = Boolean(process.env.PLAYWRIGHT_BASE_URL)

test.describe('Second Brain critical flows', () => {
  test.skip(isDeployedRun, 'Local deterministic flow. Skipped for deployed URL runs.')

  test('supports full-text and semantic search modes', async ({ page }) => {
    await page.goto('/search?q=oauth')

    await expect(page.getByText('API Security')).toBeVisible()
    await expect(page.getByText('Found 1 result')).toBeVisible()

    await page.getByRole('button', { name: 'Semantic' }).click()
    await expect(page.getByText('OAuth Architecture')).toBeVisible()
    await expect(page.getByText('using semantic search')).toBeVisible()
  })

  test('streams chat answers and preserves conversation continuity', async ({ page }) => {
    await page.goto('/ask')

    await expect(page.getByText('Ask your Second Brain')).toBeVisible()

    const input = page.getByPlaceholder('Ask a question...')
    await input.fill('What are my current priorities?')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(
      page.getByText('shipping stable backend/frontend integration.')
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /Plan/i })).toBeVisible()
    await expect(page.getByText('What are my current priorities?')).toBeVisible()

    await page.reload()
    await expect(page.getByText('What are my current priorities?')).toBeVisible()
  })
})
