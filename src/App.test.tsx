import { StrictMode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { TODO_STORAGE_KEY } from './lib/todoStorage'
import { makeTodo } from './test/fixtures'

function start() {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify([
    makeTodo(), makeTodo({ id: 'task-2', title: '買い物', completed: true }),
  ]))
  return { user: userEvent.setup(), ...render(<StrictMode><App /></StrictMode>) }
}

const editButton = () => screen.getByRole('button', { name: '「読書」を編集' })
const editInput = () => screen.getByRole('textbox', { name: 'タスクの本文を編集' })

describe('Todo画面の操作', () => {
  it.each(['button', 'Enter'])('%sから追加でき、入力欄を空にしてフォーカスを維持する', async (method) => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('タスクはまだありません。最初のタスクを追加しましょう。')).toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: '新しいタスク' })
    await user.type(input, '  散歩  ')
    if (method === 'button') await user.click(screen.getByRole('button', { name: '追加' }))
    else await user.keyboard('{Enter}')
    expect(screen.getByRole('checkbox', { name: '散歩' })).not.toBeChecked()
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it.each([' ', 'あ'.repeat(201)])('不正な追加入力を画面上で拒否する (%#. ケース)', async (title) => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: '新しいタスク' }), title)
    await user.click(screen.getByRole('button', { name: '追加' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('編集開始時に本文を選択し、保存後は編集ボタンに戻る', async () => {
    const { user } = start()
    await user.click(editButton())
    const input = editInput() as HTMLInputElement
    expect(input).toHaveValue('読書')
    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(2)
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
    await user.clear(input)
    await user.type(input, '  読書を続ける  ')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.queryByRole('textbox', { name: 'タスクの本文を編集' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '「読書を続ける」を編集' })).toHaveFocus()
    expect(screen.getByRole('checkbox', { name: '買い物' })).toBeChecked()
    expect(JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)!)[0].title).toBe('読書を続ける')
  })

  it.each(['button', 'Escape'])('%sで編集をキャンセルし、内容とフォーカスを戻す', async (method) => {
    const { user } = start()
    const before = localStorage.getItem(TODO_STORAGE_KEY)
    await user.click(editButton())
    await user.clear(editInput())
    await user.type(editInput(), '保存しない変更')
    if (method === 'button') await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    else await user.keyboard('{Escape}')
    expect(screen.getByRole('checkbox', { name: '読書' })).toBeInTheDocument()
    expect(editButton()).toHaveFocus()
    expect(localStorage.getItem(TODO_STORAGE_KEY)).toBe(before)
  })

  it.each(['   ', 'あ'.repeat(201)])('不正な編集を拒否し、入力欄にエラーを関連付ける (%#. ケース)', async (title) => {
    const { user } = start()
    const before = localStorage.getItem(TODO_STORAGE_KEY)
    await user.click(editButton())
    await user.clear(editInput())
    await user.type(editInput(), title)
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByRole('alert')).toHaveTextContent(title.length > 200 ? '200文字以内' : '空白のみ')
    expect(editInput()).toHaveAttribute('aria-invalid', 'true')
    expect(editInput()).toHaveAccessibleDescription(/1〜200文字/)
    expect(editInput()).toHaveFocus()
    expect(localStorage.getItem(TODO_STORAGE_KEY)).toBe(before)
    await user.clear(editInput())
    await user.type(editInput(), '修正した本文')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('Enterキーで編集を保存できる', async () => {
    const { user } = start()
    await user.click(editButton())
    await user.clear(editInput())
    await user.type(editInput(), '更新{Enter}')
    expect(screen.getByRole('checkbox', { name: '更新' })).toBeInTheDocument()
  })

  it.each([true, false])('削除確認の結果が%sなら、許可された対象だけを削除する', async (accepted) => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(accepted)
    const { user } = start()
    await user.click(screen.getByRole('button', { name: '「読書」を削除' }))
    expect(confirm).toHaveBeenCalledWith('「読書」を削除しますか？')
    expect(screen.queryByRole('checkbox', { name: '読書' }) !== null).toBe(!accepted)
    expect(screen.getByRole('checkbox', { name: '買い物' })).toBeChecked()
    expect(JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)!)).toHaveLength(accepted ? 1 : 2)
  })

  it('完了を切り替え、3種類のフィルターと全体・表示件数を維持する', async () => {
    const { user } = start()
    const filters = within(screen.getByRole('group', { name: 'タスクの絞り込み' }))
    expect(filters.getByRole('button', { name: 'すべて' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(filters.getByRole('button', { name: '未完了' }))
    expect(screen.getByRole('status')).toHaveTextContent('全2件 · 完了1件 · 表示1件')
    expect(screen.queryByRole('checkbox', { name: '買い物' })).not.toBeInTheDocument()
    const saved = localStorage.getItem(TODO_STORAGE_KEY)
    await user.click(filters.getByRole('button', { name: '完了' }))
    expect(screen.getByRole('checkbox', { name: '買い物' })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: '読書' })).not.toBeInTheDocument()
    expect(localStorage.getItem(TODO_STORAGE_KEY)).toBe(saved)
    expect(filters.getByRole('button', { name: '完了' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(filters.getByRole('button', { name: 'すべて' }))
    await user.click(screen.getByRole('checkbox', { name: '読書' }))
    expect(screen.getByRole('checkbox', { name: '読書' })).toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent('全2件 · 完了2件 · 表示2件')
    await user.click(filters.getByRole('button', { name: '未完了' }))
    expect(screen.getByText('未完了のタスクはありません。')).toBeInTheDocument()
    expect(screen.getByText('全2件 · 完了2件 · 表示0件')).toBeInTheDocument()
  })

  it('完了フィルターの空状態と再マウント時のフィルター初期化', async () => {
    const { user, unmount } = start()
    await user.click(screen.getByRole('checkbox', { name: '買い物' }))
    await user.click(screen.getByRole('button', { name: '完了' }))
    expect(screen.getByText('完了したタスクはありません。')).toBeInTheDocument()
    unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: 'すべて' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('編集結果を画面の再マウント後も復元する', async () => {
    const { user, unmount } = start()
    await user.click(editButton())
    await user.clear(editInput())
    await user.type(editInput(), '復元される本文')
    await user.click(screen.getByRole('button', { name: '保存' }))
    unmount()
    render(<App />)
    expect(screen.getByRole('checkbox', { name: '復元される本文' })).toBeInTheDocument()
  })

  it('破損データでも警告と空状態を表示し、初期化時は上書きしない', () => {
    localStorage.setItem(TODO_STORAGE_KEY, '{broken')
    render(<StrictMode><App /></StrictMode>)
    expect(screen.getByRole('alert')).toHaveTextContent('読み込めません')
    expect(screen.getByText('タスクはまだありません。最初のタスクを追加しましょう。')).toBeInTheDocument()
    expect(localStorage.getItem(TODO_STORAGE_KEY)).toBe('{broken')
  })

  it('保存失敗は警告を表示し、画面上の編集内容は維持する', async () => {
    const { user } = start()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    await user.click(editButton())
    await user.clear(editInput())
    await user.type(editInput(), '保存できない変更')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByRole('alert')).toHaveTextContent('変更を保存できません')
    expect(screen.getByRole('checkbox', { name: '保存できない変更' })).toBeInTheDocument()
  })

  it('DOMのIMEイベント中は編集を確定・取消せず、終了後に保存する', async () => {
    const { user } = start()
    await user.click(editButton())
    const input = editInput()
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '変換中' } })
    expect(fireEvent.keyDown(input, { key: 'Enter', isComposing: true })).toBe(false)
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true })
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(editInput()).toHaveValue('変換中')
    fireEvent.compositionEnd(input)
    expect(fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })).toBe(false)
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByRole('checkbox', { name: '変換中' })).toBeInTheDocument()
  })
})
