# 計画概要: motion-avatar

## 背景・目的
カメラ映像から顔ランドマークをリアルタイムで取得し、VRM 3Dアバターの頭部回転・目瞬き・口開閉に反映するサーバレス Web アプリを実装する。
arapower/showcase リポジトリの git submodule として公開する。

## 工程一覧

| No. | 工程名 | ファイル | 概要 |
|-----|--------|----------|------|
| 1 | プロジェクト雛形 | 01_project-setup.md | Vite+TS初期構成、依存関係 |
| 2 | コア実装 | 02_core-implementation.md | scene/camera/face-tracker/landmark-mapper |
| 3 | UI・レイアウト | 03_ui-layout.md | index.html・style.css |
| 4 | テスト | 04_tests.md | Vitest単体テスト・Playwright E2E |
| 5 | Showcase連携 | 05_showcase-integration.md | git submodule 登録 |

## 依存関係
- 工程1完了後に工程2〜4を並列着手可能
- 工程5は工程1〜4完了後

## 完了条件
- `npm run dev` でカメラ起動→アバターの頭・目・口が追従する
- `npm run test` ですべてのユニットテストが PASS する
- `npm run build` でビルドエラーなし
- `npm run test:e2e` で Playwright テストが PASS する

---

## 生成AIへの実装指示プロンプト

---
motion-avatar アプリを実装してください。

## 背景・目的
カメラ映像から顔ランドマークをリアルタイムで取得し、VRM 3Dアバターの頭部回転・目瞬き・口開閉に反映するサーバレス Web アプリ。arapower/showcase の git submodule として `/motion-avatar/` パスで公開する。

## 実装の要件
- Vite + TypeScript (strict) + Tailwind CSS v4 (@tailwindcss/vite) を使用する
- 3DレンダリングはThree.js + @pixiv/three-vrm を使用する
- 顔トラッキングは @mediapipe/tasks-vision の FaceLandmarker (VIDEO モード) を使用する
- WASM バックエンドは CDN (https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm) から取得してサーバレス構成を維持する
- デフォルトモデルは public/models/AvatarSample_A.vrm（CC0 公式サンプル）を fetch で読み込む
- ユーザーが独自 VRM をドラッグ&ドロップで上書き読み込みできる File API 対応も実装する
- 毎フレーム facialTransformationMatrixes で頭部 Quaternion を取得し VRM humanoid の head ボーンに適用する
- Eye Aspect Ratio（EAR）で blinkLeft / blinkRight を VRMExpressionManager に適用する
- 口の開口比で aa 表情を VRMExpressionManager に適用する
- vite.config.ts の base は '/motion-avatar/' にする

## 技術的制約
- サーバサイドコードを書かない（純粋フロントエンドのみ）
- 既存の face-analysis プロジェクトと同一の tsconfig / vitest / playwright パターンを踏襲する
- TypeScript strict モードでエラーなし

## 実装ステップ
以下の順序で実装を進めてください：
1. package.json / vite.config.ts / tsconfig.json / vitest.config.ts / playwright.config.ts を作成する
2. src/scene.ts: Three.js WebGLRenderer + VRM ローダーセットアップ、requestAnimationFrame ループ
3. src/camera.ts: getUserMedia でカメラ映像取得
4. src/face-tracker.ts: MediaPipe FaceLandmarker の初期化・毎フレーム検出
5. src/landmark-mapper.ts: ランドマーク → VRM ボーン・表情マッピング（純粋関数で EAR 計算）
6. src/main.ts: 各モジュールを統合、UI イベント束縛
7. index.html + src/style.css: 左 3D キャンバス、右カメラプレビュー、Tailwind レイアウト
8. tests/unit/landmark-mapper.test.ts: EAR・口開閉比のユニットテスト
9. tests/e2e/app.spec.e2e.ts: ページ起動・タイトル・ボタン存在確認

## 完了条件
- npm run dev でローカル起動しカメラ映像でアバターが動く
- npm run test で全ユニットテスト PASS
- npm run build でビルドエラーなし
- npm run test:e2e で Playwright テスト PASS
---
