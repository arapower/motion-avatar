import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'
import type { FaceLandmarkerResult } from './face-tracker'

// ----------------------------------------------------------------
// 純粋関数（ユニットテスト対象）
// ----------------------------------------------------------------

/** 2D ランドマーク点 */
export interface Point2D {
  x: number
  y: number
}

/**
 * Eye Aspect Ratio (EAR) を計算する。
 *
 *   EAR = (‖p2-p6‖ + ‖p3-p5‖) / (2 × ‖p1-p4‖)
 *
 * p1, p4 = 目の左右端、p2, p3, p5, p6 = 上下まぶた
 * 完全に開いているとき ~0.35、閉じているとき ~0.2 以下
 */
export function calculateEAR(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D,
  p5: Point2D,
  p6: Point2D
): number {
  const dist = (a: Point2D, b: Point2D) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  const vertical = dist(p2, p6) + dist(p3, p5)
  const horizontal = 2 * dist(p1, p4)
  if (horizontal === 0) return 0
  return vertical / horizontal
}

/**
 * 口の開口比（縦 / 横、0〜1 にクランプ）を計算する。
 */
export function calculateMouthRatio(
  top: Point2D,
  bottom: Point2D,
  leftCorner: Point2D,
  rightCorner: Point2D
): number {
  const dist = (a: Point2D, b: Point2D) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  const vertical = dist(top, bottom)
  const horizontal = dist(leftCorner, rightCorner)
  if (horizontal === 0) return 0
  return Math.min(vertical / horizontal, 1)
}

/** EAR → ブリンク重み (0=開, 1=閉) */
const EAR_OPEN = 0.35
const EAR_CLOSED = 0.2

export function earToBlinkWeight(ear: number): number {
  if (ear >= EAR_OPEN) return 0
  if (ear <= EAR_CLOSED) return 1
  return (EAR_OPEN - ear) / (EAR_OPEN - EAR_CLOSED)
}

// ----------------------------------------------------------------
// MediaPipe 478 点の主要インデックス
// https://developers.google.com/mediapipe/solutions/vision/face_landmarker
// ----------------------------------------------------------------
const LM = {
  // 左目（画面上の左 = ユーザーの右）
  leftEye:  { p1:  33, p2: 160, p3: 158, p4: 133, p5: 153, p6: 144 },
  // 右目
  rightEye: { p1: 362, p2: 385, p3: 387, p4: 263, p5: 373, p6: 380 },
  // 口
  mouthTop:    13,
  mouthBottom: 14,
  mouthLeft:   78,
  mouthRight: 308,
} as const

// ----------------------------------------------------------------
// UI 更新用グローバル（window._ma_*）
// ----------------------------------------------------------------
interface MotionAvatarGlobals {
  _ma_blinkL: number
  _ma_blinkR: number
  _ma_mouth: number
}

// ----------------------------------------------------------------
// VRM への適用（毎フレーム呼ぶ）
// ----------------------------------------------------------------
const _mat4 = new THREE.Matrix4()
const _quat = new THREE.Quaternion()

export function applyFaceToVRM(result: FaceLandmarkerResult, vrm: VRM): void {
  const landmarks = result.faceLandmarks?.[0]
  if (!landmarks) return

  // --- 頭部回転 ---
  const matrices = result.facialTransformationMatrixes
  if (matrices && matrices.length > 0) {
    const m = matrices[0].data
    // MediaPipe は列優先 (column-major)
    _mat4.fromArray(m)
    _quat.setFromRotationMatrix(_mat4)
    // MediaPipe → VRM 座標変換 (X 軸ミラー: diag(-1,1,1) 適用)
    // pitch (X) は不変、yaw (Y) と roll (Z) を反転
    _quat.y *= -1
    _quat.z *= -1
    const head = vrm.humanoid.getNormalizedBoneNode('head')
    if (head) head.quaternion.slerp(_quat, 0.35)
  }

  // --- 目 ---
  const le = LM.leftEye
  const re = LM.rightEye
  const blinkL = earToBlinkWeight(calculateEAR(
    landmarks[le.p1], landmarks[le.p2], landmarks[le.p3],
    landmarks[le.p4], landmarks[le.p5], landmarks[le.p6],
  ))
  const blinkR = earToBlinkWeight(calculateEAR(
    landmarks[re.p1], landmarks[re.p2], landmarks[re.p3],
    landmarks[re.p4], landmarks[re.p5], landmarks[re.p6],
  ))
  vrm.expressionManager?.setValue('blinkLeft', blinkL)
  vrm.expressionManager?.setValue('blinkRight', blinkR)

  // --- 口 ---
  const rawRatio = calculateMouthRatio(
    landmarks[LM.mouthTop],
    landmarks[LM.mouthBottom],
    landmarks[LM.mouthLeft],
    landmarks[LM.mouthRight],
  )
  // 通常 0.05〜0.45 の範囲 → 0〜1 に正規化
  const mouthWeight = Math.min(Math.max((rawRatio - 0.05) / 0.4, 0), 1)
  vrm.expressionManager?.setValue('aa', mouthWeight)

  // UI 用グローバルに書き込む
  const g = window as unknown as MotionAvatarGlobals
  g._ma_blinkL = blinkL
  g._ma_blinkR = blinkR
  g._ma_mouth = mouthWeight
}
