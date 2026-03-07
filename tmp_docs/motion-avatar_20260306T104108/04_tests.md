# 工程4: テスト

## 目的
ランドマークマッパーの単体テストと基本 E2E テストを実装する

## 作業内容
- [ ] tests/unit/landmark-mapper.test.ts: calculateEAR / calculateMouthRatio / earToBlinkWeight の境界値テスト
- [ ] tests/e2e/app.spec.e2e.ts: ページ起動・タイトル・カメラボタン・VRM 読み込みラベルの存在確認

## 入力
- src/landmark-mapper.ts（export する純粋関数）

## 出力/成果物
- tests/unit/landmark-mapper.test.ts
- tests/e2e/app.spec.e2e.ts

## 注意事項
- calculateEAR・calculateMouthRatio・earToBlinkWeight は DOM・three.js・MediaPipe に依存しない純粋関数として export する
- E2E テストは WebGL 実行が不要な範囲（DOM 要素の存在確認）にとどめる
- vitest.config.ts は happy-dom 環境を指定する
