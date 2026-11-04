import type { Todo, TodoFilter } from '../types/todo'
import { TodoItem } from './TodoItem'

type Props = {
  todos: Todo[]
  totalCount: number
  completedCount: number
  filter: TodoFilter
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, title: string) => string | null
}

export function TodoList({ todos, totalCount, completedCount, filter, onToggle, onDelete, onUpdate }: Props) {
  const emptyMessage = totalCount === 0
    ? 'タスクはまだありません。最初のタスクを追加しましょう。'
    : filter === 'active' ? '未完了のタスクはありません。' : '完了したタスクはありません。'
  return (
    <section aria-labelledby="list-heading">
      <div className="list-heading">
        <h2 id="list-heading">タスク一覧</h2>
        <p role="status">全{totalCount}件 · 完了{completedCount}件 · 表示{todos.length}件</p>
      </div>
      {todos.length === 0 ? (
        <p className="empty-state" role="status">{emptyMessage}</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdate} />)}
        </ul>
      )}
    </section>
  )
}
