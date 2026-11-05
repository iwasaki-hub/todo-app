# minimatch限定overrideの暫定対応

## 根拠と適用範囲

- 対象：[GHSA-g3hv-75wg-m249 / CVE-2026-118764](https://github.com/advisories/GHSA-g3hv-75wg-m249)。影響版はminimatch >=7.0.0 <11.0.1。攻撃者が制御するglobとoptimizationLevel >=2等の条件でCPU・メモリ消費が増えるDoSである。
- 2026-11-05の確認時、ESLint 10.14.0、@eslint/config-array 0.23.5、@typescript-eslint/typescript-estree 8.72.1はminimatch 10系を要求し、対応する上流更新だけで解消できなかった。
- 基準main `34eb7f10f552d576eb94b14acb2577cb63e11d89`ではminimatch 10.2.6由来のmoderate 10件、本番依存0件。アプリの入力からminimatchを呼ぶ経路は見つかっていないが、開発依存の警告として対処する。
- package.jsonで親3経路だけを11.0.4へ固定する。eslintのキーは直接依存の宣言範囲`^10.13.0`に合わせ、EOVERRIDEを避ける。グローバルなminimatch置換、force/legacy-peer-depsは使用しない。
- lockfileの主な差分はminimatch 10.2.6→11.0.4と@isaacs/nonrecursive-glob-match 1.0.3の追加。既存ESLint・TypeScript等の版、本番コード、CSS、既存E2E、Workflow、Rulesetは変更しない。

## 互換性の限界と回帰検証

- 11系は親の宣言範囲外であり、上流が保証した組み合わせではない。[公式変更履歴](https://github.com/isaacs/minimatch/blob/v11.0.4/changelog.md)にあるmakeRe/AST等の削除、Minimatch.setの要素型変更、partial・Windowsパス等の変更を含む。
- Phase 7-B1の隔離検証では3,024比較中16差分があった。a/?(x)、a/*(x)と空の末尾パスa/の判定など、11系の仕様変更であり、このPRで差分を消したとは扱わない。
- 親が使うMinimatch・match・pattern・minimatchは維持されている。src/test/lintCompatibility.test.tsの4件で、対象ファイルの動的照合、src/e2e対象・dist/coverage除外、未使用変数の検出、親3経路の必要glob、型付きparserを継続確認する。ファイル数・全API・全globの完全互換性は固定しない。
- 回帰テストは既存Vitestの収集範囲内で実行し、既存55件と新規4件を区別する。既存Playwright15件（既存9＋axe6）は変更しない。axe成功は実機・IME・支援技術やWCAG完全適合を保証しない。

```powershell
npm.cmd ci
npm.cmd ls minimatch --all
npm.cmd audit --json
npm.cmd audit --omit=dev --json
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npm.cmd run test
npm.cmd run test:e2e
```

正式PRではWindowsのNode 24.22.2 / 26.13.0とUbuntu CIの結果を区別してPR本文へ記録する。既存CIにはauditジョブがないため、CI成功だけでUbuntuのaudit 0件とは主張しない。ネットワーク取得失敗も脆弱性0件として扱わない。

## 解除条件

1. 親パッケージが修正済みminimatchを正式な依存範囲で採用した安定版を公開する。
2. Node・ESLint・TypeScript・関連プラグインの互換性を確認し、3経路すべてに脆弱版が残らないことを確認する。
3. 別PRで対象overrideを除去し、lockfileを更新。cleanなnpm ci、audit両種、Lint回帰・Vitest・Build・PlaywrightとUbuntu必須チェックを成功させる。

親の版が変わると限定キーに一致しなくなる場合がある。依存更新時は必ず依存木とauditを再確認する。新しいminimatch版へ無条件に追従せず、解除まで固定版を管理する。

## ロールバック

非互換が見つかった場合は、別PRでこの変更前のpackage.json・package-lock.jsonへ戻してnpm ciを実行する。基準のmoderate警告が再発することも明記し、期限付きの既知リスクとして再判断する。回帰テストを無効化して成功にしない。mainへ直接Pushせず、force操作・自動マージ・手動本番デプロイを行わない。
