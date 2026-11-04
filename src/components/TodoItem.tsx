import type { Todo } from '../types/todo'

type Props = {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggle, onDelete }: Props) {
  function handleDelete() {
    if (window.confirm(`「${todo.title}」を削除しますか？`)) onDelete(todo.id)
  }

  return (
    <li className={`todo-item${todo.completed ? ' is-completed' : ''}`}>
      <label className="todo-check">
        <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
        <span className="todo-title">{todo.title}</span>
      </label>
      <button type="button" className="delete-button" onClick={handleDelete}
        aria-label={`「${todo.title}」を削除`}>削除</button>
    </li>
  )
}
