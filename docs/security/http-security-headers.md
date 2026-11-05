# HTTPセキュリティヘッダー（Phase 7-B4-1）

## 目的と対象

基準mainは`5d2d08af35cb13a6521dd98b0f462bf8a4a33450`。Vercelの`vercel.json`で基本ヘッダーを強制適用し、CSPはReport-Onlyとして導入する。対象は`source: "/(.*)"`で、トップページと静的アセットを含む全パス。SPA rewrite、ビルド設定、依存、アプリ、favicon、Workflow、Ruleset、管理画面は変更しない。

## 導入前の調査結果

2026-11-05、[Production](https://todo-app-phi-one-43.vercel.app/)と、そのHTMLが参照した`/assets/index-C8lyyc6c.js`、`/assets/index-C6r8PkOs.css`にHEAD・GETを各1回実施した。計6レスポンスは200で、対象ヘッダーはHEADとGETで一致した。

| 項目 | 導入前の実測 |
| --- | --- |
| CSP / CSP Report-Only | いずれもなし |
| X-Content-Type-Options / Referrer-Policy / X-Frame-Options / Permissions-Policy | なし |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| Cache-Control | `public, must-revalidate, max-age=0` |
| Content-Type | HTMLはtext/html、JSはapplication/javascript、CSSはtext/css（いずれもcharset=utf-8） |

これは過去の読み取り調査であり、今回のPreview実測や全パスの保証とは区別する。

## 設定内容

| ヘッダー | 値 | 目的 |
| --- | --- | --- |
| X-Content-Type-Options | `nosniff` | MIME型の誤判定を抑制 |
| Referrer-Policy | `no-referrer` | Referer経由の情報送信を抑制 |
| X-Frame-Options | `DENY` | フレーム埋め込みを拒否 |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | 不要な端末機能を禁止 |
| Content-Security-Policy-Report-Only | 下記全文 | 将来の強制CSPに向けた互換性の診断 |

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-src 'none'; frame-ancestors 'none'; worker-src 'none'; manifest-src 'none'; form-action 'none'
```

強制用Content-Security-Policyは設定しない。unsafe-inline、unsafe-eval、ワイルドカード、data:、blob:の許可は追加しない。HSTSはVercelの既存値を維持し、Cache-Controlも定義・上書きしない。

## Report-Onlyの理由と制約

本番ビルドは同一オリジンの外部JS・CSS、システムフォント、localStorageを利用する。不要なリソースを制限する候補を、遮断せず診断する段階である。Report-Onlyの違反はリソース遮断の証拠ではなく、正常表示も強制CSPへの適合証拠ではない。

report-uri、report-to、Reporting-Endpointsや受信サーバーは追加せず、CSP違反レポートをサーバー収集しない。Console・違反イベントの観測可否はブラウザごとに確認が必要で、何も表示されないことだけで違反0としない。フレーム拒否の実効性はX-Frame-Optionsによるもので、Report-Onlyのframe-ancestorsが拒否したとは扱わない。

favicon.svgにはstyle属性がある。Report-Onlyで表示できても強制時の表示は未保証。Vercel Toolbarや拡張機能の警告はアプリ固有の違反と区別し、無条件に許可を広げない。

## 検証記録

2026-11-05、初回実装コミット`492a7591ba8bb1ac35c28088257eb487974c394b`に対する[Preview](https://todo-p445asmhc-masas-projects-39337881.vercel.app/)をVercel APIでREADYと確認した。デプロイIDは`dpl_DpqocwTKQUqr2ubHu6aWP7SGJijg`、デプロイ元は作業ブランチ`feat/phase-07-security-headers-report-only`で、対象SHAは同コミットと一致した。この後の文書追記コミットとは区別する。

同Previewの`/`へ未認証のHEAD・GETを各1回送り、いずれも302、LocationはVercel SSO、Content-Typeはtext/plainだった。これはTodo HTMLではなく認証保護の応答であるため、そこで返るX-Frame-Options等を設定反映の成功として扱わない。認証情報やCookie値は本書へ記録しない。

| 検証対象 | HEAD | GET | 判定 |
| --- | --- | --- | --- |
| `/` | 302（SSO） | 302（SSO） | Todoのヘッダーは未確認 |
| Preview HTMLが参照するJS | 未実施 | 未実施 | Todo HTMLを取得できずパス未特定 |
| Preview HTMLが参照するCSS | 未実施 | 未実施 | 同上 |
| `/favicon.svg` | 未実施 | 未実施 | 認証保護を回避せずユーザー確認へ引き継ぐ |

アプリ本体のContent-Type、基本4ヘッダー、CSP Report-Only、強制CSP不在、HSTS・Cache-ControlのHEAD/GET実測はすべて未確認。設定ファイルにHSTS・Cache-Controlの上書きがないことは静的確認済みだが、アプリレスポンスでの維持を検証済みとはしない。

PreviewでのJS/CSS読み込み、favicon表示、ConsoleのCSP警告・違反イベント、Todo追加・編集・削除・完了切替・フィルター、再読み込みとlocalStorage、日本語入力・エラー、X-Frame-Optionsによる埋め込み拒否は未実施。認証済みブラウザを使った自動化も実施していない。実OSのIMEは自動入力による代用では保証しない。

### 認証済みユーザーによる追加確認手順

1. PRのVercel Previewへ正規の権限でログインし、実際にTodo画面が表示されることを確認する。最新Headに対応するPreview URL・SHAも控える。
2. DevToolsのNetworkでキャッシュを無効化して再読み込みし、Document、参照JS/CSS、faviconのURL・ステータス・Content-Type・対象全ヘッダーを記録する。GETとHEADは別々に確認し、HEADは認証を維持できるブラウザのfetch等で行う。Cookieや認証値を共有ログへコピーしない。
3. 基本4ヘッダーとReport-Onlyの値をvercel.jsonと照合し、強制CSPがないことを確認する。HSTS・Cache-Controlも導入前と比較する。
4. ConsoleでCSP警告の有無と対象リソースを確認する。レポート受信先なしの警告・アプリ由来・Toolbar由来を区別する。違反イベントを観測できなければ未確認のままとする。
5. テスト専用ブラウザプロファイルでQAタスクの追加・編集・取消・削除、完了切替・フィルター、再読み込み・保存、日本語IMEと入力エラー、faviconを確認する。通常利用のデータを消さない。
6. 別の非本番テスト文書からの埋め込みでX-Frame-Optionsの拒否を確認する。認証リダイレクトによる拒否とアプリ本体のDENYを区別する。未実施項目は未実施として報告する。

ローカル検証（2026-11-05）：JSON解析、source、5ヘッダーの重複・値、CSP13ディレクティブ、強制CSP/HSTS/Cache-Control/不要な設定の不在を確認して成功。test→lint→build→testの順に成功し、Vitest59件を2回成功、Playwright15件成功、AX01〜AX06はすべてviolations 0 / incomplete 0。修正ループ0回。既存E2EのVite previewはvercel.jsonを配信ヘッダーへ反映しないため、実測Previewの検証とは区別する。

Previewが認証・SSO保護される場合は認証画面をTodoのレスポンスとして扱わず、保護を変更・回避しない。認証済みユーザーによるNetwork/Console・機能確認を未実施項目として引き継ぐ。

## 強制CSP移行の受入条件

1. 実際のVercel PreviewでHTML・参照JS/CSS・faviconのHEAD/GET、Content-Typeと全対象ヘッダーを確認する。
2. Chrome・Edge・Safari等でConsole・違反イベントを確認し、観測不能な項目を区別する。
3. 隔離ブラウザで追加・編集・削除、完了・フィルター、再読み込み・保存、日本語IME・入力エラー、favicon表示を確認する。
4. 非本番環境でフレーム埋め込み拒否を確認する。
5. 強制CSPへの切り替えは別の明示承認とPRで実施し、強制状態で同じ受入を再検証する。自動テスト成功・違反0だけで全セキュリティ要件を満たすとは判断しない。

Productionは今回未変更。Preview成功をProduction反映と混同しない。マージ承認後の自動デプロイでは、Production READY・mainとのSHA対応、実ヘッダーと機能受入を別々に確認する。

## ロールバック

非互換が見つかった場合は、このvercel.jsonのヘッダー設定を戻す独立PRを作り、承認後の自動デプロイで復旧を確認する。mainへ直接Push、保護回避、手動デプロイは行わない。今回HSTSを変更しないため、HSTSのブラウザ保持期間を操作するロールバックは対象外。

## 参照

- [Vercel headers仕様](https://vercel.com/docs/project-configuration/vercel-json#headers)
- [MDN CSP Report-Only](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only)

## Phase 7-B4-2：強制CSPのPreview検証

上記はPhase 7-B4-1当時の記録として維持する。本節は後続工程であり、基準mainは`47eb9c8efdcb4a77492a5ce2a17fbfe7826eff87`。PR #22で導入したReport-Onlyと同じ値を、作業ブランチ`feat/phase-07-enforce-csp`のContent-Security-Policyへ切り替える。Report-Onlyは残さず、二重適用を避ける。基本4ヘッダー、source、ポリシー値は変更せず、HSTS・Cache-Control・rewrite・ビルド設定も追加しない。

### 理由と前工程の確認結果

Report-Onlyでは遮断できないため、同じ候補ポリシーを強制した状態で必要な機能との互換性を確認する。これはPreview検証PRであり、本番反映やマージの許可ではない。

ユーザー報告によるPR #22のPreview手動受入では、HTML・JS・CSS・faviconの基本ヘッダーとReport-Only値、強制CSP不在、Todo機能T01〜T08 Pass、Toolbar由来CSP警告、iframe対象HTMLのHTTP 200・X-Frame-Options: DENYと非表示が確認された。Codex自身のブラウザ操作結果ではなく、強制CSPの互換性や全HEAD応答・全ブラウザの確認でもない。

PR #22は2026-11-05 23:03:11 JSTにSquashマージされた。Codexのマージ後確認では、mainのpush CIでVitest59件・Playwright15件・Lint・Buildが成功し、axe6状態すべてviolations 0 / incomplete 0だった。Productionは同じマージSHAでREADY、本番HTML・参照JS/CSS・faviconのHEAD/GET計8応答が200で、基本4ヘッダー・Report-Only、強制CSP不在、従来のHSTS・Cache-Controlを確認した。これらは過去工程の結果である。

### 今回の強制ポリシー

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-src 'none'; frame-ancestors 'none'; worker-src 'none'; manifest-src 'none'; form-action 'none'
```

unsafe-inline、unsafe-eval、ワイルドカード、vercel.live等の例外は追加しない。Toolbarのスクリプト・iframe・通信が遮断される可能性はTodo本体の機能不具合と分ける。favicon.svgのstyle属性による見た目の変化も残存リスクであり、表示を確認するまで互換性を保証しない。

### 今回の検証結果

設定検証は成功。JSONを解析し、基準mainの設定と比較してReport-Onlyから強制CSPへのヘッダー名変更だけであること、sourceと基本4ヘッダー・同一ポリシー13ディレクティブの維持、重複なしを確認した。HSTS・Cache-Control等の追加設定もない。

2026-11-05、ローカルでtest→lint→build→testが成功。Vitest59件を2回、Playwright15件が成功し、axe全6状態はviolations 0 / incomplete 0だった。修正ループ0回。既存Vite previewのE2Eはvercel.jsonのヘッダーを自動適用しないため、強制CSP下の受入成功とはしない。実際のPreview URL・対象SHA・実測HTTPとブラウザ結果はデプロイ後に追記する。現時点では未確認。

### 本番反映前の人間による受入

### Preview実測と引き継ぎ（PR #23）

[PR #23](https://github.com/iwasaki-hub/todo-app/pull/23)の初回実装SHA`6a58230706a702263fded1bd56595eee4aee3076`に対応する[Preview](https://todo-j7yj4pcuv-masas-projects-39337881.vercel.app/)はVercel APIでREADY。デプロイIDは`dpl_4YzoiFBv32chXcUkf5Vt2qyHhV9p`で、作業ブランチ・デプロイSHAが一致した。これは後続の文書追記コミットとは区別する。

通常の未認証HEAD・GETを`/`へ各1回送り、どちらも302、Vercel SSOへのリダイレクト、Content-Typeはtext/plainだった。SSO保護を変更・回避しないため、Todo本体の強制CSP・Report-Only不在・基本4ヘッダー・HSTS・Cache-Controlは実測未確認。認証応答のヘッダーをアプリの成功と扱わない。

| 観点 | 今回の結果 |
| --- | --- |
| Todo HTML・参照JS/CSS・faviconの取得 | 未確認（HTMLがSSOのため参照パスも未特定） |
| 強制CSPの値、Report-Only不在、基本4ヘッダー | 設定静的検証成功／アプリHTTP応答は未確認 |
| 必要スクリプト・スタイルの読み込みとConsole | 未実施 |
| 追加・編集・削除・完了・フィルター・保存・再読み込み | Previewでは未実施 |
| 日本語IME・エラー表示・favicon表示 | 未実施 |
| iframe埋め込み拒否 | 未実施 |
| Toolbar由来の実際の遮断 | 未観測（発生可能性のみ記録） |

Codexによる実ブラウザ操作や認証付き自動化は実施していない。前工程のユーザーPassや通常CIを代用せず、最新HeadのPreviewで次の手順を実施する必要がある。

### 強制CSPの追加手動受入手順

最新HeadのPreviewで、認証済みユーザーがHTML・参照JS/CSS・faviconのHTTP 200、正しいContent-Type、強制CSPの値一致、Report-Only不在、基本4ヘッダーとHSTS・Cache-Controlを確認する。Console/Networkでアプリに必要なスクリプト・スタイルが遮断されないことを確認し、Toolbar由来の遮断とは別に記録する。

テスト専用ブラウザでTodo追加・編集・取消・削除・完了切替・全フィルター・保存・再読み込み、日本語IME・エラー表示、favicon、iframe埋め込み拒否を確認する。認証画面による拒否とアプリのframe-ancestors/X-Frame-Optionsによる拒否を区別する。未操作は未実施とし、必要機能が壊れた場合は原因を報告して停止し、CSPを勝手に緩めない。SSO保護を変更・回避せず、取得できない場合はユーザー確認へ引き継ぐ。

### 強制CSPのロールバック

互換性問題が見つかった場合は、本PRを未マージで停止する。将来、別承認で本番適用された後に問題が出た場合は、基本4ヘッダーとポリシー値を維持してヘッダー名だけをReport-Onlyへ戻す独立PRを作り、承認後の自動デプロイで実ヘッダーと機能復旧を確認する。依存や本番コードの変更、直接Push、強制操作、手動本番デプロイで対処しない。
