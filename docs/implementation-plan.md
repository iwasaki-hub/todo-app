# 実装計画とゲート

## 現在の進捗（P1.6開始時点）
- P0：分析済み。初回npm ciはEPERMで失敗し、後続の検証でlint/build成功を確認。復旧操作の詳細は開発履歴を参照。
- P0.6：セキュリティ調査済み。開発依存のmoderate警告は継続対応。
- P1：基本機能・保存処理を実装し、PR #1でmainへ反映済み。lint/build・保存処理の限定検証は成功。ブラウザ手動確認は完了記録なし。
- 開発履歴：PR #2で`docs/development-history/phase-01-development-log.md`をmainへ反映済み。
- P1.6（今回）：開発ルール・設計書のGitHub管理。PR作成とレビューまで実施し、最終承認前にマージしない。
- P2：編集・フィルターは未着手。空状態、削除確認、追加時バリデーションはP1で実装済み。UXと手動確認を継続する。
- P3：自動テスト環境は未導入。
- P4：GitHub Actionsは未導入。GitHub連携のVercel自動デプロイは既に稼働しているが、受入操作確認は別途必要。

以下は各フェーズの作業範囲とゲート。完了状況は上記を参照する。

## P0：設計・安全確認
- `docs/requirements.md`, `docs/basic-design.md`を読み、現状の`src/`, `package.json`と矛盾がないか確認。
- 作業ブランチを作る。mainへの直接コミット・Pushは避ける。
- `npm ci`, `npm run lint`, `npm run build` の初期結果を記録。

## P1：Todo基本機能
- 追加、一覧、完了切替、削除。
- localStorage保存・読み込み。
- CSSを分離、レスポンシブ対応。
- lint/buildを実行し、報告して停止。

## P2：編集・フィルター・UX
- 編集/キャンセル、3種フィルター、空状態、削除確認、バリデーション。
- キーボード操作・フォーカス・スマホ画面を確認。
- lint/buildを実行し、報告して停止。

## P3：テスト
- Vitest + React Testing Library + jsdomを導入。
- 操作・永続化・エラーハンドリングのテストを実装。
- test/lint/buildを実行し、報告して停止。

## P4：CI・公開確認
- GitHub Actions PRチェックを追加。
- PR/Previewで確認後にmainにマージ（必ず人間が判断）。
- Vercel公開URLで操作と保存を手動確認。

## 作業報告フォーマット
1. 実装/変更した内容
2. 変更ファイル一覧
3. 実行コマンドと成否
4. 残ったリスク/未実装事項
5. 次フェーズに進むための確認事項
