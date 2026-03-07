# 工程5: Showcase 連携

## 目的
arapower/showcase の git submodule として motion-avatar を登録する

## 作業内容
- [ ] GitHub に arapower/motion-avatar リポジトリを新規作成
- [ ] showcase/.gitmodules に motion-avatar エントリを追加
- [ ] showcase/ で git submodule add を実行

## 入力
- ビルド・テスト完了済みの motion-avatar リポジトリ

## 出力/成果物
- showcase/.gitmodules（更新）
- showcase/motion-avatar/（サブモジュールポインタ）

## 注意事項
- showcase/index.html へのカードの追加はアプリが一定品質になってから別途行う
- vite.config.ts の base が '/motion-avatar/' であることを事前確認する
