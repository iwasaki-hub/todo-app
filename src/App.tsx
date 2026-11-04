import { useState } from 'react'
import { TodoFilters } from './components/TodoFilters'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { useTodos } from './hooks/useTodos'
import type { TodoFilter } from './types/todo'
import './App.css'

function App() {
  const { todos, storageError, addTodo, toggleTodo, deleteTodo, updateTodo } = useTodos()
  const [filter, setFilter] = useState<TodoFilter>('all')
  const visibleTodos = todos.filter((todo) => filter === 'all' ||
    (filter === 'completed' ? todo.completed : !todo.completed))

  return (
    <main className="todo-app">
      <header className="app-header">
        <h1>Todoリスト</h1>
        <p>今日やりたいことを、ひとつずつ。</p>
      </header>
      {storageError && <p className="storage-error" role="alert">{storageError}</p>}
      <TodoForm onAdd={addTodo} />
      <TodoFilters value={filter} onChange={setFilter} />
      <TodoList todos={visibleTodos} totalCount={todos.length}
        completedCount={todos.filter((todo) => todo.completed).length} filter={filter}
        onToggle={toggleTodo} onDelete={deleteTodo} onUpdate={updateTodo} />
      <footer>タスクはこのブラウザに保存されます。</footer>
    </main>
  )
}

export default App
