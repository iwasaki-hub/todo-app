import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

type Props = { onAdd: (title: string) => string | null }

export function TodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextError = onAdd(title)
    setError(nextError)
    if (nextError === null) setTitle('')
    inputRef.current?.focus()
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="todo-title">新しいタスク</label>
      <div className="form-row">
        <input ref={inputRef} id="todo-title" name="title" value={title}
          onChange={(event) => { setTitle(event.target.value); setError(null) }}
          aria-invalid={error !== null} aria-describedby={error ? 'title-help title-error' : 'title-help'}
          placeholder="例：本を10ページ読む" autoComplete="off" />
        <button type="submit" className="primary-button">追加</button>
      </div>
      <p id="title-help" className="hint">前後の空白を除いて1〜200文字で入力してください。</p>
      {error && <p id="title-error" className="error-message" role="alert">{error}</p>}
    </form>
  )
}
