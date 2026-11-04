import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTodos } from './useTodos'
import { TODO_STORAGE_KEY } from '../lib/todoStorage'
import { makeTodo } from '../test/fixtures'

function seed() {
  const todos = [makeTodo(), makeTodo({ id: 'task-2', title: '買い物' })]
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos))
  return todos
}

describe('useTodosの公開操作', () => {
  it('trimして追加し、日時・ID・未完了状態を保存する', () => {
    const { result } = renderHook(useTodos)
    act(() => { expect(result.current.addTodo('  読書  ')).toBeNull() })
    const todo = result.current.todos[0]
    expect(todo).toMatchObject({ title: '読書', completed: false, id: expect.any(String) })
    expect(new Date(todo.createdAt).toISOString()).toBe(todo.createdAt)
    expect(todo.updatedAt).toBe(todo.createdAt)
    expect(JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)!)).toEqual(result.current.todos)
  })

  it.each(['', '   ', 'あ'.repeat(201)])('不正な追加入力を拒否する (%#. ケース)', (input) => {
    const { result } = renderHook(useTodos)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    act(() => { expect(result.current.addTodo(input)).toEqual(expect.any(String)) })
    expect(result.current.todos).toEqual([])
    expect(write).not.toHaveBeenCalled()
  })

  it('追加・編集ともtrim後200文字を受け入れる', () => {
    const { result } = renderHook(useTodos)
    act(() => { expect(result.current.addTodo(` ${'あ'.repeat(200)} `)).toBeNull() })
    act(() => { expect(result.current.updateTodo(result.current.todos[0].id, ` ${'い'.repeat(200)} `)).toBeNull() })
    expect(result.current.todos[0].title).toBe('い'.repeat(200))
  })

  it.each(['', '   ', 'あ'.repeat(201)])('不正な編集入力を拒否して元データを保持する (%#. ケース)', (input) => {
    const todos = seed()
    const { result } = renderHook(useTodos)
    act(() => { expect(result.current.updateTodo('task-1', input)).toEqual(expect.any(String)) })
    expect(result.current.todos).toEqual(todos)
  })

  it('編集は対象の本文とupdatedAtだけを変更する', () => {
    const todos = seed()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'))
    const { result } = renderHook(useTodos)
    act(() => { result.current.updateTodo('task-1', ' 新しい本文 ') })
    expect(result.current.todos).toEqual([
      { ...todos[0], title: '新しい本文', updatedAt: '2026-02-01T00:00:00.000Z' }, todos[1],
    ])
  })

  it('同一本文の更新は日時も保存内容も変更しない', () => {
    const todos = seed()
    const { result } = renderHook(useTodos)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    act(() => { expect(result.current.updateTodo('task-1', ' 読書 ')).toBeNull() })
    expect(result.current.todos).toEqual(todos)
    expect(write).not.toHaveBeenCalled()
  })

  it('未知IDの編集・切り替え・削除で他のタスクを変えない', () => {
    const todos = seed()
    const { result } = renderHook(useTodos)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    act(() => {
      expect(result.current.updateTodo('missing', '変更')).toContain('見つかりません')
      result.current.toggleTodo('missing')
      result.current.deleteTodo('missing')
    })
    expect(result.current.todos).toEqual(todos)
    expect(write).not.toHaveBeenCalled()
  })

  it('対象の完了状態を切り替え、対象IDだけを削除する', () => {
    const todos = seed()
    const { result } = renderHook(useTodos)
    act(() => { result.current.toggleTodo('task-1') })
    expect(result.current.todos[0].completed).toBe(true)
    expect(result.current.todos[1]).toEqual(todos[1])
    act(() => { result.current.toggleTodo('task-1') })
    expect(result.current.todos[0].completed).toBe(false)
    act(() => { result.current.deleteTodo('task-1') })
    expect(result.current.todos).toEqual([todos[1]])
  })

  it('同じ描画から得た操作を連続実行しても更新を失わない', () => {
    seed()
    const { result } = renderHook(useTodos)
    const actions = result.current
    act(() => {
      actions.addTodo('追加1')
      actions.addTodo('追加2')
      actions.toggleTodo('task-1')
      actions.updateTodo('task-1', '編集済み')
      actions.deleteTodo('task-2')
    })
    expect(result.current.todos.map((todo) => todo.title)).toEqual(['編集済み', '追加1', '追加2'])
    expect(result.current.todos[0].completed).toBe(true)
    expect(JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)!)).toEqual(result.current.todos)
  })

  it('再マウントで編集・完了状態を復元する', () => {
    seed()
    const first = renderHook(useTodos)
    act(() => { first.result.current.updateTodo('task-1', '編集後'); first.result.current.toggleTodo('task-1') })
    const expected = first.result.current.todos
    first.unmount()
    const next = renderHook(useTodos)
    expect(next.result.current.todos).toEqual(expected)
  })

  it('保存失敗でも画面状態を維持し、成功した次の操作で警告を解消する', () => {
    seed()
    const { result } = renderHook(useTodos)
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    act(() => { result.current.updateTodo('task-1', 'メモリー上の変更') })
    expect(result.current.todos[0].title).toBe('メモリー上の変更')
    expect(result.current.storageError).toContain('保存できません')
    write.mockRestore()
    act(() => { result.current.toggleTodo('task-1') })
    expect(result.current.storageError).toBeNull()
    expect(JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)!)[0].title).toBe('メモリー上の変更')
  })

  it('UUID生成失敗を通知し、追加も保存もしない', () => {
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => { throw new Error('unavailable') })
    const { result } = renderHook(useTodos)
    act(() => { expect(result.current.addTodo('読書')).toContain('作成できません') })
    expect(result.current.todos).toEqual([])
    expect(localStorage.getItem(TODO_STORAGE_KEY)).toBeNull()
  })

  it.each(['{broken', JSON.stringify([makeTodo()])])('StrictMode初期化で保存済みデータを書き換えない (%#. ケース)', (raw) => {
    localStorage.setItem(TODO_STORAGE_KEY, raw)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    renderHook(useTodos, { wrapper: StrictMode })
    expect(write).not.toHaveBeenCalled()
    expect(localStorage.getItem(TODO_STORAGE_KEY)).toBe(raw)
  })
})
