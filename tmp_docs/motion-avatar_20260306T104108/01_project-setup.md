# 工程1: プロジェクト雛形

## 目的
Vite + TypeScript + Tailwind の標準構成を face-analysis と揃え、必要な依存関係を定義する

## 作業内容
- [ ] motion-avatar/ ディレクトリ作成
- [ ] package.json 作成（three, @pixiv/three-vrm, @mediapipe/tasks-vision など）
- [ ] vite.config.ts 作成（base: '/motion-avatar/'）
- [ ] tsconfig.json 作成（face-analysis と同一）
- [ ] vitest.config.ts 作成（happy-dom 環境）
- [ ] playwright.config.ts 作成（face-analysis と同一パターン）
- [ ] public/models/ ディレクトリ作成・VRM サンプル配置
- [ ] npm install 実行

## 入力
- face-analysis の各設定ファイル（参照パターン）

## 出力/成果物
- motion-avatar/package.json
- motion-avatar/vite.config.ts
- motion-avatar/tsconfig.json
- motion-avatar/vitest.config.ts
- motion-avatar/playwright.config.ts
- motion-avatar/public/models/AvatarSample_A.vrm

## 注意事項
- @pixiv/three-vrm は three.js のピアバージョンとの整合性に注意
- AvatarSample_A.vrm は VRM コンソーシアム公式 CC0 モデルを使用
- three の型定義は @types/three で提供される
