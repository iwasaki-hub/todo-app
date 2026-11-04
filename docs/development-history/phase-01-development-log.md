# Todo App — Phase 1 開発履歴

本書はプロジェクト開始からP1の本番デプロイまでを記録する。記録日は2026-11-04。Gitの日時は日本時間（JST）で示す。

情報は次の区分で扱う。

- **確認済み**：今回読み取ったファイル、Git履歴、GitHub API、Vercel APIで確認できた事実。
- **過去の実行記録**：この会話で確認できるCodexの実行結果、報告、PR本文。今回の再実行とは区別する。
- **参考情報**：今回の依頼に記載された経緯。裏付けがない部分は未確認とする。
- **今後の対応**：未実施の計画・推奨事項。

## 1. プロジェクト概要

ログイン不要で個人のタスクを管理するアプリを作り、React・TypeScript、テスト、GitHubとVercelの運用を学ぶことを目的とする。保存先は同じブラウザのlocalStorageであり、クラウド同期・外部API・外部DB・認証はMVP対象外。

開発環境は依頼に記載されたWindows 11、VS Code、Codex。過去の実行ではPowerShell、Node.js v26.13.0を確認した。npmは実行経路によって11.20.0と11.7.0が出力されており、全期間を単一バージョンとして扱わない。

| 項目 | 構成 |
| --- | --- |
| ソース管理 | [iwasaki-hub/todo-app](https://github.com/iwasaki-hub/todo-app) |
| 本番公開 | [Todo App](https://todo-app-phi-one-43.vercel.app/) |
| UI | React + TypeScript |
| 開発・ビルド | Vite、Node.js、npm |
| 保存 | localStorage |
| リポジトリ | ルートにpackage.jsonを持つ単一アプリ |

モノレポを一時検討したという経緯は今回の依頼の参考情報であり、検討時の記録や変更コミットは確認できなかった。設計書・AGENTS.mdは単一Viteプロジェクトを明示し、実際の構成にも複数アプリやワークスペースの導入はない。単一アプリを採用した最終方針は確認できるが、検討理由・判断日時は未確認。

## 2. 開発開始前の準備

初期ソースと設定からReact + Vite + TypeScriptを採用したことが確認できる。Reactは表示と状態管理、TypeScriptは型検査、Viteは開発サーバーと静的ファイル生成を担う。具体的な選定比較の議事録はない。

Git履歴には次の開始点がある。リポジトリをGitHub上で作成した操作・正確な作成時刻は、この履歴だけでは確定できない。

| JST日時 | コミット | 内容 |
| --- | --- | --- |
| 2026-11-04 15:21:09 | 5b5fb2d6ca62592dd7f261220d2d805ed69b6b84 | Initial commit |
| 2026-11-04 15:28:38 | 863358d0614b40cbe2d3ffa651d87405337bba05 | create react project |

Vercelの取得できた履歴では、初期Reactコミット863358dをmainからProductionに公開したデプロイがREADYになっている。これは初期公開の成功を裏付ける。連携を設定した画面操作そのものは未確認。

.gitignoreにはdistとnode_modulesが含まれている。distはビルドで再生成する成果物であり、ソースと二重管理しないためGitに含めない。node_modulesもロックファイルから復元する。

```sh
npm ci
npm run build
```

package.jsonのbuildは次の処理を行う。

```sh
tsc -b && vite build
```

TypeScriptの型検査に成功した後、Viteがdistに配信用ファイルを生成する。基本設計ではルートを./、ビルドをnpm run build、出力をdistとする。今回Vercelの個別設定値をすべて読み取ったわけではないが、Git起点のデプロイ成功はAPIで確認した。

## 3. P0：現状分析

CODEX_PROMPT.mdと当時の依頼は、設計書・ソース・依存関係・Git状態の調査、初期検証、P1の計画提案を指示していた。機能コードの変更は禁じ、分析報告で停止する範囲だった。

初期構成はルートのpackage.json、package-lock.json、Vite・TypeScript・ESLint設定と、src/App.tsx、App.css、index.css、main.tsx、assets、publicであった。初期コミットのApp.tsxはカウンターとVite関連リンクを持つスターターで、Todo機能は未実装。基本設計の現状記載と一致していた。

過去の実行記録では、開始時のmainからchore/p0-analysisを作成した。最初のブランチ作成はGit管理領域への書き込み制限で失敗し、許可された実行で成功した。未追跡のAGENTS.md、CODEX_PROMPT.md、docs/は保持した。

```sh
git status --short
git branch --show-current
npm ci
npm run lint
npm run build
```

P0時点のnpm ciはEPERMで失敗し、lintはeslint、buildはtscが見つからず失敗した。アプリの構文エラーが検出された結果ではなく、依存関係の復元失敗に続く実行不能だった。

改善候補として、型・保存処理・Hook・表示の分離、安全な永続化、日本語化、レスポンシブ対応を整理した。追加の注意点は、.gitignoreに.env*の包括的な除外がないこと、TypeScript設定にstrictの明示指定がないことだった。これらの設定変更はP1で実施していない。

## 4. P0.5：開発環境の復旧

過去の実行でnpm ciは、次のファイルを削除する段階でEPERMとなった。EPERMはOSが操作を許可しなかったことを示す。

```text
node_modules/@rolldown/binding-win32-x64-msvc/rolldown-binding.win32-x64-msvc.node
```

npm ciが既存依存の削除途中で停止したため、node_modulesが不完全になり、eslint・tscの実行ファイルが欠けた。権限制限外でnpm ciを再実行しても同じ削除エラーが起きた。

原因候補はファイルの使用中、セキュリティソフトの干渉、アクセス権だった。対象ファイルには変更権限があることを確認し、Nodeプロセス情報とnpmログも調査したが、ロック主体や根本原因は断定できなかった。プロセスの強制終了、強制削除は行っていない。

その後、P1依頼時にユーザーからnpm ci・lint・buildの成功が報告された。P0.6およびP1・PR作成時のlint・build成功も確認できるため、開発可能な状態への復旧は裏付けられる。ただし、**成功したnpm ciの実行ログと、再実行前に行った具体的な復旧操作はこの会話にない**。再実行だけで解決したと断定しない。

今後の再検証手順は次のとおり。これは当時の成功した復旧操作を再現した記録ではない。

```sh
npm ci
npm run lint
npm run build
```

## 5. P0.6：セキュリティ調査

過去の実行で全依存のauditにmoderate 12件を再現した。本番依存のみのauditは0件だった。PR #1本文にもこの調査結果が記録されている。今回の文書作成ではauditを再実行していない。

```sh
npm ls minimatch
npm audit --json
npm audit --omit=dev
```

確認した依存経路は以下のとおり。ロックファイルのminimatchも10.2.6で、開発依存を示すdev属性がtrueになっている。

```text
eslint@10.14.0
├─ minimatch@10.2.6
└─ @eslint/config-array@0.23.5
   └─ minimatch@10.2.6

typescript-eslint@8.72.1
└─ @typescript-eslint/typescript-estree@8.72.1
   └─ minimatch@10.2.6
```

[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)はglobパターン処理によるサービス妨害の問題で、optimizationLevelが2以上の場合にCPU・メモリ消費が増幅する。対象は11.0.1未満、修正版は11.0.1。12件は独立した12種類の原因ではなく、minimatchと影響を受ける親パッケージを含む報告だった。

P0.6調査時、ESLint・config-array・typescript-estreeの公開最新版はminimatchの10系を指定しており、範囲内更新だけでは11.0.1へ移れなかった。typescript-eslint 8.72.1のpeerDependenciesはESLint 10とTypeScript 6.0.3を許容し、実際にlint・buildも成功した。

強制修正は指定範囲外への変更やダウングレードを招き、互換性を崩す可能性があるため実行しなかった。auditが示した古いtypescript-eslintへの変更も採用しなかった。

今後は親パッケージが修正版へ正式対応した段階で、依存ツリー・互換性・lint・buildを再確認して更新する。overridesによる強制置換は無条件には行わない。本番auditが0件でも、開発・CIの依存リスクは継続管理する。

## 6. P1：基本機能の実装

Codexへの依頼は、設計書を先に読み、Git状態を保全し、作業ブランチで追加・一覧・完了切り替え・削除・保存・復元を実装する内容だった。編集・フィルター・テスト依存導入・Push・本番デプロイはP1の範囲外だった。

実装用にfeat/p1-todo-basicsを作成した。Todo型は設計に従う。

```ts
type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}
```

IDはcrypto.randomUUID()、日時はtoISOString()で生成する。追加時はcreatedAtとupdatedAtを設定し、完了切り替えではupdatedAtを更新する。

| ファイル | 責務 |
| --- | --- |
| src/types/todo.ts | Todo型 |
| src/lib/todoStorage.ts | localStorageの検証・読み書き |
| src/hooks/useTodos.ts | タスク状態、追加・切り替え・削除、保存結果 |
| src/components/TodoForm.tsx | 入力、追加、入力エラー |
| src/components/TodoList.tsx | 一覧、空状態、件数 |
| src/components/TodoItem.tsx | チェック操作、削除確認 |
| src/App.tsx | 画面と各責務の接続 |
| src/App.css・src/index.css | 画面・共通スタイル |
| index.html | lang属性をjaに変更 |

保存キーはtodo-app:todos:v1。JSON解析結果をunknownとして扱い、配列と各フィールドの型、trim済みの1〜200文字のタイトル、ISO日時、ID重複を検証する。不正な場合は一覧全体を空にして警告する。

useTodosはuseStateの遅延初期化で読み込み、各操作から保存と状態変更を行う。useEffectは使っていない。基本設計のHook利用方針を、操作時保存として具体化した。StrictModeの初期化再実行でも書き込みを発生させず、不正データも初期表示だけでは上書きしない。新しい操作を行うと保存を試み、既存保存データを置き換えることを警告する。

読み書きはtry/catchで保護する。保存失敗でも画面の状態は更新し、再読み込みで変更が失われる可能性を表示する。ID生成失敗時もエラーを返す。

日本語UI、フォームラベル、aria-invalid・aria-describedby、警告のrole="alert"、フォーカスリングを実装した。完了はチェック状態と取り消し線で示す。480px以下でフォームを縦配置し、長い本文を折り返すCSSを追加した。これらはコード上の対応であり、実機表示の検証結果とは区別する。

入力制限と削除確認は実装計画ではP2の項目にも含まれていたが、基本設計に合わせてP1で実装した。編集・フィルターは実装していない。

## 7. テストと検証

以下は過去のP1実装時・PR作成時の結果である。本書作成中はアプリ用コマンドを再実行していない。

```sh
npm run lint
npm run build
git diff --check
git diff --cached --check
```

| 項目 | 結果・証拠 |
| --- | --- |
| lint | P0.6、P1、PR作成前に成功 |
| build | 型検査・ViteビルドともP0.6、P1、PR作成前に成功 |
| 差分チェック | PR作成前に通常差分・ステージ差分とも成功 |
| 保存処理 | P1でNodeの一時スクリプトを実行し成功。PR本文にも記載 |
| ブラウザ操作・画面 | 完了した記録なし。PR本文では未検証 |
| 自動テスト環境 | 未導入。package.jsonにtestスクリプトなし |

一時スクリプトはTypeScriptをメモリ内で変換し、ストレージを模擬して検証した。確認範囲は正常復元、不正JSON・型・日時・重複ID、ストレージアクセス失敗、複数回読み込み時に保存しないこと。正式なテストファイルとしては保存していない。React StrictModeのブラウザ実行そのものを検証した結果ではない。

P1中の差分チェックでindex.html末尾の余分な空行を検出し、修正後に成功した。CRLF変換に関するGitの通知は出たが、最終差分チェックのエラーはなかった。

未確認の手動項目は追加・空白拒否・文字数制限、完了切り替え、削除の承認・キャンセル、リロード後の保持、不正データ時の警告、キーボード・日本語IME操作、PC・モバイル表示。ProductionのREADYはこれらの受入確認の完了を意味しない。

## 8. GitHubとPull Request

P1.5では依頼によりGitHubへのPushとPR作成が許可された。既存履歴と未コミット変更を確認し、feature/todo-basicを作成した。P1の10ファイルだけを明示的にステージし、git add .は使用しなかった。AGENTS.md、CODEX_PROMPT.md、docs/は除外・保持した。

```sh
git switch -c feature/todo-basic
git diff --cached
git diff --cached --check
git commit -m "feat: implement basic todo functionality"
git push -u origin feature/todo-basic
```

コミットはb437190947028f8f474c623f8c95bc78280c946c、JST 2026-11-04 16:04:21。変更は10ファイル、237行追加・401行削除。

[PR #1](https://github.com/iwasaki-hub/todo-app/pull/1)はmainをベースとして作成し、タイトルは「feat: implement basic Todo app functionality」。本文に機能・変更ファイル・検証・例外処理・対象外・audit警告を記載した。

コードレビューについて、過去のCodex実行ではステージ差分の確認とHook・型・フォーム等の品質確認を行った。ただし、**今回のGitHub APIで取得したレビュー一覧は0件**。取得した会話コメントはVercel botのPreview READY通知であり、承認・指摘・修正対応のレビュー内容は確認できない。人間のレビュー完了とは記録しない。

今回の取得時点でPRはmerged=true。マージ結果は次のコミットである。

- SHA：b146ad100bed4ed3755ee8737e1737f170f3aada
- メッセージ：feat: implement basic todo functionality (#1)
- JST日時：2026-11-04 16:13:04
- 親：863358d0614b40cbe2d3ffa651d87405337bba05（1件）

作業コミットとは別のSHAを持ち、親が1件、内容のツリーが作業コミットと同一である。この形は依頼に記載されたSquash and mergeと整合する。マージボタンの操作自体は今回観察していない。「マージコミット」はここではマージ結果のコミットを指し、2親を持つ通常のmerge commitではない。

ローカルとGitHubの差異も確認した。

| 対象 | 文書作成時点 |
| --- | --- |
| 作業ブランチHEAD | b437190 |
| ローカルmain | 863358d。origin/mainより1コミット古い |
| ローカルorigin/main | b146ad1。GitHubのマージ結果と一致 |
| origin/mainと作業HEADのファイル内容 | git diffで差分なし。ツリーSHAも同一 |
| 設計書・作業ルール | ローカルでは存在するが未追跡。取得したmainのファイル一覧にはない |

今回mainへの切り替え、Pull、コミット、Pushは行っていない。

## 9. Vercel本番デプロイ

Vercel APIの記録から、GitHubのmainへの反映を起点とするProductionデプロイを確認した。

| 項目 | 確認結果 |
| --- | --- |
| プロジェクト | todo-app、frameworkはvite |
| ソース | git |
| ブランチ | main |
| 対象コミット | b146ad100bed4ed3755ee8737e1737f170f3aada |
| 環境 | production |
| state / readyState | READY / READY |
| Deployment ID | dpl_4WzAzLDgkpJjoD4wAugHvQQKFkwZ |

[本番デプロイ記録](https://vercel.com/masas-projects-39337881/todo-app/4WzAzLDgkpJjoD4wAugHvQQKFkwZ)を参照できる。初期mainのProduction READY、feature/todo-basicのPreview READY、その後のマージ結果のProduction READYという3件の履歴を取得した。CodexがP1.5でProductionデプロイを直接実行したのではなく、取得した記録はGitソースからの連携デプロイである。

公開URLは次のとおり。

- [固定の本番公開URL](https://todo-app-phi-one-43.vercel.app/)
- [mainブランチ用URL](https://todo-app-git-main-masas-projects-39337881.vercel.app/)

取得時点では両方が同じProductionデプロイのalias（別名URL）として登録されている。別アプリではない。ただしURLの割り当ては将来のデプロイで変わり得る。localStorageはオリジン（スキーム・ホスト・ポート）単位のため、両URLで表示するアプリが同じでも保存タスクは共有されない。

今回の確認はAPI上のREADYとコミット・aliasの対応まで。公開画面の操作、保存・復元、利用者による受入確認は未確認である。

## 10. 発生した問題と解決方法

### npm ciのEPERMと不完全な依存関係

- 発生した現象：ネイティブファイルの削除失敗後、eslint・tscが起動できなくなった。
- 原因または原因候補：使用中ファイル、セキュリティソフト、権限。根本原因は未確定。
- 実施した対応：npm ci再試行、権限・プロセス・ログの読み取り。強制削除は行わなかった。その後、ユーザーから復旧成功の報告があった。
- 検証結果：後続のlint・build成功。成功したnpm ciの生ログと具体的な復旧操作は未確認。
- 再発防止策：今後は依存更新前に関連プロセスの使用状況を確認し、復旧コマンドと結果を残す。npm ci失敗後は依存復元までコードエラーと混同しない。

### Git書き込み・audit通信の実行制限

- 発生した現象：P0のブランチ作成が失敗し、P0.6の最初のauditもエンドポイントへ接続できなかった。
- 原因または原因候補：実行環境のGit管理領域・ネットワークへの制限。
- 実施した対応：必要な操作を許可された実行で再試行した。
- 検証結果：ブランチ作成成功。auditではmoderate 12件、本番依存0件を確認。
- 再発防止策：今後も権限制限とアプリの不具合を分けて記録し、不要な管理者操作・設定変更を避ける。

### 開発依存のmoderate警告

- 発生した現象：minimatch由来で12パッケージが警告対象になった。
- 原因または原因候補：親パッケージが修正済み11系を許容していなかった。
- 実施した対応：依存経路・本番影響・peerDependenciesを調査し、強制更新やoverridesを見送った。
- 検証結果：本番依存auditは0件、lint・buildは成功。開発依存の警告自体は未解消。
- 再発防止策：今後、親パッケージの対応状況を継続確認し、互換性を検証して更新する。

### HTML末尾の空行

- 発生した現象：P1のgit diff --checkで新しい余分な末尾空行を検出した。
- 原因または原因候補：ファイル書き込み時に改行が重複した。
- 実施した対応：index.html末尾を単一改行に修正した。
- 検証結果：差分チェック成功。
- 再発防止策：今後もコミット前に差分チェックを実行する。

## 11. Codexを使った開発から得られた知見

設計書を先に用意すると、データ型・保存キー・対象外機能・完了条件を共通の基準にできる。今回もrequirements、basic-design、implementation-planの役割を分けて参照した。ただし設計書はまだGit管理されていないため、共有・レビュー可能な状態にする対応は今後の検討事項である。

P0の分析、P0.6の調査、P1の実装、P1.5のPR作成を分け、各依頼に変更可能範囲と停止条件を指定したことで、依存更新や本番操作を実装と混在させずに進められた。P0.5の復旧は成功した具体的な操作記録が不足しており、今後は復旧過程も残す。

再利用する指示には、読むファイル、目的、対象機能、対象外、ブランチ、変更禁止ファイル、検証コマンド、最終報告と停止条件を含める。たとえば次のように操作と検証を明示する。

```text
AGENTS.mdと設計書を先に読み、git statusを確認する。
既存変更を保持して作業ブランチで指定機能だけを実装する。
依存関係・本番設定は変更しない。
lint・build・差分チェックの結果と未検証事項を報告して停止する。
```

Codexによる実装・静的検査・限定的な再現確認と、人間による画面操作・仕様判断・マージ判断を分担する。lint成功は機能の正常動作を、READYは受入確認の完了を保証しない。今回、GitHubにレビュー承認がないこととブラウザ確認の記録不足は、成功記録に混ぜず残した。

PRでは差分・検証結果・未実装・既知の警告をまとめ、mainへの直接Pushを避けた。今後の本番反映前は、Previewで追加・切り替え・削除・復元、PC・モバイル、キーボード・IMEを確認し、対象SHA・環境・READY・公開aliasを照合することを推奨する。

## 12. 次の開発フェーズ

以下は計画であり、本書作成時点では未実装。

- P2：本文編集・キャンセル、全件／未完了／完了フィルター、UI改善、キーボード・スマートフォン確認。削除確認と追加時の基本バリデーションはP1で実装済み。
- P3：Vitest、React Testing Library、jsdomを導入し、操作・永続化・例外処理の自動テストを作成する。
- P4：GitHub ActionsでPRのlint・型検査・testを実行し、既存Vercel連携と組み合わせてCI/CDを強化する。
- 継続対応：開発依存の脆弱性と親パッケージの更新状況を調査する。

### 参照した情報源と記録の限界

- ローカル：AGENTS.md、CODEX_PROMPT.md、docs/requirements.md、docs/basic-design.md、docs/implementation-plan.md。
- ローカル：package.json、package-lock.json、.gitignore、src/とindex.html、初期コミット・作業コミット・origin/mainの履歴とツリー。
- ロックファイルで確認したバージョン：React / React DOM 19.3.1、Vite 8.3.5、TypeScript 6.0.3、ESLint 10.14.0、typescript-eslint 8.72.1、minimatch 10.2.6。package.jsonの範囲指定とは区別した。
- GitHub：[PR #1](https://github.com/iwasaki-hub/todo-app/pull/1)、レビュー一覧、コメント、[マージ結果コミット](https://github.com/iwasaki-hub/todo-app/commit/b146ad100bed4ed3755ee8737e1737f170f3aada)。
- Vercel：公開aliasのデプロイ詳細、対象プロジェクトのデプロイ履歴、PR上のbot通知。
- セキュリティ：[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)。
- 過去の実行：この会話に残るP0、P0.6、P1、P1.5のツール結果・報告。別セッションのチャットや非公開の操作履歴は参照していない。

本書作成では対象Markdown以外を変更せず、依存導入、アプリの再ビルド、コミット、Push、PR作成、デプロイは行っていない。今回実行した最終差分チェックは文書の形式確認であり、上記の過去のアプリ検証とは別である。
