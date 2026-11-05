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

実際のPreview URL・デプロイ対象SHA・HEAD/GET・ブラウザの結果は、デプロイ後にこの節へ追記する。現時点では未確認。

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
