import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Todo } from '../types/todo'

type Props = {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, title: string) => string | null
}

export function TodoItem({ todo, onToggle, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(todo.title)
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)
  const composing = useRef(false)

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    } else if (restoreFocus.current) {
      editButtonRef.current?.focus()
      restoreFocus.current = false
    }
  }, [editing])

  function finishEditing() {
    restoreFocus.current = true
    composing.current = false
    setEditing(false)
    setError(null)
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (composing.current) return
    const nextError = onUpdate(todo.id, title)
    setError(nextError)
    if (nextError === null) finishEditing()
    else inputRef.current?.focus()
  }

  function handleDelete() {
    if (window.confirm(`「${todo.title}」を削除しますか？`)) onDelete(todo.id)
  }

  return (
    <li className={`todo-item${todo.completed ? ' is-completed' : ''}`}>
      {editing ? (
        <form className="edit-form" onSubmit={handleSave} noValidate>
          <label htmlFor={inputId}>タスクの本文を編集</label>
          <input id={inputId} ref={inputRef} value={title}
            onChange={(event) => { setTitle(event.target.value); setError(null) }}
            onCompositionStart={() => { composing.current = true }}
            onCompositionEnd={() => { composing.current = false }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !event.nativeEvent.isComposing && !composing.current) {
                event.preventDefault()
                finishEditing()
              }
              if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) {
                event.preventDefault()
              }
            }}
            aria-invalid={error !== null}
            aria-describedby={error ? `${inputId}-help ${inputId}-error` : `${inputId}-help`} />
          <p id={`${inputId}-help`} className="hint">前後の空白を除いて1〜200文字。Escでキャンセルできます。</p>
          {error && <p id={`${inputId}-error`} className="error-message" role="alert">{error}</p>}
          <div className="todo-actions">
            <button type="submit" className="primary-button">保存</button>
            <button type="button" className="secondary-button" onClick={finishEditing}>キャンセル</button>
          </div>
        </form>
      ) : (
        <>
          <label className="todo-check">
            <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
            <span className="todo-title">{todo.title}</span>
          </label>
          <div className="todo-actions">
            <button type="button" className="secondary-button" ref={editButtonRef}
              onClick={() => { setTitle(todo.title); setError(null); setEditing(true) }}
              aria-label={`「${todo.title}」を編集`}>編集</button>
            <button type="button" className="delete-button" onClick={handleDelete}
              aria-label={`「${todo.title}」を削除`}>削除</button>
          </div>
        </>
      )}
    </li>
  )
}
