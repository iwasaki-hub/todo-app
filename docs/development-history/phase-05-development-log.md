# Phase 05：実ブラウザ受入テスト

## Phase 5-B：Chrome手動受入結果

### 対象と情報源

- 対象リポジトリ：[iwasaki-hub/todo-app](https://github.com/iwasaki-hub/todo-app)。
- 記録作成時に取得した最新origin/mainは、確認済みSHA `b6bb4b9ba9976c0601446a9ea36eb27e7ecc335c`と一致した。
- 実施環境：Windows 11 / Google Chrome 157、テスト専用Chromeプロファイル。
- 対象URL：[http://127.0.0.1:5173/](http://127.0.0.1:5173/)。ローカル環境であり、本番受入ではない。
- 実施者：ユーザー。結果はユーザーによる手動Pass / Not Tested報告に基づく。Codex自身がChromeを操作して確認した記録ではない。
- 過去の手順作成時、ローカルHEAD `7b28bf0e8d8e0fe40aa96c7f03a1f15ab24102c3`の追跡ファイル内容が上記main SHAと同一であることを確認していた。手動実施時点の正確なHEADやブラウザの完全なビルド番号は、今回の報告では提示されていない。
- 実施日時、各ケースの詳細な操作ログ、スクリーンショット等の証拠は提示されていないため推測で補わない。記録作成時のGit状態確認と、手動実施時の環境情報は区別する。
- 前段のCI・Ruleset整備は[Phase 04履歴](phase-04-development-log.md)を参照する。当時未検証だった事項のうち、今回報告されたChromeローカルの範囲だけを後続結果として記録する。

### ケース別結果

| ID | 対象 | 結果 | 根拠・補足 |
|---|---|---|---|
| A01 | タスク追加・文字数制限 | Pass | ユーザー手動報告 |
| A02 | タスク編集・キャンセル | Pass | ユーザー手動報告 |
| A03 | タスク削除・確認ダイアログ | Pass | ユーザー手動報告 |
| A04 | 完了・未完了切り替え | Pass | ユーザー手動報告 |
| A05 | フィルタリング | Pass | ユーザー手動報告。追加確認の0件表示もPass |
| A06 | localStorage保存内容 | Pass | ユーザー手動報告 |
| A07 | ページ再読み込み | Pass | ユーザー手動報告 |
| A08 | 日本語IMEの変換・確定 | Pass | Chrome 157で不具合は再現しなかったとの手動報告 |
| A09 | キーボード操作・フォーカス | Pass | ユーザー手動報告 |
| A10 | モバイル幅の表示確認 | Pass | ユーザー手動報告。実モバイル端末の検証とは扱わない |
| A11 | 空一覧・該当なし表示 | Pass | ユーザー手動報告 |
| A12 | 複数タスクの連続操作 | Pass | ユーザー手動報告 |
| A13 | 基本アクセシビリティ・ナレーター | Not Tested | ナレーター未実施。200%拡大・フォーカス・スクリーンリーダーの個別実施状況は未確認 |

集計：**Pass 12件 / Fail 0件 / Not Tested 1件 / 合計13件**。A05の0件表示は追加確認であり、合計に別ケースとして加算しない。

A09のPassからA13全体のPassを推定しない。A13の個別項目を実施済みとして補完せず、Not Testedを維持する。Fail 0件は報告された範囲の結果であり、未知の不具合が存在しないことを意味しない。

### IMEと検証範囲の制限

- 追加フォームの変換確定Enterによる意図しない追加を懸念していたが、Chrome 157のユーザー手動操作では不具合が再現していないとの報告だった。A08はその環境での結果であり、他ブラウザ・他IME・全イベント順での安全性を保証しない。
- IME製品名・設定・個別キーイベント記録は未提示。今回コードを修正する根拠として未確認の再現条件を追加しない。
- モバイル幅のPassは表示幅の確認結果に限定する。端末種類・画面幅の詳細、実端末タッチ・ソフトウェアキーボードは確認済みとしない。

### 手動・自動・未実施の区別

| 区分 | 状態・扱い |
|---|---|
| Chromeローカルの手動受入 | 上記12 Pass / 1 Not Tested。ユーザー報告 |
| Vitest / React Testing Library / jsdomの55件 | P3・P4で導入済み。GitHub Actionsの成功記録は手動受入と別の検証。今回もtest・lint・buildを実行して文書PRの検証として扱う |
| Edgeでの手動受入 | 未実施 |
| Playwright E2E | 未導入・未実施 |
| 本番環境の受入操作 | 未実施。Production READYは受入成功の代替ではない |
| ナレーター・スクリーンリーダー | 未実施。A13はNot Tested |
| 200%拡大などA13の個別項目 | 個別実施状況は未確認 |

### 文書作成と次の工程

- `AGENTS.md`と既存履歴を確認した。作業開始時に未コミット変更はなく、最新origin/mainから`docs/phase-05-chrome-manual-acceptance`を作成した。
- 変更対象は本Markdownだけ。アプリ、依存、CI、Ruleset、既存P4履歴を変更しない。Playwright導入・本番操作を行わない。
- 文書の件数・SHA・リンク・情報源の区別をレビューした。今回のローカル検証は`npm.cmd run test`で55/55成功、`npm.cmd run lint`・`npm.cmd run build`も成功。手動12件の結果とは別の検証である。コミット前に通常・ステージ済み差分チェックを行う。
- 文書PRの最新Headに対するGitHub Actions必須チェックとVercelチェックは、PR作成後に確認してPR本文・最終報告へ記録する。PR番号・マージSHA・本番結果は推測しない。
- 次工程候補：A13の個別項目とナレーター、Edge、実端末、承認された範囲でのPhase 5-C本番受入。必要な環境・操作範囲を決めてから実施する。
- 今回は文書PR作成・チェック確認までで停止し、マージには別途ユーザーの最終承認を必要とする。

## Phase 5：Playwright E2E導入

### 基準と導入内容

- 上記Chrome手動記録は当時の結果として維持する。以下はその後のE2E導入記録である。
- 作業ブランチ：`feature/phase-05-playwright-e2e`。開始時の作業ツリーはクリーンで、fetch後origin/mainは指定基準`c7d8476633a5e42fd6509a37ee33fdbbf02d20e8`と一致した。同名ブランチはなかった。
- [Playwright公式導入](https://playwright.dev/docs/intro)と[webServer設定](https://playwright.dev/docs/test-webserver)を参照。安定版タグとenginesをnpmで確認し、Node.js 26.13.0 / npm 11.20.0に対して`@playwright/test` 1.64.1を開発依存へ完全版固定で追加した（engines：Node >=20、公式システム要件は現行22/24/26系）。
- `playwright`と`playwright-core` 1.64.1もlockfileへ追加された。既存パッケージのバージョン変更はなく、本番依存は変更していない。
- `playwright install chromium`でChromium 156.0.8078.4（revision 1248）と同版Headless Shellを取得した。標準補助のFFmpeg・Winlddも取得された。Firefox/WebKit・サンプルアプリ・CIテンプレートは生成していない。
- `playwright.config.ts`はe2e/のみ収集し、Chromiumのみ使用。baseURLは固定の`http://127.0.0.1:4173/`。Production URLは接続先にしない。
- webServerで`npm run build`成功後にVite previewを127.0.0.1・4173固定・strictPortで起動し、終了を管理する。reuseExistingServer=falseのため既存サーバーを再利用しない。4173が使用中なら既存プロセスを終了せず、失敗理由を報告する。
- 各テストは標準の新規BrowserContextを使用し、開始時に保存キー未設定・空一覧を確認する。ローカル以外のブラウザ要求はrouteで遮断する。テストデータはQA識別子を付け、外部サービスを利用しない。
- traceはretain-on-failure、スクリーンショットはonly-on-failure。固定sleep・skip・自動リトライによる失敗隠蔽は使わない。レポートは自動で開かない。

### ファイルとテストの分離

- `e2e/todo.spec.ts`：主要ブラウザ操作の9テスト。
- `playwright.config.ts`：ローカル専用のブラウザ・サーバー・成果物設定。
- `tsconfig.e2e.json`：E2Eと設定の型検査を独立させる。既存buildの検査範囲を変更しない。
- package.json：`test:e2e`と`test:e2e:ui`を追加。それぞれ型検査後にPlaywrightを実行する。既存test/lint/build/test:coverageのスクリプトは維持した。
- vite.config.ts：Vitestのincludeを`src/**/*.test.{ts,tsx}`と明示し、e2e/のspecを収集しないよう分離。既存3ファイル・55件はすべて維持した。
- .gitignore：playwright-report/とtest-results/を追加。ブラウザバイナリ、スクリーンショット、trace等はコミットしない。
- package-lock.json：Playwright関連3パッケージの追加のみ。アプリ機能コード・保存形式/キー・GitHub Actions・Rulesetは変更していない。

### E2Eケースと実測

| ID | 内容 | 実行件数 | 結果 |
|---|---|---:|---|
| E01 | 空一覧、ボタン/Enter追加、編集、取消、削除確認の取消/許可、対象外保持 | 1 | Pass |
| E02 | 未完了→完了→未完了、件数、他タスク保持 | 1 | Pass |
| E03 | 3フィルター、表示対象、保存データ不変、完了/未完了0件 | 1 | Pass |
| E04 | 追加後リロード、編集/完了/削除復元、フィルター初期化 | 1 | Pass |
| E05 | 追加/編集の空・空白・trim・200文字受理・201文字拒否・警告 | 1 | Pass |
| E06 | Enter・Tab/Shift+Tab・編集開始/保存後のフォーカス・Esc取消 | 1 | Pass |
| E07 | 幅320/375/390pxの長文、横はみ出し、追加・編集・削除操作 | 3 | Pass |
| 合計 | E01〜E07 | 9 | Pass 9 / Fail 0 |

E07はChromiumのviewportを変え、ページ横幅とボタンの境界・表示・操作を確認した。実モバイル端末、タッチ、ソフトウェアキーボードや表示品質全般を保証する検証ではない。

### 実行コマンド・結果・環境問題

```powershell
npm.cmd install -D --save-exact @playwright/test@1.64.1
npx.cmd playwright install chromium
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run test:coverage
git diff --check
git diff --cached --check
```

- 既存Vitestは55/55（3ファイル）成功し、E2Eの混入なし。lint・build・E2E用TypeScript型検査も成功した。
- 初回E2Eは9件すべて成功表示となったが、制限付き実行環境でwebServerの終了待ちが継続した。プロセスのコマンド行から今回起動したpreview/Playwrightだけを識別し、残留previewを終了して実行を回収した。既存のユーザーサーバーは終了していない。
- 環境上の終了処理として分類し、権限制限外で同じ`npm.cmd run test:e2e`を再実行。9/9成功、終了コード0、previewの自動終了と4173番の解放まで確認できた。アプリやテストコードの変更で隠していない。
- 対処・再検証は1回、コード修正は0回。アプリ本体の不具合は今回の実測では見つかっていない。
- coverageも55/55成功。対象7ファイルのStatements/Branches/Functions/Linesは100%のままで、測定対象・除外を変更していない。E2Eのカバレッジ値ではない。
- 導入前後ともnpm auditはmoderate 12件（minimatch由来の開発依存警告）、high/critical 0件。導入後の本番依存auditは0件。新規脆弱性の増加はなく、force修正やoverridesは行っていない。

### 手動受入との分担・残課題

- Chrome手動受入の12 Pass / 1 Not Testedは変更しない。E2Eの9 PassはローカルビルドをChromium headlessで操作した別の結果である。
- ユーザーからEdgeの手動テストについて「全実施項目Pass」との報告があった。ただし対象ケース、環境・版、証拠の詳細は未確認であり、A13まで全件Passと推定しない。前節のEdge未実施は当時の記録として残す。
- OSの日本語IME変換候補・確定操作はPlaywrightだけで検証済みとしない。A13、ナレーター/スクリーンリーダー、200%拡大、実端末、本番受入は未実施または詳細未確認のまま引き継ぐ。
- E2EのCI統合は別PR。今回のGitHub Actionsは既存55件・lint・buildのみで、PlaywrightをCI実行したとは報告しない。Ruleset・Vercel設定も変更しない。
- `test:e2e:ui`は起動用スクリプトを用意したが、対話UIの継続操作は今回未検証。
- PR作成後は最新HeadのValidate・Vercel・Ruleset・競合・未解決レビューを確認し、PR本文と最終報告へ記録する。マージは行わない。
