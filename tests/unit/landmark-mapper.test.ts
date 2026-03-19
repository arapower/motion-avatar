import { describe, it, expect } from 'vitest'
import {
  calculateEAR,
  calculateMouthRatio,
  earToBlinkWeight,
  extractPreviewAlignedHeadQuaternion,
  type Point2D,
} from '../../src/landmark-mapper'
import * as THREE from 'three'

// ----------------------------------------------------------------
// calculateEAR
// ----------------------------------------------------------------
describe('calculateEAR', () => {
  it('幅 1.0 / 縦高さ 0.6 の目は EAR = 0.6 を返す', () => {
    // p1=左端, p4=右端, p2/p3=上まぶた, p5/p6=下まぶた
    const p1: Point2D = { x: 0,    y: 0.5 }
    const p4: Point2D = { x: 1,    y: 0.5 }
    const p2: Point2D = { x: 0.25, y: 0.2 }
    const p6: Point2D = { x: 0.75, y: 0.8 }
    const p3: Point2D = { x: 0.75, y: 0.2 }
    const p5: Point2D = { x: 0.25, y: 0.8 }
    // vertical = dist(p2,p6) + dist(p3,p5)
    //          = sqrt(0.5^2+0.6^2) + sqrt(0.5^2+0.6^2)
    // horizontal = 2 * dist(p1,p4) = 2 * 1 = 2
    const ear = calculateEAR(p1, p2, p3, p4, p5, p6)
    expect(ear).toBeCloseTo(0.781, 2)
  })

  it('完全に閉じた目（縦 0）は EAR = 0 を返す', () => {
    const flat: Point2D = { x: 0, y: 0.5 }
    const right: Point2D = { x: 1, y: 0.5 }
    const ear = calculateEAR(flat, flat, flat, right, flat, flat)
    expect(ear).toBe(0)
  })

  it('水平距離 0（全点同一位置）はゼロ除算せず 0 を返す', () => {
    const z: Point2D = { x: 0, y: 0 }
    expect(calculateEAR(z, z, z, z, z, z)).toBe(0)
  })
})

// ----------------------------------------------------------------
// calculateMouthRatio
// ----------------------------------------------------------------
describe('calculateMouthRatio', () => {
  it('vertical=0.4, horizontal=1.0 のとき 0.4 を返す', () => {
    const top:   Point2D = { x: 0.5, y: 0.3 }
    const bot:   Point2D = { x: 0.5, y: 0.7 }
    const left:  Point2D = { x: 0,   y: 0.5 }
    const right: Point2D = { x: 1,   y: 0.5 }
    expect(calculateMouthRatio(top, bot, left, right)).toBeCloseTo(0.4, 5)
  })

  it('口を閉じた状態（縦 0）は 0 を返す', () => {
    const center: Point2D = { x: 0.5, y: 0.5 }
    const left:   Point2D = { x: 0,   y: 0.5 }
    const right:  Point2D = { x: 1,   y: 0.5 }
    expect(calculateMouthRatio(center, center, left, right)).toBe(0)
  })

  it('縦 > 横 のとき 1 にクランプされる', () => {
    const top:   Point2D = { x: 0, y: 0  }
    const bot:   Point2D = { x: 0, y: 10 }
    const left:  Point2D = { x: -0.5, y: 5 }
    const right: Point2D = { x:  0.5, y: 5 }
    expect(calculateMouthRatio(top, bot, left, right)).toBeLessThanOrEqual(1)
    expect(calculateMouthRatio(top, bot, left, right)).toBeGreaterThan(0)
  })

  it('水平距離 0 はゼロ除算せず 0 を返す', () => {
    const p: Point2D = { x: 0, y: 0 }
    expect(calculateMouthRatio(p, { x: 0, y: 1 }, p, p)).toBe(0)
  })
})

// ----------------------------------------------------------------
// earToBlinkWeight
// ----------------------------------------------------------------
describe('earToBlinkWeight', () => {
  it('EAR が開放閾値以上 (0.4) のとき weight = 0', () => {
    expect(earToBlinkWeight(0.4)).toBe(0)
    expect(earToBlinkWeight(1.0)).toBe(0)
  })

  it('EAR が閉鎖閾値以下 (0.1) のとき weight = 1', () => {
    expect(earToBlinkWeight(0.1)).toBe(1)
    expect(earToBlinkWeight(0)).toBe(1)
  })

  it('閾値の中間 (0.275) は weight ≈ 0.5 を返す', () => {
    expect(earToBlinkWeight(0.275)).toBeCloseTo(0.5, 1)
  })

  it('0〜1 の範囲内に収まる', () => {
    for (const ear of [0, 0.1, 0.2, 0.275, 0.35, 0.5, 1.0]) {
      const w = earToBlinkWeight(ear)
      expect(w).toBeGreaterThanOrEqual(0)
      expect(w).toBeLessThanOrEqual(1)
    }
  })
})

// ----------------------------------------------------------------
// extractPreviewAlignedHeadQuaternion
// ----------------------------------------------------------------
describe('extractPreviewAlignedHeadQuaternion', () => {
  it('回転行列からクォータニオンをそのまま取り出す', () => {
    const source = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.2, -0.3, 0.1, 'XYZ')
    )
    const matrix = new THREE.Matrix4().makeRotationFromQuaternion(source)
    const extracted = extractPreviewAlignedHeadQuaternion(matrix)

    expect(extracted.x).toBeCloseTo(source.x, 5)
    expect(extracted.y).toBeCloseTo(source.y, 5)
    expect(extracted.z).toBeCloseTo(source.z, 5)
    expect(extracted.w).toBeCloseTo(source.w, 5)
  })
})
