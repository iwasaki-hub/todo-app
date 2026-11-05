# Todo App

ログイン不要で、ブラウザにタスクを保存する日本語のTodoアプリです。React + Vite + TypeScriptの単一アプリ構成です。

[本番アプリを開く](https://todo-app-phi-one-43.vercel.app/)

## 主な機能

- タスクの追加・編集・キャンセル・削除確認
- 完了／未完了の切り替えと、すべて／未完了／完了のフィルター
- 前後空白の除去、1〜200文字の入力検証、エラー表示
- localStorageへの保存・再読み込み後の復元、保存・読み込み失敗時の警告
- 件数・空状態の表示、レスポンシブ表示、キーボード操作とフォームラベル

## 開発環境

CIと同じNode.js **24.22.2**を推奨します。Windowsでの直近のリリース準備検証はNode.js 26.13.0 / npm 11.20.0、既存Ubuntu CIはNode.js 24.22.2です。

lockfileのNode要件にはVite `^20.19.0 || >=22.12.0`、ESLint `^20.19.0 || ^22.13.0 || >=24`、Vitest `^22.12.0 || ^24.0.0 || >=26.0.0`、jsdom `^22.22.2 || ^24.15.0 || >=26.0.0`等があります。全依存の要件を満たす環境が必要です。Node 22.22.2 / 24.15.0のengines適合は確認していますが、その環境で実行検証したという意味ではありません。未検証のNode・OSは動作保証しません。

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

表示されたローカルURLで開きます。WindowsでPowerShellの実行ポリシーによりnpm.ps1が使えない場合は、`npm`を`npm.cmd`に置き換えます。

## 検証・ビルド

```powershell
npm run test
npm run test:watch
npm run test:coverage
npm run lint
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

PlaywrightにはChromiumバイナリが必要です。

```powershell
npx playwright install chromium
npm run test:e2e
npm run test:e2e:ui
```

E2Eコマンドはビルド後、専用のVite previewを127.0.0.1:4173で起動・終了します。同ポートで手動previewを起動したまま実行しないでください。既存サーバーは再利用せず、テストごとにブラウザの保存領域を隔離します。本番URLをテスト接続先にしません。

Vitestは59件（既存55件＋Lint/glob回帰4件）、Playwrightは15件（機能・表示9件＋axe6状態）です。axe成功は実IME・支援技術・全ブラウザ・WCAG完全適合の保証ではありません。Vite previewはvercel.jsonのHTTPヘッダーを自動適用しないため、CSPの受入はVercel上で別途行います。

## 構成

```text
src/components/       Todoのフォーム・一覧・行・フィルター
src/hooks/            状態更新と永続化の連携
src/lib/              localStorageの読み書き・検証
src/types/            Todo型
src/test/             テスト共通処理・Lint互換性回帰
src/**/*.test.*       Vitestテスト
e2e/                  Chromium機能テスト・axe検査
docs/                 要件・設計・開発履歴・セキュリティ・リリース資料
.github/workflows/    PR/mainのCI
vercel.json           配信ヘッダー
```

## 保存仕様と制限

保存キーは`todo-app:todos:v1`。id、title、completed、createdAt、updatedAtを持つTodo配列をJSON保存します。読み込み時に型・タイトル・日時・ID重複を検証します。フィルター選択は保存しません。

保存は同一ブラウザ・プロファイル・オリジン内に限定されます。ログイン、複数端末同期、サーバー保存、クラウドバックアップ、エクスポート機能はありません。ブラウザデータ削除、プロファイル削除、端末変更、プライベート閲覧の終了等でタスクを失う可能性があります。保存失敗時の画面上の変更も再読み込みで失われる場合があります。

破損データは初期表示だけでは上書きせず警告しますが、その後の新しい操作で置き換える場合があります。機微情報は入力せず、重要なタスクは別途記録してください。

## セキュリティと運用

- Reactの文字列表示、入力・保存データ検証、外部API・認証なし。
- 環境変数ファイルの誤コミット防止。例外テンプレートにも秘密情報を入れないでください。
- 強制CSP、nosniff、no-referrer、DENY、不要な端末権限の禁止。HSTSはVercelが配信します。
- minimatch 11.0.4を親3経路に限定override。親の宣言範囲外というリスクと既知glob差分が残る暫定対応です。
- Vercel Toolbarのfeedback.js等はCSPで遮断されます。Todo本体とToolbarの互換性は区別します。

詳細：[HTTPヘッダー](docs/security/http-security-headers.md)、[minimatch対応](docs/security/minimatch-override.md)。ヘッダーやauditの成功だけで完全な安全性は保証しません。

GitHub ActionsはPR/mainでVitest・Lint・BuildとPlaywrightを実行します。main-pr-ciの必須チェックはValidateとE2Eの2件です。作業ブランチ→PR→必須チェック・レビュー→ユーザー承認→Squashマージを標準とし、mainへのGit連携でVercelが自動デプロイします。READYと実際の機能受入は別々に確認します。

## リリースとライセンス

package.jsonの1.0.0はリリース準備用のバージョンです。タグ・GitHub Releaseの公開完了を意味しません。[v1.0.0判定資料](docs/release/v1.0.0-readiness.md)で確認結果と未確認事項を管理します。

現時点でLICENSEファイルとpackage.jsonのlicense指定はありません。本PRではライセンスを選定せず、再利用・配布条件の確定はリポジトリ所有者の判断事項です。公開リポジトリであることだけから利用許諾を推定しないでください。
