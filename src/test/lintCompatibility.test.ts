/// <reference types="node" />
// Node側の開発ツールの検証。UI・DOM・本番コードは変更しない。
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const require = createRequire(path.join(root, 'package.json'))

describe('Lintとglobの互換性', () => {
  it('src・e2eのTSファイルを検査し、生成物は除外する', async () => {
    const eslint = new ESLint({ cwd: root })
    const expected = ['src', 'e2e'].flatMap((directory) =>
      readdirSync(path.join(root, directory), { recursive: true })
        .filter((file): file is string => typeof file === 'string' && /\.tsx?$/.test(file))
        .map((file) => path.resolve(root, directory, file)),
    )
    const results = await eslint.lintFiles(['src', 'e2e'])
    expect(expected.length).toBeGreaterThan(0)
    expect(results.map(({ filePath }) => filePath).sort()).toEqual(expected.sort())
    for (const file of ['dist/probe.ts', 'coverage/probe.ts']) {
      expect(await eslint.isPathIgnored(path.join(root, file))).toBe(true)
    }
    for (const file of ['src/probe.ts', 'e2e/probe.ts']) {
      expect(await eslint.isPathIgnored(path.join(root, file))).toBe(false)
    }
  })

  it('有効なTypeScriptルールで意図的な違反を検出する', async () => {
    const eslint = new ESLint({ cwd: root })
    const [result] = await eslint.lintText('const qaUnused = 1;', { filePath: 'src/qa-probe.ts' })
    expect(result.errorCount).toBeGreaterThan(0)
    expect(result.messages.map(({ ruleId }) => ruleId)).toContain('@typescript-eslint/no-unused-vars')
  })

  it('親3経路で利用するMinimatch・match・minimatch APIが必要なglobを処理する', () => {
    // 10/11の全API・全globの同一性を要求するテストではない。
    for (const parent of ['eslint', '@eslint/config-array', '@typescript-eslint/typescript-estree']) {
      const fromParent = createRequire(require.resolve(parent))
      const matcher: typeof import('minimatch') = fromParent('minimatch')
      for (const [file, pattern, expected] of [
        ['src/App.tsx', '**/*.{ts,tsx}', true],
        ['src/.draft.ts', 'src/**/*.ts', true],
        ['e2e/todo.spec.ts', 'e2e/*.spec.ts', true],
        ['dist/index.js', 'src/**/*.ts', false],
        ['src/App.tsx', '!**/*.test.ts', true],
      ] as const) {
        expect(new matcher.Minimatch(pattern, { dot: true }).match(file)).toBe(expected)
        expect(matcher.minimatch(file, pattern, { dot: true })).toBe(expected)
      }
      expect(new matcher.Minimatch('src/**/*.ts', { dot: true }).match('src', true)).toBe(true)
      expect(new matcher.Minimatch('C:/repo/**/*.ts', { platform: 'win32' })
        .match('C:\\repo\\src\\qa.ts')).toBe(true)
    }
  })

  it('TypeScript 6の型付きparserとallowDefaultProjectのglobを利用できる', () => {
    const parser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser')
    const result = parser.parseForESLint('const qaValue: string = "QA";', {
      filePath: path.join(root, 'qa-parser-probe.ts'),
      tsconfigRootDir: root,
      projectService: { allowDefaultProject: ['qa-parser-probe.ts'], defaultProject: 'tsconfig.app.json' },
    })
    expect(result.ast.type).toBe('Program')
    expect(result.services.program).toBeTruthy()
  })
})
