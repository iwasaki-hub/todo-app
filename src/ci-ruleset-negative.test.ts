import { expect, test } from 'vitest'

test('temporary negative check: required CI must block merge', () => {
  expect('CI_SHOULD_BLOCK').toBe('CI_PASS')
})
