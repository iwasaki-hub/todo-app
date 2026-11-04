import type { Todo } from '../types/todo'

export function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'task-1', title: '読書', completed: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
