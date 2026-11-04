import type { TodoFilter } from '../types/todo'

type Props = { value: TodoFilter; onChange: (filter: TodoFilter) => void }

const filters: { value: TodoFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '未完了' },
  { value: 'completed', label: '完了' },
]

export function TodoFilters({ value, onChange }: Props) {
  return (
    <div className="todo-filters" role="group" aria-label="タスクの絞り込み">
      {filters.map((filter) => (
        <button key={filter.value} type="button" aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}>{filter.label}</button>
      ))}
    </div>
  )
}
