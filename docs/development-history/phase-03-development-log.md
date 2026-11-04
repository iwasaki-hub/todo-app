# Phase 03：自動テスト環境と回帰テスト

## 対象と設計

- 作業日：2026年11月4日。作業ブランチ：`feature/p3-automated-tests`。
- `git fetch origin`後の最新`origin/main`から作成し、開始基準`35682bea9c00e04f336c15bec4f64e2df846847d`を含むことを確認した。作業開始時の未コミット・未追跡変更はなかった。
- AGENTS.md、CODEX_PROMPT.md、要件・基本設計・実装計画、P2履歴、既存設定・lockfile・実装を確認した。
- [共通モデルv1.0.0](https://github.com/iwasaki-hub/AI-Development-Template/tree/v1.0.0)のAGENTS.md、AI_Development_Standard_v1.md、README、プロファイル雛形を取得した。安全なブランチ運用、同一課題最大3回の修正、検証と未実施事項の区別、承認前のマージ禁止を適用した。
- プロジェクト専用`project-profile.md`は未整備。必要な設定は今回の依頼と既存文書から確認し、テンプレートの導入・既存規則の書き換えは行っていない。
- 依頼文の保存キー`todo-app:todos`と既存設計・コードに差があった。既存データの互換性を優先し、正しい既存キー`todo-app:todos:v1`を維持してテストでも固定した。
- 保存関数の単体テスト、実React Hooksのテスト、Appを通じたユーザー操作の結合テストに分けた。アプリ機能コードは変更していない。

## 技術選定と互換性

導入前にnpmレジストリの安定版タグ、engines、peerDependenciesを確認し、以下を開発用依存としてバージョン固定した。

| ライブラリ | バージョン | 選定理由 |
|---|---|---|
| vitest | 5.1.0 | Vite設定を共有するテストランナー |
| @vitest/coverage-v8 | 5.1.0 | Vitestと同版のV8カバレッジ |
| @testing-library/react | 16.3.3 | 実Reactの描画・renderHook |
| @testing-library/dom | 10.4.2 | React Testing Library等の共通peer依存 |
| @testing-library/jest-dom | 7.0.1 | accessible name・focus等のDOMアサーション |
| @testing-library/user-event | 14.6.8 | 非同期のユーザー操作シミュレーション |
| jsdom | 30.1.3 | Node上のDOM環境 |

- 確認環境：Node.js 26.13.0、npm 11.20.0、React/React DOM 19.3.1、Vite 8.3.5、TypeScript 6.0.3。
- VitestはNode `^22.12.0 || ^24.0.0 || >=26.0.0`、Vite `^6.4.0 || ^7.0.0 || ^8.0.0`を要求。Testing Library ReactはReact 18/19をサポートし、jest-domはNode 22以上を要求する。
- jsdomのNode要件は`^22.22.2 || ^24.15.0 || >=26.0.0`。CI構築時にはこの条件も満たすNodeを選ぶ必要がある。
- 強制解決なしでインストール成功、`npm ls`で競合なし。既存lockfile内のパッケージのバージョン変更はなかった。
- 参照：[Vitest導入ガイド](https://vitest.dev/guide/)、[React Testing Library導入](https://testing-library.com/docs/react-testing-library/intro/)、各パッケージのnpmメタデータ。

## 構成と後片付け

- `vite.config.ts`でjsdom、setup、mockの復元・呼び出し履歴消去、V8カバレッジを設定。既存Reactプラグインは維持した。
- `src/test/setup.ts`で各テスト前後にlocalStorageを消去し、終了時にReactのcleanup、spy復元、global stub復元、実タイマーへの復帰を行う。
- `src/test/fixtures.ts`に個人情報を含まないTodoデータの生成関数を置いた。可変配列をテスト間で共有しない。
- カバレッジ生成物を`.gitignore`とESLintの対象から除外した。テストコードへのlint・型検査は維持する。
- アプリ・依存の実行順に依存するsleep、skip、スナップショット、Hooksの偽物は使っていない。React Testing LibraryのrenderHookとactを使用する。

## テスト対象と件数

| ファイル | 件数 | 主な検証 |
|---|---:|---|
| src/lib/todoStorage.test.ts | 19 | 初回・正常復元、不正型・本文・日時・重複ID、壊れたJSON、読み書き例外、初期上書き防止 |
| src/hooks/useTodos.test.tsx | 18 | trim・追加・編集境界値、属性保持・更新日時、同一本文・未知ID、完了・削除、連続操作、保存・再マウント、保存失敗からの復帰、UUID失敗、StrictMode |
| src/App.test.tsx | 18 | 追加/Enter、編集/保存/取消/Esc、入力エラー、削除確認/取消、完了、3フィルター・件数・空状態、保存復元・警告、accessible name・フォーカス、IMEイベント |
| 合計 | 55 | 3ファイルすべて成功 |

## 検証コマンドと結果

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npm.cmd run test:coverage
npm.cmd run test -- --sequence.shuffle --sequence.seed=20261104
git diff --check
git diff --cached --check
npm.cmd audit --json
npm.cmd audit --omit=dev --json
```

- test：55/55成功。lint・buildも初回から成功した。
- coverage実行：55/55成功。順序シャッフル（seed 20261104）でも55/55成功し、この順序における再現性を確認した。
- `test:watch`は`vitest`を起動する設定として追加した。継続的なウォッチ操作の検証は未実施。
- `git diff --check`と`git diff --cached --check`は成功し、対象11ファイルのみで生成物・秘密情報・無関係な変更がないことを確認した。PR番号・マージSHA・本番結果は本記録作成時点では未確定。今回の停止点はPR作成・確認まで。
- audit：開発依存のminimatch（GHSA-g3hv-75wg-m249）由来moderate 12件で終了コード1。本番依存のみは0件・終了コード0。既知警告は解消済みとせず、強制修正・無条件overridesは行わない。
- テスト・lint・buildの失敗はなく、自動修正ループは0回。アプリ側の修正を必要とする問題は今回の検証では見つからなかった。

## カバレッジ実測

| 指標 | 実測 |
|---|---:|
| Statements | 100%（133/133） |
| Branches | 100%（95/95） |
| Functions | 100%（39/39） |
| Lines | 100%（107/107） |

対象はApp・4コンポーネント・useTodos・todoStorageの7ファイル。`src/main.tsx`（DOM起動）、型、setup/fixture、テスト自身を除外している。生成HTMLとJSONは`coverage/`に出力し、コミットしない。100%はこの計測対象に対する値であり、要件の全組み合わせや実ブラウザ動作の保証ではない。初回は数値ゲートを設けず、重要操作・異常系の回帰検証を優先した。

## レビューと残課題

- アプリの機能・保存形式・キー・本番依存は変更していない。設定、開発依存、テスト、生成物除外と本履歴だけを変更した。
- 型検査を含むbuildとlintでテストも検証した。mockは各テストで復元し、user-eventはawait、Hooks操作はactで実行している。
- DOMシミュレーションではcomposition開始/終了、isComposing、keyCode 229中の編集確定抑止、変換中Escの取消抑止、変換終了後の保存を確認した。
- 実OSの日本語変換候補、ブラウザごとのイベント順、モバイルIME、実レイアウト、スクリーンリーダー、本番操作は今回未検証。追加フォームの実IME動作も手動確認事項として残る。
- P2のユーザー手動確認完了報告は過去の記録であり、P3でCodexが実ブラウザを操作したものではない。
- CIで動作する単発コマンドは用意したが、Linux等での実行とGitHub Actionsは未実施。P4でNode要件・lockfile・test/lint/buildの自動実行を整備する。
- 変更の復旧が必要な場合は、PRの未マージ状態で差分を修正する。マージ後の取り消しは別途承認されたrevert PRで扱い、mainへ直接Pushしない。

## 共通テンプレートv1.1.0への改善候補

- 依存導入前の安定版・Node engines・peer依存の照合と、coverageプラグインの同版固定をチェックリスト化する。
- 保存キー等の依頼と既存コードの表記差を記録し、データ互換性を明示する。
- 単体/実Hooks/DOM操作/実ブラウザを区別し、IME・アクセシビリティの確認限界を記録する。
- cleanup、localStorage分離、mock復元、固定seedシャッフルをテスト品質の確認例として追加する。
- カバレッジは対象・除外・分母を併記し、100%と機能保証を混同しない。既知のaudit警告は本番/開発依存を分けて記載する。

## P3完了結果（マージ後の追記）

上記はPR作成時点の実装・検証記録として保持する。以下はその後に確定したレビュー・マージ・公開結果である。

### レビュー・マージ・main反映

- 対象：[PR #6](https://github.com/iwasaki-hub/todo-app/pull/6)。ユーザーからコードレビュー完了とSquash and mergeの承認を受けた。
- マージ前に、承認Head `50bedfde4ba7bea3cf2faa161e90d9ce8cdec083`の完全一致、レビュー済みP3関連11ファイルのみの差分、Vercel・Vercel Preview Commentsのsuccessを確認した。
- マージ競合・未解決レビュースレッドはなく、GitHubのマージ状態は`clean`。ブランチ情報では保護無効・必須チェックなし、rulesetなしだった。GitHub上のレビュー一覧は空であり、ユーザーによるレビュー完了承認は会話上の報告として区別する。
- 通常のSquash and mergeを実行し、PRがMergedになったことを確認した。保護設定の回避、強制マージ、mainへの直接Push、ブランチ削除は行っていない。
- マージ日時：2026年11月4日21:32:49 JST（GitHub：`2026-11-04T12:32:49Z`）。
- マージコミットSHA：`0f86c56ad7d68499a97381c1e89c8623443cbc8c`。
- コミットメッセージ：`test: add automated regression tests (#6)`。
- GitHub mainが同SHAを指すことを確認し、検証済みHeadとマージ後mainの全50エントリーのパス・GitオブジェクトSHAが一致した。テスト環境と55件のテストが反映され、アプリ機能コード・保存形式・保存キーは維持されている。

### テスト結果の位置づけ

- 55件（保存処理19件、実Hooks18件、画面操作18件）の成功、lint・build・coverage成功、順序シャッフル成功は、CodexがP3実装時にローカルで実行した作業記録に基づく。マージ前には同じHead SHAとその後の変更がないことを確認した。
- GitHub Actionsによる独立したCI検証はP4まで未実施。Vercelチェックのsuccessを、GitHub Actionsによる55件のテスト成功とは扱わない。
- カバレッジ実測はStatements 100%（133/133）、Branches 100%（95/95）、Functions 100%（39/39）、Lines 100%（107/107）。対象はApp・4コンポーネント・useTodos・todoStorageの7ファイルで、main.tsx・型・テスト自身・補助コードを除外した値である。
- この文書更新のための検証と、P3実装時の検証結果は区別する。マージ済みという事実だけで実ブラウザの操作確認が完了したとはしない。

### Production自動デプロイ

- GitHub連携によるProduction自動デプロイはBUILDINGからREADYになったことを確認した。
- デプロイ元：Git、ブランチ：`main`、対象SHA：`0f86c56ad7d68499a97381c1e89c8623443cbc8c`。マージコミットと一致した。
- デプロイID：`dpl_DngCGsHEY219KZhiH3jHnDWok4Br`。
- 本番URL：[https://todo-app-phi-one-43.vercel.app/](https://todo-app-phi-one-43.vercel.app/)。同URLが上記READYデプロイに割り当てられていることを再確認した。
- 手動デプロイや本番設定変更は行っていない。READYはビルド・公開の完了を示し、本番での操作検証を保証するものではない。

### 残課題とP4への引き継ぎ

- P3のaudit実測は開発依存moderate 12件、本番依存0件。minimatch由来の既知警告は未解消であり、更新判断時に再調査する。本履歴更新ではauditを再実行していない。
- 実ブラウザIME、OSやモバイルでの変換イベント、スクリーンリーダー、実レイアウト、本番操作、watchの継続操作は未検証のまま引き継ぐ。
- P4ではGitHub Actionsでlockfileに基づくインストール、test・lint・build・必要なcoverageを実行し、Linuxでの再現性とチェック運用を整備する。jsdomを含むNode要件を満たす実行環境を選ぶ。
- 共通モデルv1.1.0への改善候補は、上記の安定版・engines・peer確認、保存キーの不一致記録、実Hooks/DOM/実ブラウザの検証範囲の区別、後片付けと固定seed、カバレッジ対象・分母の明記、auditの本番/開発分離である。共通テンプレート自体は今回変更しない。

### 照合した情報源

- GitHub PR #6のMerged状態・マージ日時・SHA、およびマージ時のmain・変更ファイル・Gitツリーの確認結果。
- ユーザーのコードレビュー完了承認、CodexのP3ローカル検証記録と本履歴の実測値。
- Vercel APIから取得した本番URLに対応するProduction READY、Gitブランチ・SHA・URL割り当て。

今回の文書更新でも`npm.cmd run test`（55/55）、`npm.cmd run lint`、`npm.cmd run build`と`git diff --check`が成功した。coverageは再測定せず、上記P3実装時の実測値を記録した。変更対象は本Markdownの1ファイルのみで、秘密情報や生成物を含まないことを差分で確認した。
