import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { useTodos } from './hooks/useTodos'
import './App.css'

function App() {
  const { todos, storageError, addTodo, toggleTodo, deleteTodo } = useTodos()

  return (
    <main className="todo-app">
      <header className="app-header">
        <h1>Todoリスト</h1>
        <p>今日やりたいことを、ひとつずつ。</p>
      </header>
      {storageError && <p className="storage-error" role="alert">{storageError}</p>}
      <TodoForm onAdd={addTodo} />
      <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
      <footer>タスクはこのブラウザに保存されます。</footer>
    </main>
  )
}

export default App
