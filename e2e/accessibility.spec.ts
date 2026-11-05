import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'

// WCAG 2.2 AAまでのA/AAタグを対象とする。自動検査だけで適合を保証しない。
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const localOrigin = 'http://127.0.0.1:4173'

async function checkAccessibility(page: Page, testInfo: TestInfo) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
  // 違反と要手動確認の両方について、ルール・影響度・対象・説明を残す。
  const findings = { violations: results.violations, incomplete: results.incomplete }
  await testInfo.attach('axe-results', {
    body: JSON.stringify({ url: page.url(), tags: wcagTags, ...findings }, null, 2),
    contentType: 'application/json',
  })
  console.log(`${testInfo.title}: axe violations=${results.violations.length}, incomplete=${results.incomplete.length}`)
  for (const [kind, rules] of Object.entries(findings)) {
    for (const rule of rules) {
      console.log(JSON.stringify({ kind, id: rule.id, impact: rule.impact,
        description: rule.description, nodes: rule.nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }))
    }
  }
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

async function addTask(page: Page, title: string) {
  await page.getByRole('textbox', { name: '新しいタスク' }).fill(title)
  await page.getByRole('button', { name: '追加', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: title, exact: true })).toBeVisible()
}

test.beforeEach(async ({ page, context }) => {
  // 標準の独立BrowserContextで開始し、本番を含む外部通信を遮断する。
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== localOrigin) return route.abort('blockedbyclient')
    return route.continue()
  })
  await page.goto('/')
  expect(new URL(page.url()).origin).toBe(localOrigin)
  expect(await page.evaluate(() => localStorage.getItem('todo-app:todos:v1'))).toBeNull()
  await expect(page.getByText('タスクはまだありません。最初のタスクを追加しましょう。')).toBeVisible()
})

test('AX01：空の初期画面', async ({ page }, testInfo) => {
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await checkAccessibility(page, testInfo)
})

test('AX02：未完了・完了を含む複数タスク一覧', async ({ page }, testInfo) => {
  await addTask(page, 'QA-AX02-未完了')
  await addTask(page, 'QA-AX02-完了')
  await page.getByRole('checkbox', { name: 'QA-AX02-完了', exact: true }).check()
  await expect(page.getByRole('status')).toHaveText('全2件 · 完了1件 · 表示2件')
  await checkAccessibility(page, testInfo)
})

test('AX03：タスク編集中', async ({ page }, testInfo) => {
  await addTask(page, 'QA-AX03-編集対象')
  await page.getByRole('button', { name: '「QA-AX03-編集対象」を編集' }).click()
  await expect(page.getByRole('textbox', { name: 'タスクの本文を編集' })).toBeFocused()
  await expect(page.getByRole('button', { name: '保存', exact: true })).toBeVisible()
  await checkAccessibility(page, testInfo)
})

test('AX04：新規タスク入力エラー', async ({ page }, testInfo) => {
  await page.getByRole('textbox', { name: '新しいタスク' }).fill('   ')
  await page.getByRole('button', { name: '追加', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('空白のみ')
  await expect(page.getByRole('textbox', { name: '新しいタスク' })).toHaveAttribute('aria-invalid', 'true')
  await checkAccessibility(page, testInfo)
})

test('AX05：タスク編集エラー', async ({ page }, testInfo) => {
  await addTask(page, 'QA-AX05-編集対象')
  await page.getByRole('button', { name: '「QA-AX05-編集対象」を編集' }).click()
  const editor = page.getByRole('textbox', { name: 'タスクの本文を編集' })
  await editor.fill('   ')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('空白のみ')
  await expect(editor).toHaveAttribute('aria-invalid', 'true')
  await checkAccessibility(page, testInfo)
})

test('AX06：フィルター結果0件', async ({ page }, testInfo) => {
  await addTask(page, 'QA-AX06-未完了')
  await page.getByRole('button', { name: '完了', exact: true }).click()
  await expect(page.getByRole('button', { name: '完了', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('完了したタスクはありません。')).toBeVisible()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await checkAccessibility(page, testInfo)
})
