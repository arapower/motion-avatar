import { describe, expect, it } from 'vitest'
import {
  fingerCurlAngle,
  handForwardDirection,
  HAND_LM,
} from '../../src/hand-mapper'
import type { Lm3D } from '../../src/pose-mapper'

function buildHand(): Lm3D[] {
  return Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }))
}

describe('fingerCurlAngle', () => {
  it('一直線では 0 を返す', () => {
    const base: Lm3D = { x: 0, y: 0, z: 0 }
    const joint: Lm3D = { x: 1, y: 0, z: 0 }
    const tip: Lm3D = { x: 2, y: 0, z: 0 }
    expect(fingerCurlAngle(base, joint, tip)).toBeCloseTo(0, 5)
  })

  it('90度に曲がると正の値になる', () => {
    const base: Lm3D = { x: 0, y: 0, z: 0 }
    const joint: Lm3D = { x: 1, y: 0, z: 0 }
    const tip: Lm3D = { x: 1, y: 1, z: 0 }
    expect(fingerCurlAngle(base, joint, tip)).toBeCloseTo(Math.PI / 2, 5)
  })
})

describe('handForwardDirection', () => {
  it('wrist→middle_mcp の方向を正規化して返す', () => {
    const lms = buildHand()
    lms[HAND_LM.WRIST] = { x: 0, y: 0, z: 0 }
    lms[HAND_LM.MIDDLE_MCP] = { x: 0, y: 2, z: 0 }

    const dir = handForwardDirection(lms)
    expect(dir.x).toBeCloseTo(0, 5)
    expect(dir.y).toBeCloseTo(1, 5)
    expect(dir.z).toBeCloseTo(0, 5)
  })
})