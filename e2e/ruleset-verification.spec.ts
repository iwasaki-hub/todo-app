import { expect, test } from '@playwright/test'

test('QA：E2E必須チェック検証用の見出し確認', async ({ page, context }) => {
  const origin = 'http://127.0.0.1:4173'
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== origin) return route.abort('blockedbyclient')
    return route.continue()
  })
  await page.goto('/')
  expect(new URL(page.url()).origin).toBe(origin)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Todoリスト')
})
