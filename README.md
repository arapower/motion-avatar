# motion-avatar

カメラ映像から顔ランドマークをリアルタイムで取得し、VRM 3D アバターの頭部回転・目瞬き・口開閉に反映するサーバレス Web アプリ。

## Progress Notes

- [WORK_IN_PROGRESS.md](WORK_IN_PROGRESS.md)

## 技術スタック

| レイヤー | 技術 |
|---|---|
| ビルド | Vite + TypeScript |
| スタイル | Tailwind CSS v4 |
| 3D | Three.js + @pixiv/three-vrm |
| 顔トラッキング | MediaPipe FaceLandmarker |
| テスト | Vitest + Playwright |

## セットアップ

### VRM サンプルモデルの配置

```bash
mkdir -p public/models
curl -L "https://github.com/vrm-c/vrm-specification/raw/refs/heads/master/samples/AvatarSample_A/vrm/AvatarSample_A.vrm" \
     -o public/models/AvatarSample_A.vrm
```

### 開発サーバー起動

```bash
npm install
npm run dev
```

## 使い方

1. ページを開く（`http://localhost:5173/motion-avatar/`）
2. 「カメラ開始」ボタンを押してカメラを許可する
3. カメラに顔を向けるとアバターが追従する
4. 独自の VRM モデルを使いたい場合は「VRM を読み込む」からファイルを選択

## テスト

```bash
npm run test          # Vitest ユニットテスト
npm run build         # ビルド確認
npm run test:e2e      # Playwright E2E
```

## ライセンス

同梱のサンプルモデル `public/models/AvatarSample_A.vrm` は **Seed-san** ([vrm-c/vrm-specification](https://github.com/vrm-c/vrm-specification/tree/master/samples/Seed-san))。  
モデル作成: VirtualCast, Inc. / ライセンス: [VRM Public License 1.0](https://vrm.dev/en/licenses/1.0/index)
