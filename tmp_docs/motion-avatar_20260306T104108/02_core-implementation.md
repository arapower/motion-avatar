# 工程2: コア実装

## 目的
顔トラッキング → VRM 反映の中核ロジックを 4 モジュールに分割して実装する

## 作業内容
- [ ] src/scene.ts: Three.js WebGLRenderer・シーン・VRM ローダー・アニメーションループ
- [ ] src/camera.ts: getUserMedia + HTMLVideoElement セットアップ
- [ ] src/face-tracker.ts: MediaPipe FaceLandmarker 初期化・VIDEO モード検出
- [ ] src/landmark-mapper.ts: EAR 計算・頭部 Quaternion 変換・VRM 表情適用の純粋関数群
- [ ] src/main.ts: 全モジュール統合・UI イベント束縛

## 入力
- public/models/AvatarSample_A.vrm（工程1成果物）

## 出力/成果物
- src/scene.ts
- src/camera.ts
- src/face-tracker.ts
- src/landmark-mapper.ts
- src/main.ts

## 注意事項
- VRM 読み込みに GLTFLoader + VRMLoaderPlugin を使う（@pixiv/three-vrm の registerPlugin）
- vrm.update(delta) を毎フレーム呼ぶ（スプリング物理のため必須）
- FaceLandmarker WASM は CDN から取得し public/ には置かない
- facialTransformationMatrixes は 4x4 行列なので THREE.Matrix4 を経由して Quaternion に変換
- EAR・口開閉比の計算は純粋関数として export し、ユニットテスト対象にする
