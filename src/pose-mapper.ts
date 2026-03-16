import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'

// ----------------------------------------------------------------
// MediaPipe PoseLandmarker の主要ランドマークインデックス
// https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
// ----------------------------------------------------------------
export const POSE_LM = {
  LEFT_SHOULDER:  11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW:     13,
  RIGHT_ELBOW:    14,
  LEFT_WRIST:     15,
  RIGHT_WRIST:    16,
  LEFT_HIP:       23,
  RIGHT_HIP:      24,
  LEFT_KNEE:      25,
  RIGHT_KNEE:     26,
  LEFT_ANKLE:     27,
  RIGHT_ANKLE:    28,
} as const

export interface Lm3D {
  x: number
  y: number
  z: number
}

// ----------------------------------------------------------------
// 純粋関数（ユニットテスト対象）
// ----------------------------------------------------------------

/**
 * MediaPipe world 座標 → VRM モデル座標に変換する。
 *
 * MediaPipe: X 右（カメラ視点）/ Y 上 / Z 手前（カメラ方向）
 * VRM:       X 右（モデル視点）/ Y 上 / Z 手前
 * カメラを向いている被写体の X はカメラ基準と反転している。
 * Z 軸は両者ともカメラ向きなので反転不要。
 */
export function mediapipeToVrm(lm: Lm3D): THREE.Vector3 {
  return new THREE.Vector3(-lm.x, lm.y, lm.z)
}

/**
 * from → to の正規化方向ベクトルを VRM 座標で返す。
 * from と to が同一点の場合は (0,0,0) を返す（ゼロ除算防止）。
 */
export function directionBetween(from: Lm3D, to: Lm3D): THREE.Vector3 {
  const f = mediapipeToVrm(from)
  const t = mediapipeToVrm(to)
  const dir = t.sub(f)
  const len = dir.length()
  if (len === 0) return new THREE.Vector3(0, 0, 0)
  return dir.divideScalar(len)
}

/**
 * 3 点 a-b-c のうち、b を頂点とした関節角（ラジアン）を返す。
 * 結果は 0（= 完全に曲がった）〜 π（= 完全に伸ばした）。
 */
export function jointAngle(a: Lm3D, b: Lm3D, c: Lm3D): number {
  const ba = directionBetween(b, a)
  const bc = directionBetween(b, c)
  const dot = Math.max(-1, Math.min(1, ba.dot(bc)))
  return Math.acos(dot)
}

// ----------------------------------------------------------------
// VRM T-pose でのボーンのレスト方向（ワールド空間）
// ----------------------------------------------------------------
const REST_R_ARM  = new THREE.Vector3(1,  0, 0)
const REST_L_ARM  = new THREE.Vector3(-1, 0, 0)
const REST_LEG    = new THREE.Vector3(0, -1, 0)
const ELBOW_AXIS  = new THREE.Vector3(0,  0, 1)
const KNEE_AXIS   = new THREE.Vector3(1,  0, 0)

const _q  = new THREE.Quaternion()
const _ax = new THREE.Vector3()

const SLERP = 0.3

/**
 * 上半身のポーズを VRM ボーンに適用する。
 * 対象: 両上腕 / 両下腕
 */
export function applyUpperBodyToVRM(lms: Lm3D[], vrm: VRM): void {
  const hum = vrm.humanoid

  // --- 右上腕: 肩 → 肘 の方向 ---
  const rArmDir = directionBetween(lms[POSE_LM.RIGHT_SHOULDER], lms[POSE_LM.RIGHT_ELBOW])
  if (rArmDir.length() > 0.01) {
    _q.setFromUnitVectors(REST_R_ARM, rArmDir)
    hum.getNormalizedBoneNode('rightUpperArm')?.quaternion.slerp(_q, SLERP)
  }

  // --- 左上腕: 肩 → 肘 の方向 ---
  const lArmDir = directionBetween(lms[POSE_LM.LEFT_SHOULDER], lms[POSE_LM.LEFT_ELBOW])
  if (lArmDir.length() > 0.01) {
    _q.setFromUnitVectors(REST_L_ARM, lArmDir)
    hum.getNormalizedBoneNode('leftUpperArm')?.quaternion.slerp(_q, SLERP)
  }

  // --- 右下腕: 肘の曲がり角度 ---
  const rElbow = jointAngle(
    lms[POSE_LM.RIGHT_SHOULDER], lms[POSE_LM.RIGHT_ELBOW], lms[POSE_LM.RIGHT_WRIST]
  )
  // π=伸ばした（回転0）→ 0=折った（最大曲げ）
  _ax.set(0, 0, 1)
  _q.setFromAxisAngle(_ax, -(Math.PI - rElbow))
  hum.getNormalizedBoneNode('rightLowerArm')?.quaternion.slerp(_q, SLERP)

  // --- 左下腕: 肘の曲がり角度 ---
  const lElbow = jointAngle(
    lms[POSE_LM.LEFT_SHOULDER], lms[POSE_LM.LEFT_ELBOW], lms[POSE_LM.LEFT_WRIST]
  )
  _ax.set(0, 0, 1)
  _q.setFromAxisAngle(ELBOW_AXIS, (Math.PI - lElbow))
  hum.getNormalizedBoneNode('leftLowerArm')?.quaternion.slerp(_q, SLERP)
}

/**
 * 下半身のポーズを VRM ボーンに適用する。
 * 対象: 両大腿 / 両下腿
 */
export function applyLowerBodyToVRM(lms: Lm3D[], vrm: VRM): void {
  const hum = vrm.humanoid

  // --- 右大腿: 股関節 → 膝 の方向 ---
  const rLegDir = directionBetween(lms[POSE_LM.RIGHT_HIP], lms[POSE_LM.RIGHT_KNEE])
  if (rLegDir.length() > 0.01) {
    _q.setFromUnitVectors(REST_LEG, rLegDir)
    hum.getNormalizedBoneNode('rightUpperLeg')?.quaternion.slerp(_q, SLERP)
  }

  // --- 左大腿: 股関節 → 膝 の方向 ---
  const lLegDir = directionBetween(lms[POSE_LM.LEFT_HIP], lms[POSE_LM.LEFT_KNEE])
  if (lLegDir.length() > 0.01) {
    _q.setFromUnitVectors(REST_LEG, lLegDir)
    hum.getNormalizedBoneNode('leftUpperLeg')?.quaternion.slerp(_q, SLERP)
  }

  // --- 右膝: 膝の曲がり角度 ---
  const rKnee = jointAngle(
    lms[POSE_LM.RIGHT_HIP], lms[POSE_LM.RIGHT_KNEE], lms[POSE_LM.RIGHT_ANKLE]
  )
  _q.setFromAxisAngle(KNEE_AXIS, -(Math.PI - rKnee))
  hum.getNormalizedBoneNode('rightLowerLeg')?.quaternion.slerp(_q, SLERP)

  // --- 左膝: 膝の曲がり角度 ---
  const lKnee = jointAngle(
    lms[POSE_LM.LEFT_HIP], lms[POSE_LM.LEFT_KNEE], lms[POSE_LM.LEFT_ANKLE]
  )
  _q.setFromAxisAngle(KNEE_AXIS, -(Math.PI - lKnee))
  hum.getNormalizedBoneNode('leftLowerLeg')?.quaternion.slerp(_q, SLERP)
}
