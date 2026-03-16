import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import {
  mediapipeToVrm,
  directionBetween,
  jointAngle,
  type Lm3D,
} from '../../src/pose-mapper'

// ----------------------------------------------------------------
// mediapipeToVrm
// ----------------------------------------------------------------
describe('mediapipeToVrm', () => {
  it('X を反転し Y・Z を保持する', () => {
    const result = mediapipeToVrm({ x: 1, y: 2, z: 3 })
    expect(result.x).toBeCloseTo(-1)
    expect(result.y).toBeCloseTo(2)
    expect(result.z).toBeCloseTo(3)
  })

  it('原点は原点のまま', () => {
    const result = mediapipeToVrm({ x: 0, y: 0, z: 0 })
    expect(result.lengthSq()).toBe(0)
  })
})

// ----------------------------------------------------------------
// directionBetween
// ----------------------------------------------------------------
describe('directionBetween', () => {
  it('(0,0,0) → (1,0,0) は VRM では (-1,0,0) 方向', () => {
    const from: Lm3D = { x: 0, y: 0, z: 0 }
    const to:   Lm3D = { x: 1, y: 0, z: 0 }
    const dir = directionBetween(from, to)
    expect(dir.x).toBeCloseTo(-1, 5)
    expect(dir.y).toBeCloseTo(0, 5)
    expect(dir.z).toBeCloseTo(0, 5)
  })

  it('返却ベクトルは正規化されている', () => {
    const from: Lm3D = { x: 0, y: 0, z: 0 }
    const to:   Lm3D = { x: 3, y: 4, z: 0 }
    const dir = directionBetween(from, to)
    expect(dir.length()).toBeCloseTo(1, 5)
  })

  it('同一点の場合はゼロベクトルを返す（ゼロ除算防止）', () => {
    const p: Lm3D = { x: 1, y: 2, z: 3 }
    const dir = directionBetween(p, p)
    expect(dir.length()).toBe(0)
  })
})

// ----------------------------------------------------------------
// jointAngle
// ----------------------------------------------------------------
describe('jointAngle', () => {
  it('直角（L字型）は π/2 を返す', () => {
    // a=(0,1,0), b=(0,0,0), c=(1,0,0) → 直角
    // VRM変換後: a=(0,1,0), b=(0,0,0), c=(-1,0,0)
    // ba=(0,1,0), bc=(-1,0,0) → dot=0 → acos(0)=π/2
    const a: Lm3D = { x: 0, y: 1, z: 0 }
    const b: Lm3D = { x: 0, y: 0, z: 0 }
    const c: Lm3D = { x: 1, y: 0, z: 0 }
    expect(jointAngle(a, b, c)).toBeCloseTo(Math.PI / 2, 3)
  })

  it('完全に伸ばした状態（一直線）は π を返す', () => {
    // a=(0,1,0), b=(0,0,0), c=(0,-1,0) → 伸びた状態（π）
    const a: Lm3D = { x: 0,  y: 1, z: 0 }
    const b: Lm3D = { x: 0,  y: 0, z: 0 }
    const c: Lm3D = { x: 0, y: -1, z: 0 }
    expect(jointAngle(a, b, c)).toBeCloseTo(Math.PI, 3)
  })

  it('完全に折り曲げた状態（折り返し）は 0 を返す', () => {
    // a=(0,1,0), b=(0,0,0), c=(0,1,0) → 同方向（0）
    const a: Lm3D = { x: 0, y: 1, z: 0 }
    const b: Lm3D = { x: 0, y: 0, z: 0 }
    const c: Lm3D = { x: 0, y: 1, z: 0 }
    expect(jointAngle(a, b, c)).toBeCloseTo(0, 3)
  })

  it('結果は 0〜π の範囲内に収まる', () => {
    const cases: [Lm3D, Lm3D, Lm3D][] = [
      [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }],
      [{ x: 1, y: 1, z: 0 }, { x: 0, y: 0, z: 0 }, { x: -1, y: 1, z: 0 }],
    ]
    for (const [a, b, c] of cases) {
      const angle = jointAngle(a, b, c)
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThanOrEqual(Math.PI)
    }
  })
})

// ----------------------------------------------------------------
// THREE.Quaternion.setFromUnitVectors の動作確認
// (pose-mapper 内部で使用している処理の妥当性テスト)
// ----------------------------------------------------------------
describe('Quaternion.setFromUnitVectors sanity', () => {
  it('+X → -Y の回転クォータニオンを適用すると -Y に向く', () => {
    const q = new THREE.Quaternion()
    const from = new THREE.Vector3(1, 0, 0)
    const to   = new THREE.Vector3(0, -1, 0)
    q.setFromUnitVectors(from, to)
    const result = from.clone().applyQuaternion(q)
    expect(result.x).toBeCloseTo(0, 5)
    expect(result.y).toBeCloseTo(-1, 5)
    expect(result.z).toBeCloseTo(0, 5)
  })
})
