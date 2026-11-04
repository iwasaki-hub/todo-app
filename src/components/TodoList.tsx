import type { Todo } from '../types/todo'
import { TodoItem } from './TodoItem'

type Props = {
  todos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoList({ todos, onToggle, onDelete }: Props) {
  return (
    <section aria-labelledby="list-heading">
      <div className="list-heading">
        <h2 id="list-heading">タスク一覧</h2>
        <p role="status">全{todos.length}件 · 完了{todos.filter((todo) => todo.completed).length}件</p>
      </div>
      {todos.length === 0 ? (
        <p className="empty-state">タスクはまだありません。最初のタスクを追加しましょう。</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />)}
        </ul>
      )}
    </section>
  )
}
