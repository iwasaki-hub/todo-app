import { useState } from 'react'
import { loadTodos, saveTodos } from '../lib/todoStorage'
import type { Todo } from '../types/todo'

export function useTodos() {
  // 初期化は読み取りのみ。StrictModeで再実行されても保存内容を変更しない。
  const [state, setState] = useState(loadTodos)

  function commit(todos: Todo[]) {
    // 副作用はイベント内で実行し、state updater内では実行しない。
    const error = saveTodos(todos)
    setState({ todos, error })
  }

  function addTodo(input: string): string | null {
    const title = input.trim()
    if (!title) return 'タスクを入力してください。空白のみでは追加できません。'
    if (title.length > 200) return 'タスクは200文字以内で入力してください。'
    let id: string
    try {
      id = crypto.randomUUID()
    } catch {
      return 'タスクを作成できませんでした。HTTPSまたはlocalhostで開き直してください。'
    }
    const now = new Date().toISOString()
    commit([...state.todos, { id, title, completed: false, createdAt: now, updatedAt: now }])
    return null
  }

  function toggleTodo(id: string) {
    const now = new Date().toISOString()
    commit(state.todos.map((todo) => todo.id === id
      ? { ...todo, completed: !todo.completed, updatedAt: now }
      : todo))
  }

  function deleteTodo(id: string) {
    commit(state.todos.filter((todo) => todo.id !== id))
  }

  return { todos: state.todos, storageError: state.error, addTodo, toggleTodo, deleteTodo }
}
