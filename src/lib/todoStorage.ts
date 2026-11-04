import type { Todo } from '../types/todo'

export const TODO_STORAGE_KEY = 'todo-app:todos:v1'
type LoadResult = { todos: Todo[]; error: string | null }

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
}

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false
  return (
    'id' in value && typeof value.id === 'string' && value.id.trim().length > 0 &&
    'title' in value && typeof value.title === 'string' &&
    value.title === value.title.trim() && value.title.length >= 1 && value.title.length <= 200 &&
    'completed' in value && typeof value.completed === 'boolean' &&
    'createdAt' in value && isIsoDate(value.createdAt) &&
    'updatedAt' in value && isIsoDate(value.updatedAt)
  )
}

export function loadTodos(): LoadResult {
  try {
    const raw = localStorage.getItem(TODO_STORAGE_KEY)
    if (raw === null) return { todos: [], error: null }
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data) || !data.every(isTodo) ||
      new Set(data.map((todo) => todo.id)).size !== data.length) {
      return { todos: [], error: '保存データの形式が不正なため、空の一覧で開始しました。新しい操作を行うと保存データを置き換えます。' }
    }
    return { todos: data, error: null }
  } catch {
    return { todos: [], error: '保存データを読み込めませんでした。空の一覧で開始しました。新しい操作を行うと保存データを置き換えます。' }
  }
}

export function saveTodos(todos: Todo[]): string | null {
  try {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos))
    return null
  } catch {
    return '変更を保存できませんでした。画面上では操作を続けられますが、再読み込みすると変更が失われる可能性があります。'
  }
}
