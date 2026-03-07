# 工程3: UI・レイアウト

## 目的
Tailwind で左 3D キャンバス / 右カメラプレビューを並列表示する UI を実装する

## 作業内容
- [ ] index.html: 2カラムレイアウト（canvas + video）、各種ボタン・ステータス表示
- [ ] src/style.css: Tailwind ディレクティブ + canvas/video サイズ調整
- [ ] カメラ開始ボタン / VRM 読み込みボタン（`<input type="file" accept=".vrm">`）
- [ ] 右パネルにリアルタイム係数表示（左目・右目・口開閉率）

## 入力
- src/main.ts（DOM ID の一覧）

## 出力/成果物
- index.html
- src/style.css

## 注意事項
- canvas サイズは JS 側で renderer.setSize() を呼ぶため、CSS では親要素に合わせる
- カメラ入力用 video 要素（#input-video）は非表示にし、プレビュー用は別 video 要素（#preview-video）を使う
