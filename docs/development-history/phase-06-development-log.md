# Phase 06：アクセシビリティ検証

## 1. 対象・情報源と記録方針

- 対象：[iwasaki-hub/todo-app](https://github.com/iwasaki-hub/todo-app)。本記録の開始基準mainは`215f6b5b6111272e8fa8c1911bd7bdb8bbcba6f7`。
- `AGENTS.md`と[AI Development Standard v1.2.0](https://github.com/iwasaki-hub/AI-Development-Template/blob/v1.2.0/AI_Development_Standard_v1.md)を確認。ユーザー報告、コード静的調査、DOMテスト、実ブラウザ自動検査、CI、デプロイ完了を区別する。
- 手動検証の情報源は今回のユーザー報告。CodexがChrome・Edge・ナレーターを直接操作した結果ではない。今回の文書作業では手動検証を再実施していない。
- 自動検査の情報源はソースコード、[PR #17](https://github.com/iwasaki-hub/todo-app/pull/17)、GitHub Actions実行とジョブログ。SHA・マージ日時・CI結果・Ruleset・Productionの情報を記録時にAPIで照合した。
- [Phase 5履歴](phase-05-development-log.md)は当時の記録として維持する。そこで未確認だったナレーター・IME・拡大等について、以下に今回報告された範囲の後続結果を記録する。過去のPhase 5 A13や今回のAX番号を同一ケースとして扱わない。

## 2. Phase 6-A：現状調査と受入設計

要件・基本設計・実装計画・履歴、App、各Todoコンポーネント、CSS、Hooks、Vitest、Playwrightを調査した。コードで確認できる実装と、実環境での操作・読み上げ結果を区別した。

| 受入ID | 確認対象 |
|---|---|
| A01 | キーボード到達性、Tab / Shift+Tab、Enter / Space |
| A02 | フォーカスの可視性と隠れ |
| A03 | タスク追加、入力検証と追加後のフォーカス |
| A04 | 編集開始・保存・キャンセル・Escapeとフォーカス復元 |
| A05 | 削除確認、取消、削除後のフォーカス |
| A06 | フィルター選択、行が消える場合のフォーカス |
| A07 | Windowsナレーターでの名前・役割・状態の理解 |
| A08 | 入力・保存エラーの関連付けと読み上げ |
| A09 | 200%拡大、320 CSS px相当の狭幅、文字サイズ拡大 |
| A10 | 文字・状態・境界・フォーカスのコントラスト |
| A11 | 件数、空状態、変更結果の通知 |
| A12 | 追加・編集の実日本語IME、確定Enter・Escape |

- 既存対応：mainと見出し階層、日本語lang、可視フォームラベル、aria-invalid / aria-describedby、エラーのrole=alert、件数・空状態のrole=status、フィルターのaria-pressed、本文を含む編集・削除名を確認した。
- フォーカスは追加後の入力復帰、編集開始時の入力選択、保存・キャンセル後の編集ボタン復帰を実装済み。CSSにはfocus-visible、長文折り返し、狭幅レイアウトがある。
- 初期の優先懸念は、削除後とフィルターによる行消失後のフォーカス、追加フォームに明示的IME保護がない点だった。通知の重複・欠落、拡大時の表示も手動確認事項とした。静的調査だけで再現済み不具合と断定していない。
- CSS指定色の計算では主要本文・補助本文・エラー・主要ボタン・フォーカスの代表的な組み合わせを確認したが、全状態の画面実測やWCAG適合判定とは区別した。
- 200%のブラウザズームと320 CSS pxのviewport検証は別の条件として設計した。ARIA属性の存在、DOMシミュレーションやaxeの成功を支援技術の実動作保証に代用しない。

## 3. Chrome手動受入：ユーザー報告

環境はWindows 11 / Google Chrome。実施者はユーザー。

| 報告されたケース群 | 対象 | Pass | Fail | Not Tested |
|---|---|---:|---:|---:|
| F01〜F06 | キーボード・フォーカス | 6 | 0 | 0 |
| N01〜N07 | Windowsナレーター | 7 | 0 | 0 |
| Z01〜Z05 | 拡大表示・日本語IME | 5 | 0 | 0 |
| 今回実施した18ケースの合計 | ユーザー手動検証 | 18 | 0 | 0 |

Chromeの実バージョン、OS表示倍率、IME製品名、実施日時、ケースごとの詳細操作ログや証拠は未提示。各F/N/Z番号の詳細な手順を推測で補完しない。上表はA01〜A12すべての条件を網羅したという意味ではない。

## 4. Edge手動受入：ユーザー報告

環境はWindows 11 / Microsoft Edge。実施者はユーザー。

| ID | 確認対象 | 結果 |
|---|---|---|
| E01 | キーボードとフォーカス | Pass |
| E02 | ナレーターの読み上げ | Pass |
| E03 | エラーと状態通知 | Pass |
| E04 | 200%拡大・320px表示 | Pass |
| E05 | 日本語IME | Pass |

合計5件Pass / 0件Fail。Edgeの実バージョン、OS表示倍率、IME製品名、実施日時、詳細な証拠等は未確認として扱う。

## 5. 手動検証の総括と限界

- Chrome 18件＋Edge 5件＝23件Pass。今回報告された検証範囲では不具合報告なし。
- 削除後・フィルター変更後のフォーカスも今回の手動検証ではPassとのユーザー報告がある。初期調査の懸念を全環境で再現する不具合とは扱わない。一方、すべてのデータ・操作条件の網羅を推定しない。
- ナレーター、日本語IME、200%拡大はPhase 6-Aでユーザーが手動検証済みと報告した事項である。「未実施」という過去記録と時系列を分ける。
- 23件Passは他の支援技術、ブラウザ、端末、全操作条件やWCAG 2.2 AA完全適合を保証しない。今回の文書工程で操作・読み上げの再試験は行っていない。

## 6. Phase 6-A-3：axe自動検査の導入

- PR #17で`@axe-core/playwright` 4.14.0を開発依存へ完全版固定で追加し、`axe-core` 4.14.0を導入した。既存パッケージの版は変更していない。
- 安定版、Node >=22.12.0、peer依存playwright-core >=1.0.0を導入前に確認。ローカルNode 26.13.0、CI Node 24.22.2、Playwright 1.64.1と整合し、型検査・実行も成功した。
- `e2e/accessibility.spec.ts`に以下6件を追加。Phase 5 A13や手動ケース番号と混同しない。

| ID | 画面状態 | main向けCI violations | main向けCI incomplete |
|---|---|---:|---:|
| AX01 | 空一覧 | 0 | 0 |
| AX02 | 未完了・完了を含む複数タスク一覧 | 0 | 0 |
| AX03 | タスク編集中 | 0 | 0 |
| AX04 | 追加入力エラー | 0 | 0 |
| AX05 | 編集エラー | 0 | 0 |
| AX06 | フィルター結果0件 | 0 | 0 |

- 対象状態をassertionで確認してからaxeを実行。タグはwcag2a / wcag2aa / wcag21a / wcag21aa / wcag22aa。個別ルール無効化・要素除外・skip・リトライ追加は行っていない。
- 各テストは独立BrowserContextと保存キー未設定の状態から開始。既存webServerがローカルビルドと127.0.0.1:4173のpreviewを管理し、外部通信は遮断する。本番URLでは実行していない。
- violations / incompleteのルールID、影響度、対象、説明をログとaxe-results JSON添付へ記録する。今回の6状態では両方0件。
- 対象はCIのChromium環境。Chrome・Edge＋ナレーターの手動確認、実IME、実際のブラウザズームの代替ではない。axe違反0件をWCAG完全適合と表現しない。
- PR #17の変更はpackage.json、package-lock.json、e2e/accessibility.spec.tsの3ファイル。アプリ本体・CSS・既存E2E9件・Workflow・Rulesetは変更しなかった。ローカルVitest55件、lint・build、Playwright15件成功。修正ループ0回。

## 7. PR #17のマージとmain向け確認

| 項目 | 確認結果 |
|---|---|
| PR | [#17](https://github.com/iwasaki-hub/todo-app/pull/17)、Merged |
| 承認対象Head | `fb63a66ed323a79c92061f2a0ed5f9bd2936cbef` |
| PR向けCI | [41978773804](https://github.com/iwasaki-hub/todo-app/actions/runs/41978773804)、success |
| PR向けcheckout | 合成マージ参照`3470b2a146a6b4af4ca35dc740c8884e96bd8ff3`。上記Headと当時のmain `f957fdec3dbc6e80f5203fb2c38b15fa878b7c93`の対応をログで確認 |
| マージ方法 | ユーザーの明示承認後、通常のSquash and merge |
| マージ日時 | 2026-11-05 15:17:21 JST（APIの2026-11-05T06:17:21Zから換算） |
| SquashマージSHA・マージ後main | `215f6b5b6111272e8fa8c1911bd7bdb8bbcba6f7` |
| main向けCI | [41979415234](https://github.com/iwasaki-hub/todo-app/actions/runs/41979415234)、pushイベント、completed / success |
| main向け検証SHA | 上記マージSHAと一致 |
| Validate | Vitest 55件、Lint、Build成功 |
| E2E | 既存Playwright 9件＋axe 6件＝15件成功 |
| axe | AX01〜AX06すべてviolations 0 / incomplete 0をジョブログで確認 |

自動テストはVitest 55件＋Playwright 15件＝計70件。ユーザー手動23件とは別の母集団であり、同じケースを93件の独立した受入基準として扱わない。PR向けCI成功とマージ後push CI成功も別の実行として記録する。

- Vercel ProductionはREADY、デプロイ元main、対象SHAは`215f6b5b6111272e8fa8c1911bd7bdb8bbcba6f7`と一致。マージ後の確認記録に加え、今回もVercel APIで照合した。
- 本番URL：[https://todo-app-phi-one-43.vercel.app/](https://todo-app-phi-one-43.vercel.app/)。URLの維持とデプロイ完了は、本番機能受入の成功とは区別する。手動デプロイ・本番受入操作は実施していない。
- [Ruleset main-pr-ci](https://github.com/iwasaki-hub/todo-app/rules/26534556)はActive。必須はGitHub Actions発行の`Validate (test, lint, build)`と`E2E (Playwright)`の2件。今回の文書工程ではRuleset等を変更しない。

## 8. 未実施事項と引き継ぎ

- Phase 6-B：iPhone Safari実機検証。
- Phase 6-C：本番環境の機能受入。
- 他の支援技術や端末条件、未提示の手動操作条件の追加検証。
- 将来のaxe検査対象・状態の拡張。違反0件でも手動受入を継続する。
- 依存関係のセキュリティ警告の再評価は後続Phase。PR #17導入時のauditはmoderate 10件と記録されているが、今回再検査していない。過去のmoderate 12件と検査時点を区別する。
- PR #17の自動CIはナレーター・実IME・200%拡大を直接再検証していない。それらの今回の成功根拠はユーザー手動報告である。

## 9. この文書の検証と保存工程

- 開始時の作業ツリーはクリーン。fetch後origin/mainと指定基準SHAの一致を確認して、`docs/phase-06-accessibility-results`を新規作成した。既存ブランチは上書き・削除していない。
- 変更対象は本Markdownのみ。Phase 5履歴・アプリ・依存・Workflow・Rulesetは変更しない。秘密情報・個人情報・推測した版や実施日時を記載しない。
- 見出し・表・リンク・SHA・23件/70件の区別を点検。AGENTS.mdに従いローカルtest・lint・buildと通常/ステージ済み差分チェックを行い、結果をPR本文・最終報告へ記録する。
- この文書PRのCI結果はPR #17のマージ後CIとは別の実行として扱う。PR番号・Head・最新チェックは作成後に確認する。文書PRのマージ・本番結果は未確定であり、今回マージせず停止する。
