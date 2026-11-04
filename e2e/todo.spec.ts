import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const storageKey = 'todo-app:todos:v1'
const localOrigin = 'http://127.0.0.1:4173'

async function addTodo(page: Page, title: string, enter = false) {
  const input = page.getByRole('textbox', { name: '新しいタスク' })
  await input.fill(title)
  if (enter) await input.press('Enter')
  else await page.getByRole('button', { name: '追加', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: title.trim(), exact: true })).toBeVisible()
}

async function editTodo(page: Page, oldTitle: string, newTitle: string) {
  await page.getByRole('button', { name: `「${oldTitle}」を編集`, exact: true }).click()
  await page.getByRole('textbox', { name: 'タスクの本文を編集' }).fill(newTitle)
  await page.getByRole('button', { name: '保存', exact: true }).click()
}

async function deleteTodo(page: Page, title: string, accept: boolean) {
  // ダイアログを閉じるハンドラーをクリック前に登録する。
  const handled = page.waitForEvent('dialog').then(async (dialog) => {
    expect(dialog.type()).toBe('confirm')
    expect(dialog.message()).toBe(`「${title}」を削除しますか？`)
    if (accept) await dialog.accept()
    else await dialog.dismiss()
  })
  await page.getByRole('button', { name: `「${title}」を削除`, exact: true }).click()
  await handled
}

test.beforeEach(async ({ page, context }) => {
  // 各テスト標準の新規BrowserContextを利用し、本番を含む外部通信を遮断する。
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== localOrigin) return route.abort('blockedbyclient')
    return route.continue()
  })
  await page.goto('/')
  expect(new URL(page.url()).origin).toBe(localOrigin)
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull()
  await expect(page.getByText('タスクはまだありません。最初のタスクを追加しましょう。')).toBeVisible()
})

test('E01：追加・Enter追加・編集・取消・対象だけの削除', async ({ page }) => {
  await addTodo(page, 'QA-E01-対象')
  await addTodo(page, 'QA-E01-保持', true)
  await editTodo(page, 'QA-E01-対象', 'QA-E01-編集済み')
  await expect(page.getByRole('checkbox', { name: 'QA-E01-編集済み', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '「QA-E01-編集済み」を編集' }).click()
  await page.getByRole('textbox', { name: 'タスクの本文を編集' }).fill('QA-E01-保存しない')
  await page.getByRole('button', { name: 'キャンセル', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'QA-E01-編集済み', exact: true })).toBeVisible()
  await deleteTodo(page, 'QA-E01-編集済み', false)
  await expect(page.getByRole('checkbox')).toHaveCount(2)
  await expect(page.getByRole('checkbox', { name: 'QA-E01-編集済み', exact: true })).toBeVisible()
  await deleteTodo(page, 'QA-E01-編集済み', true)
  await expect(page.getByRole('checkbox', { name: 'QA-E01-編集済み', exact: true })).toHaveCount(0)
  await expect(page.getByRole('checkbox')).toHaveCount(1)
  await expect(page.getByRole('checkbox', { name: 'QA-E01-保持', exact: true })).not.toBeChecked()
})

test('E02：完了の往復・件数更新・他タスク保持', async ({ page }) => {
  await addTodo(page, 'QA-E02-対象')
  await addTodo(page, 'QA-E02-保持')
  const target = page.getByRole('checkbox', { name: 'QA-E02-対象', exact: true })
  await expect(target).not.toBeChecked()
  await target.check()
  await expect(target).toBeChecked()
  await expect(page.getByRole('status')).toHaveText('全2件 · 完了1件 · 表示2件')
  await expect(page.getByRole('checkbox', { name: 'QA-E02-保持', exact: true })).not.toBeChecked()
  await target.uncheck()
  await expect(target).not.toBeChecked()
  await expect(page.getByRole('status')).toHaveText('全2件 · 完了0件 · 表示2件')
  await expect(page.getByRole('checkbox', { name: 'QA-E02-保持', exact: true })).not.toBeChecked()
})

test('E03：全件・未完了・完了フィルターと0件表示', async ({ page }) => {
  await addTodo(page, 'QA-E03-未完了')
  await addTodo(page, 'QA-E03-完了')
  await page.getByRole('checkbox', { name: 'QA-E03-完了', exact: true }).check()
  const saved = await page.evaluate((key) => localStorage.getItem(key), storageKey)
  for (const [filter, visible, hidden] of [
    ['未完了', 'QA-E03-未完了', 'QA-E03-完了'],
    ['完了', 'QA-E03-完了', 'QA-E03-未完了'],
  ]) {
    await page.getByRole('button', { name: filter, exact: true }).click()
    await expect(page.getByRole('button', { name: filter, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('checkbox', { name: visible, exact: true })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: hidden, exact: true })).toHaveCount(0)
    await expect(page.getByRole('status')).toHaveText('全2件 · 完了1件 · 表示1件')
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(saved)
  }
  await page.getByRole('button', { name: 'すべて', exact: true }).click()
  await expect(page.getByRole('checkbox')).toHaveCount(2)
  await page.getByRole('checkbox', { name: 'QA-E03-未完了', exact: true }).check()
  await page.getByRole('button', { name: '未完了', exact: true }).click()
  await expect(page.getByText('未完了のタスクはありません。')).toBeVisible()
  await expect(page.getByText('全2件 · 完了2件 · 表示0件')).toBeVisible()
  await page.getByRole('button', { name: 'すべて', exact: true }).click()
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.uncheck()
  await page.getByRole('button', { name: '完了', exact: true }).click()
  await expect(page.getByText('完了したタスクはありません。')).toBeVisible()
  await page.getByRole('button', { name: 'すべて', exact: true }).click()
  await expect(page.getByRole('checkbox')).toHaveCount(2)
})

test('E04：追加・編集・完了・削除を再読込で復元、フィルター初期化', async ({ page }) => {
  await addTodo(page, 'QA-E04-対象')
  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'QA-E04-対象', exact: true })).toBeVisible()
  await addTodo(page, 'QA-E04-削除')
  await editTodo(page, 'QA-E04-対象', 'QA-E04-復元')
  await page.getByRole('checkbox', { name: 'QA-E04-復元', exact: true }).check()
  await deleteTodo(page, 'QA-E04-削除', true)
  await page.getByRole('button', { name: '完了', exact: true }).click()
  const saved = await page.evaluate((key) => localStorage.getItem(key), storageKey)
  await page.reload()
  await expect(page.getByRole('button', { name: 'すべて', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('checkbox', { name: 'QA-E04-復元', exact: true })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'QA-E04-削除', exact: true })).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText('全1件 · 完了1件 · 表示1件')
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(saved)
})

test('E05：追加と編集の空・空白・trim・200/201文字境界', async ({ page }) => {
  const input = page.getByRole('textbox', { name: '新しいタスク' })
  for (const value of ['', '   ', 'あ'.repeat(201)]) {
    await input.fill(value)
    await page.getByRole('button', { name: '追加', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(value.length > 200 ? '200文字以内' : '空白のみ')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('checkbox')).toHaveCount(0)
  }
  await addTodo(page, '  QA-E05-trim  ')
  await addTodo(page, 'あ'.repeat(200))
  await page.getByRole('button', { name: '「QA-E05-trim」を編集' }).click()
  const editor = page.getByRole('textbox', { name: 'タスクの本文を編集' })
  for (const value of ['', '   ', 'い'.repeat(201)]) {
    await editor.fill(value)
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(value.length > 200 ? '200文字以内' : '空白のみ')
    await expect(editor).toBeFocused()
  }
  await editor.fill(` ${'い'.repeat(200)} `)
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'い'.repeat(200), exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('E06：Enter・Tab・編集開始/保存/取消のフォーカス', async ({ page }) => {
  const input = page.getByRole('textbox', { name: '新しいタスク' })
  await input.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '追加', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(input).toBeFocused()
  await addTodo(page, 'QA-E06-対象', true)
  await expect(input).toBeFocused()
  const edit = page.getByRole('button', { name: '「QA-E06-対象」を編集' })
  await edit.focus()
  await page.keyboard.press('Enter')
  const editor = page.getByRole('textbox', { name: 'タスクの本文を編集' })
  await expect(editor).toBeFocused()
  await editor.fill('QA-E06-保存済み')
  await editor.press('Enter')
  const nextEdit = page.getByRole('button', { name: '「QA-E06-保存済み」を編集' })
  await expect(nextEdit).toBeFocused()
  await page.keyboard.press('Enter')
  await editor.fill('QA-E06-取消')
  await editor.press('Escape')
  await expect(nextEdit).toBeFocused()
  await expect(page.getByRole('checkbox', { name: 'QA-E06-保存済み', exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'タスクの本文を編集' })).toHaveCount(0)
})

for (const width of [320, 375, 390]) {
  test(`E07：幅${width}pxの長文表示・追加・編集・削除`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const title = 'QA-E07-' + '長い本文'.repeat(45)
    await addTodo(page, title)
    await expect(page.getByText(title, { exact: true })).toBeVisible()
    const assertFits = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      for (const button of await page.getByRole('button').all()) {
        const box = await button.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
      }
    }
    await assertFits()
    await page.getByRole('button', { name: `「${title}」を編集`, exact: true }).click()
    await assertFits()
    await page.getByRole('textbox', { name: 'タスクの本文を編集' }).fill('QA-E07-編集済み')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await expect(page.getByRole('checkbox', { name: 'QA-E07-編集済み', exact: true })).toBeVisible()
    await deleteTodo(page, 'QA-E07-編集済み', true)
    await expect(page.getByText('タスクはまだありません。最初のタスクを追加しましょう。')).toBeVisible()
    await assertFits()
  })
}
