import * as THREE from 'three'
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm'
import type { HandLandmarkerResult } from './hand-tracker'
import { directionBetween, jointAngle, type Lm3D } from './pose-mapper'

// ----------------------------------------------------------------
// MediaPipe HandLandmarker 21 点インデックス
// https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
// ----------------------------------------------------------------
export const HAND_LM = {
  WRIST:      0,
  THUMB_CMC:  1, THUMB_MCP:  2, THUMB_IP:   3, THUMB_TIP:  4,
  INDEX_MCP:  5, INDEX_PIP:  6, INDEX_DIP:  7, INDEX_TIP:  8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP:   13, RING_PIP:  14, RING_DIP:  15, RING_TIP:  16,
  PINKY_MCP:  17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const

// ----------------------------------------------------------------
// 指ボーン定義
// ----------------------------------------------------------------
interface FingerDef {
  proximal:     VRMHumanBoneName
  intermediate: VRMHumanBoneName
  distal:       VRMHumanBoneName
  base: number   // MCP ランドマーク
  pip:  number   // PIP ランドマーク
  dip:  number   // DIP ランドマーク
  tip:  number   // TIP ランドマーク
}

function buildFingerDefs(side: 'left' | 'right'): FingerDef[] {
  const s = side as 'left' | 'right'
  return [
    {
      proximal:     `${s}IndexProximal`     as VRMHumanBoneName,
      intermediate: `${s}IndexIntermediate` as VRMHumanBoneName,
      distal:       `${s}IndexDistal`       as VRMHumanBoneName,
      base: HAND_LM.INDEX_MCP,  pip: HAND_LM.INDEX_PIP,  dip: HAND_LM.INDEX_DIP,  tip: HAND_LM.INDEX_TIP,
    },
    {
      proximal:     `${s}MiddleProximal`     as VRMHumanBoneName,
      intermediate: `${s}MiddleIntermediate` as VRMHumanBoneName,
      distal:       `${s}MiddleDistal`       as VRMHumanBoneName,
      base: HAND_LM.MIDDLE_MCP, pip: HAND_LM.MIDDLE_PIP, dip: HAND_LM.MIDDLE_DIP, tip: HAND_LM.MIDDLE_TIP,
    },
    {
      proximal:     `${s}RingProximal`     as VRMHumanBoneName,
      intermediate: `${s}RingIntermediate` as VRMHumanBoneName,
      distal:       `${s}RingDistal`       as VRMHumanBoneName,
      base: HAND_LM.RING_MCP,   pip: HAND_LM.RING_PIP,   dip: HAND_LM.RING_DIP,   tip: HAND_LM.RING_TIP,
    },
    {
      proximal:     `${s}LittleProximal`     as VRMHumanBoneName,
      intermediate: `${s}LittleIntermediate` as VRMHumanBoneName,
      distal:       `${s}LittleDistal`       as VRMHumanBoneName,
      base: HAND_LM.PINKY_MCP,  pip: HAND_LM.PINKY_PIP,  dip: HAND_LM.PINKY_DIP,  tip: HAND_LM.PINKY_TIP,
    },
  ]
}

// ----------------------------------------------------------------
// 純粋関数（ユニットテスト対象）
// ----------------------------------------------------------------

/**
 * 3 点 base → joint → tip から、joint でのカール量（ラジアン）を返す。
 * 0 = 完全に伸ばした、π/2 ≈ 90° 曲げ
 */
export function fingerCurlAngle(base: Lm3D, joint: Lm3D, tip: Lm3D): number {
  return Math.PI - jointAngle(base, joint, tip)
}

export function handForwardDirection(lms: Lm3D[]): THREE.Vector3 {
  return directionBetween(lms[HAND_LM.WRIST], lms[HAND_LM.MIDDLE_MCP])
}

// ----------------------------------------------------------------
// VRM への適用
// ----------------------------------------------------------------
const SLERP = 0.25
const _q  = new THREE.Quaternion()
const _ax = new THREE.Vector3(0, 0, 1)
const REST_R_HAND = new THREE.Vector3(1, 0, 0)
const REST_L_HAND = new THREE.Vector3(-1, 0, 0)

/**
 * 1 本の指のカール回転を VRM ボーンに適用する。
 *
 * VRM 正規化ボーン空間では右手指は +X、左手指は -X 方向に伸びる。
 * カールは Z 軸まわりの回転で表現：
 *   右手: 負の Z 回転でカール（+X が -Y 方向へ）
 *   左手: 正の Z 回転でカール（-X が -Y 方向へ）
 */
function applyFingerCurl(
  lms:          Lm3D[],
  vrm:          VRM,
  proximal:     VRMHumanBoneName,
  intermediate: VRMHumanBoneName,
  distal:       VRMHumanBoneName,
  baseLm:  number,
  pipLm:   number,
  dipLm:   number,
  tipLm:   number,
  sign:    number,  // +1 = 左手, -1 = 右手
): void {
  const hum = vrm.humanoid

  const proxCurl = fingerCurlAngle(lms[HAND_LM.WRIST], lms[baseLm], lms[pipLm])
  _q.setFromAxisAngle(_ax, sign * proxCurl)
  hum.getNormalizedBoneNode(proximal)?.quaternion.slerp(_q, SLERP)

  const midCurl = fingerCurlAngle(lms[baseLm], lms[pipLm], lms[dipLm])
  _q.setFromAxisAngle(_ax, sign * midCurl)
  hum.getNormalizedBoneNode(intermediate)?.quaternion.slerp(_q, SLERP)

  const disCurl = fingerCurlAngle(lms[pipLm], lms[dipLm], lms[tipLm])
  _q.setFromAxisAngle(_ax, sign * disCurl)
  hum.getNormalizedBoneNode(distal)?.quaternion.slerp(_q, SLERP)
}

/**
 * HandLandmarker の結果を VRM の指ボーンに適用する（両手対応）。
 *
 * MediaPipe の handedness は映像フレーム基準で判定される。
 * ミラーなし映像では 'Left' = 映像左側 = ユーザーの右手。
 */
export function applyHandToVRM(result: HandLandmarkerResult, vrm: VRM): void {
  if (!result.worldLandmarks?.length) return

  for (let i = 0; i < result.worldLandmarks.length; i++) {
    const lms  = result.worldLandmarks[i] as Lm3D[]
    const cat  = result.handedness[i]?.[0]?.categoryName ?? ''
    // MediaPipe 'Left' = 映像左 = ユーザーの右手（ミラーなし映像基準）
    const isRight = cat === 'Left'
    const side  = isRight ? 'right' : 'left'
    const sign  = isRight ? -1 : 1

    // 手首〜掌全体の向きを反映して、指トラッキングの見え方を強める。
    const wristDir = handForwardDirection(lms)
    if (wristDir.length() > 0.01) {
      _q.setFromUnitVectors(isRight ? REST_R_HAND : REST_L_HAND, wristDir)
      vrm.humanoid.getNormalizedBoneNode(isRight ? 'rightHand' : 'leftHand')?.quaternion.slerp(_q, SLERP)
    }

    // 4 本指（人差し指〜小指）
    for (const f of buildFingerDefs(side)) {
      applyFingerCurl(lms, vrm, f.proximal, f.intermediate, f.distal,
        f.base, f.pip, f.dip, f.tip, sign)
    }

    // 親指（Z 軸の代わりに手のひら面を考慮して Y 軸回転を使用）
    const thumbMeta   = `${side}ThumbMetacarpal` as VRMHumanBoneName
    const thumbProx   = `${side}ThumbProximal`   as VRMHumanBoneName
    const thumbDistal = `${side}ThumbDistal`     as VRMHumanBoneName

    _ax.set(0, 1, 0)
    const thumbMetaCurl = fingerCurlAngle(lms[HAND_LM.WRIST],      lms[HAND_LM.THUMB_CMC], lms[HAND_LM.THUMB_MCP])
    _q.setFromAxisAngle(_ax, sign * thumbMetaCurl)
    vrm.humanoid.getNormalizedBoneNode(thumbMeta)?.quaternion.slerp(_q, SLERP)

    const thumbProxCurl = fingerCurlAngle(lms[HAND_LM.THUMB_CMC],  lms[HAND_LM.THUMB_MCP], lms[HAND_LM.THUMB_IP])
    _q.setFromAxisAngle(_ax, sign * thumbProxCurl)
    vrm.humanoid.getNormalizedBoneNode(thumbProx)?.quaternion.slerp(_q, SLERP)

    _ax.set(0, 1, 0)
    const thumbDisCurl  = fingerCurlAngle(lms[HAND_LM.THUMB_MCP],  lms[HAND_LM.THUMB_IP],  lms[HAND_LM.THUMB_TIP])
    _q.setFromAxisAngle(_ax, sign * thumbDisCurl)
    vrm.humanoid.getNormalizedBoneNode(thumbDistal)?.quaternion.slerp(_q, SLERP)
  }
}
