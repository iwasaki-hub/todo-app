# Phase 04：GitHub Actions CI構築

## 目的・開始基準

- 2026年11月4日、`feature/p4-github-actions`で開始。`git fetch origin`後の最新mainに基準コミット`31a1e02e1cfec290a1dda51c527455867b47f6f3`を含むことを確認した。同名ブランチ・未コミット変更・既存ワークフローはなかった。
- AGENTS.md、CODEX_PROMPT.md、要件・設計・実装計画、P3履歴、package/lockfile、Vite・TypeScript・ESLint設定を確認した。文書内のP1時点の記述は履歴として扱い、P3の実装・履歴を現在の基準とした。
- [共通モデルv1.1.0](https://github.com/iwasaki-hub/AI-Development-Template/tree/v1.1.0)の安全規則・Gate 0〜7を取得し適用した。専用project-profile.mdは未整備で、必要な設定は依頼・既存ルール・実測から確認した。
- PR更新時にインストール・テスト・lint・buildを独立したUbuntu環境で実行する。変更はCIワークフローと本履歴のみ。アプリ、保存キー`todo-app:todos:v1`、保存形式、依存関係、テスト設定・コマンド、Vercel設定を変更しない。

## ワークフロー

- ファイル：`.github/workflows/ci.yml`。ワークフロー名`CI`、ジョブ`Validate (test, lint, build)`。
- 起動：main向け`pull_request`のopened / synchronize / reopened、mainへのpush。パスによる除外なし。初回は自動起動を検証するためworkflow_dispatchは追加しない。
- ubuntu-latestでCheckout → Node Setup → `npm ci` → `npm run test` → `npm run lint` → `npm run build`。途中失敗はそのままジョブ失敗とし、skipやcontinue-on-errorで隠さない。タイムアウト15分。
- npmキャッシュはsetup-nodeから利用し、`package-lock.json`をキーの入力に指定。node_modules自体はキャッシュせず、毎回npm ciで構築する。対応lockfileは既存のlockfileVersion 3で、今回変更しない。
- concurrencyはワークフロー名とPR番号（PR以外はref）で分離。同じPRの更新時だけ古い実行をキャンセルする。mainへのpushはキャンセル対象にしない。最終確認は最新Headの実行結果で行う。

## Node・Actionsの選定

| 対象 | 採用版・固定SHA | 理由 |
|---|---|---|
| Node.js | 24.22.2 | 公式24系配布の対応パッチ版。jsdomの24.15.0以上、Vitestの24系、Viteとjest-domのNode条件を満たす |
| actions/checkout | v7.0.1 / `3d3c42e5aac5ba805825da76410c181273ba90b1` | 公式latest安定リリースとタグ参照を確認し、完全SHAに固定 |
| actions/setup-node | v7.1.0 / `949feb2413d6458794dcd2491c4babbbce0c15c1` | 公式latest安定リリース。Node選択とnpmキャッシュを構成し、完全SHAに固定 |

- [Node公式配布情報](https://nodejs.org/download/release/latest-v24.x/SHASUMS256.txt)、[checkoutリリース](https://github.com/actions/checkout/releases/tag/v7.0.1)、[setup-nodeリリース](https://github.com/actions/setup-node/releases/tag/v7.1.0)と各action.ymlを確認した。将来の更新はタグとSHAの対応・互換性を再確認する。
- jsdom 30.1.3は`^22.22.2 || ^24.15.0 || >=26.0.0`、Vitest 5.1.0は`^22.12.0 || ^24.0.0 || >=26.0.0`を要求する。CIとローカルのランタイム差は実測で区別する。
- [GitHubの安全な利用指針](https://docs.github.com/en/actions/reference/security/secure-use)を参照し、権限は`contents: read`のみ。Checkoutはpersist-credentialsをfalseにした。
- 明示的なシークレットや外部カバレッジ送信、デプロイ処理、pull_request_targetは追加しない。PRのコード・npm lifecycleを実行するため、GitHubホストの一時ランナーと最小権限を使用する。自動トークンはactions内部で必要な読み取りに使用されるが、リポジトリへの書き込み権限は付与しない。
- 保護・Rulesets・Actionsのリポジトリ設定は変更しない。チェックの存在と、マージ必須条件としての設定は別工程である。

## ローカル検証

Windows / Node.js 26.13.0 / npm 11.20.0で実行した。Ubuntu・Node 24.22.2の結果としては扱わない。

```powershell
npm.cmd ci
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npm.cmd run test:coverage
git diff --exit-code -- package-lock.json
git diff --check
git diff --cached --check
```

- npm ci、test 55/55（3ファイル）、lint、型検査を含むbuild、coverage 55/55がすべて成功。lockfileに変更なし。
- カバレッジは7ファイルのStatements 100%（133/133）、Branches 100%（95/95）、Functions 100%（39/39）、Lines 100%（107/107）。計測対象・除外はP3から変更していない。
- coverageは今回はローカルで測定する。CIではtestの成功を検証し、coverage追加・数値しきい値・外部サービスは導入しない。main.tsx、型、テスト自身と補助コードの除外を含む既存測定範囲を維持した。
- actionlint 1.7.12を公式リリースから一時フォルダーに取得し、公開SHA256を照合して`.github/workflows/ci.yml`を検証、終了コード0。グローバル設定・プロジェクト依存の追加は行っていない。
- 失敗を起点とする自動修正ループは0回。既知audit警告は別途記録し、test/lint/buildの失敗として扱わない。

## セキュリティ警告の実測

```powershell
npm.cmd audit --json
npm.cmd audit --omit=dev --json
npm.cmd ls minimatch
npm.cmd view minimatch@11.0.1 version engines --json
```

- 今回再検査：全依存moderate 12件（audit終了コード1）、high/critical 0件。本番依存のみは0件（終了コード0）。新規の重大な問題は検出していない。
- 原因はminimatch 10.2.6の[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)。glob処理の資源消費によるDoSが問題となり、ESLint 10.14.0、@eslint/config-array 0.23.5、typescript-eslint 8.72.1系に依存警告が波及している。利用者向け本番依存への検出はないが、開発ツールでの影響は残る。
- auditの修正境界はminimatch 11.0.1。npmレジストリで同版の存在とNode条件`18 || 20 || >=22`を確認した。既存依存元の10系要求に対する11系への変更は別途互換性検証が必要であり、現構成へ安全に適用できる更新を確認したという意味ではない。
- auditの候補にはtypescript-eslint 8.14.0や@eslint/js 9.39.5など既存構成との互換性を再検討すべき変更が含まれる。今回、強制修正・overrides・依存更新は行わず、auditを新規CIゲートにも追加しない。

## GitHub Actions・PRの確認

本記録の初稿時点ではPR番号・Actions実行URL・Ubuntuでの結果は未確定。PR作成後の実行を確認して追記する。マージSHAとProduction結果は未確定であり、今回マージ・本番操作は行わない。

### PR作成後の確定結果

- [PR #8](https://github.com/iwasaki-hub/todo-app/pull/8)をmain向けに作成し、pull_requestイベントによる自動起動を確認した。
- 初回Head：`b32f61fe78357d7c953457bd940f7e2a9c173317`。GitHubが実際にCheckoutしたPRテスト用マージSHA：`0748c2817552d3d23d2c1970e2df9f4864e64379`。これはmainへの正式なマージではない。
- [初回CI実行](https://github.com/iwasaki-hub/todo-app/actions/runs/41835513113)はcompleted / success。ジョブID`126593258925`の全ステップでsuccessを確認した。
- ログ実測：Ubuntu 26.04.1 LTS（ubuntu-latest）、Node 24.22.2、npm 11.19.1。npm ci、test 55/55、lint、型検査・Vite buildがすべて成功した。GitHub Actionsによる独立したLinuxでの検証結果であり、ローカル成功とは別の証拠である。
- 初回はnpmキャッシュ未命中、その後のキャッシュ保存成功を確認した。CIログでも既知moderate 12件の案内があり、npm ci自体は成功した。
- この確定結果を履歴に追記して追加PushするためHeadは更新される。最終HeadのCI・Vercel・Preview Commentsを再確認し、その実行URL・結論をPRと最終報告に残す。初回成功を更新後Headの成功として流用しない。

## 未検証事項・マージ前確認

- PR作成・更新イベントのCI、各ステップ、最終Headに対する成功、Vercel Previewを確認する。mainのpushイベントはマージ前には未実施。
- concurrencyによる実際の重複キャンセル、キャッシュ命中、実ブラウザIME・スクリーンリーダー・表示品質は別の確認範囲。デプロイチェックをテスト成功の証拠に代用しない。
- ユーザーの最終マージ承認、最新Head・対象2ファイル・競合・レビュー要件・必須チェックの確認が必要。保護設定を変更しないため、本PRだけでCIがマージ必須条件になるとは報告しない。
- ワークフローの取り消しが必要なら別PRで差分を戻す。共通テンプレート・アプリのリファクタリングは対象外。

## 共通モデルv1.2.0への改善候補

- ローカルとCIのOS・Node・npm・検証SHA（PRのテスト用マージSHAを含む）を分けて記録する。
- Actionsの安定版タグと完全SHA、Nodeパッチ版の選定根拠、更新手順を記載する。
- 最小権限、資格情報非保持、PRとmainで異なるconcurrency、lockfileベースのキャッシュを標準レビュー項目にする。
- PR作成後の確定情報追記でHeadが変わる場合、最新Headの全チェックを再確認する。必須ゲートと情報提供用のaudit/coverageも区別する。
