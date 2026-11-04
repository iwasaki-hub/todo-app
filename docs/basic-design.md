# Todo App 基本設計書

- 版: 1.0 (2026-11-04)
- 前提: 通常の単一Viteプロジェクト（モノレポは採用しない）

## 現状と技術選定
開発開始時の`src/App.tsx`はViteスターター画面だった。現在はP1の追加・一覧・完了切替・削除・永続化を実装済み（PR #1）。編集・フィルターはP2で対応する。`package.json`のscriptsは`dev`, `build` (`tsc -b && vite build`), `lint`, `preview`。既存のReact/Vite/TypeScript設定を尊重する。

- UI: React + TypeScript。P1は`useState`で遅延初期化し、操作イベント内で保存する。`useEffect`による初回保存は行わず、Strict Modeでの意図しない上書きを避ける。
- スタイル: P1では`src/App.css`と`src/index.css`に分離。以下の構成例の`src/styles/`は将来の整理候補であり必須ではない。Tailwindなどの追加はMVPでは不要。
- 永続化: localStorage（キー`todo-app:todos:v1`）。
- ホスティング: Vercelの静的サイトビルド。ルート`./`、build`npm run build`、出力`dist`。
- テスト: Vitest + React Testing Library + jsdomを追加する段階は別タスク。Reactコンポーネントの表示/操作と保存処理をテスト。

## 画面
以下はMVP完成時の画面設計。P1では編集・フィルターを除く基本画面を実装済み。単一画面で構成。上からタイトル、追加フォーム、フィルターボタン（すべて/未完了/完了）、件数、タスク一覧、空状態。タスク行はチェックボックス・本文・編集ボタン・削除ボタンで構成。編集時は入力欄と保存/キャンセルを表示。

## コンポーネントの責務（推奨、必要に応じて調整）
```
src/
  App.tsx                  # 画面構成・フィルターの選択
  components/
    TodoForm.tsx           # 追加
    TodoList.tsx           # 一覧と空状態
    TodoItem.tsx           # 切り替え・編集・削除
    TodoFilters.tsx        # 絞り込み
  hooks/
    useTodos.ts            # 更新操作と永続化
  lib/
    todoStorage.ts         # 安全な読み書き
  types/
    todo.ts                # Todo, Filter
  styles/
    app.css                # 画面スタイル
```
上記は完成時の推奨構成。P1ではTodoFilter、TodoFilters、編集処理は未実装。最初から全ファイルを一度に追加せず、機能単位で分割する。UIコンポーネントと保存処理を直接結びつけない。

## 型と更新ルール
```ts
export type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}
export type TodoFilter = 'all' | 'active' | 'completed'
```
- `addTodo(title)` はtrimし、空なら失敗扱い。
- `updateTodo(id, title)` は対象1件だけ変更し、`updatedAt`も更新。
- `toggleTodo(id)` は対象1件の`completed`を反転し、`updatedAt`も更新。
- `deleteTodo(id)` は対象1件を除去。
- 表示するTodoは`todos.filter(...)`で導出。永続化するのはTodo配列のみ（フィルターは保存不要）。
- 状態は不変更新で変更する。

## 保存・読み込み
- `todo-app:todos:v1`を使用。
- 初期化時に`JSON.parse`を`try/catch`で保護。配列と各要素の最小限の型検証を行う。不正なら空配列へフォールバック。
- P1では型、trim後のタイトル、ISO日時、ID重複を検証する。不正データや読み込み失敗時は空配列と警告を返し、初期表示のみでは保存データを変更しない。新しい操作時に保存を試みることを案内する。
- 保存失敗（容量超過・プライベートモードの制約等）でもクラッシュさせず、画面の操作を継続し、再読み込みで変更が失われる可能性を通知する。
- React開発時のStrict Modeで想定外の上書きを生まないよう、初期値の読み取りと保存タイミングを検証する。
- 読み込み対象はlocalStorageのみ。サーバー上にユーザーデータを置かない。

## UI・UX
- タイトルの長さは1〜200文字（trim後）。長すぎる入力に案内を表示。
- 削除時は`window.confirm`などの明確な確認を用いる（MVP）。
- 完了状態は色だけに依存しない（チェック状態とテキストの視覚差）。
- モバイル幅でもボタンが操作可能な間隔を確保する。
- 画面にフォーカスリングを表示し、アイコンだけのボタンには`aria-label`を付ける。

## テスト方針
- 保存処理: 正常データ・破損データ・保存エラー。
- Todo操作: 追加、空文字拒否、編集、切替、削除、フィルタリング。
- ページ再読み込み相当: localStorageの復元。
- 確認: `npm run lint`, `npm run build`, `npm test`（テストスクリプトを追加した後）。

## CI/CD
- GitHub PRで lint / typecheck(build) / test を実行するGitHub Actionsを後のフェーズで追加。
- 既存Vercelプロジェクトと本番URLを維持。
- ブランチで実装 → PRでレビュー/プレビュー確認 → `main`へマージ → 本番反映。
- `dist/`, `node_modules/`, `.env*`などの秘密情報や生成物はコミットしない。

## 設計上の制約
新規バックエンド、外部DB、認証、モノレポ、過剰な状態管理ライブラリを導入しない。既存の設定・依存関係を大きく更新しない。外部サービス設定変更は明示的に合意した際のみ行う。
