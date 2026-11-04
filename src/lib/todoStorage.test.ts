import { describe, expect, it, vi } from 'vitest'
import { loadTodos, saveTodos, TODO_STORAGE_KEY } from './todoStorage'
import { makeTodo } from '../test/fixtures'

describe('Todoの保存と読み込み', () => {
  it('既存のv1キーを維持し、初回は空配列を返す', () => {
    expect(TODO_STORAGE_KEY).toBe('todo-app:todos:v1')
    expect(loadTodos()).toEqual({ todos: [], error: null })
  })

  it('正常データを保存・復元し、読み込み時は書き込まない', () => {
    const todos = [makeTodo(), makeTodo({ id: 'task-2', title: 'あ'.repeat(200), completed: true })]
    expect(saveTodos(todos)).toBeNull()
    const write = vi.spyOn(Storage.prototype, 'setItem')
    expect(loadTodos()).toEqual({ todos, error: null })
    expect(write).not.toHaveBeenCalled()
  })

  it.each([
    ['空タイトル', [{ ...makeTodo(), title: '' }]],
    ['空白のみ', [{ ...makeTodo(), title: '   ' }]],
    ['前後空白', [{ ...makeTodo(), title: ' 読書 ' }]],
    ['201文字', [{ ...makeTodo(), title: 'あ'.repeat(201) }]],
    ['本文の型', [{ ...makeTodo(), title: 1 }]],
    ['完了の型', [{ ...makeTodo(), completed: 'false' }]],
    ['空ID', [{ ...makeTodo(), id: ' ' }]],
    ['IDの型', [{ ...makeTodo(), id: 1 }]],
    ['作成日時', [{ ...makeTodo(), createdAt: 'invalid' }]],
    ['更新日時の型', [{ ...makeTodo(), updatedAt: 1 }]],
    ['欠落した属性', [{ id: 'task-1' }]],
    ['null要素', [null]],
    ['配列以外', {}],
    ['重複ID', [makeTodo(), makeTodo()]],
  ])('%sを拒否し、元データを上書きしない', (_label, data) => {
    const raw = JSON.stringify(data)
    localStorage.setItem(TODO_STORAGE_KEY, raw)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    expect(loadTodos()).toEqual({ todos: [], error: expect.any(String) })
    expect(write).not.toHaveBeenCalled()
    expect(localStorage.getItem(TODO_STORAGE_KEY)).toBe(raw)
  })

  it('壊れたJSONを処理し、保存内容を維持する', () => {
    localStorage.setItem(TODO_STORAGE_KEY, '{broken')
    expect(loadTodos()).toEqual({ todos: [], error: expect.stringContaining('読み込めません') })
    expect(localStorage.getItem(TODO_STORAGE_KEY)).toBe('{broken')
  })

  it('getItemの例外を警告に変換する', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(loadTodos()).toEqual({ todos: [], error: expect.stringContaining('読み込めません') })
  })

  it('setItemの例外を、再読込時のデータ消失を案内する警告に変換する', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError') })
    expect(saveTodos([makeTodo()])).toContain('再読み込みすると変更が失われる可能性')
  })
})
