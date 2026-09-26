import { describe, expect, it } from 'vitest'
import { judgeTrendGeometry } from './judge-trend-geometry'

const markers = [
  { y: 81, radius: 5.5 },
  { y: 81, radius: 5.5 },
  { y: 39, radius: 8.75 },
  { y: 81, radius: 8.75 },
  { y: 81, radius: 5.5 },
  { y: 39, radius: 8.75 },
  { y: 39, radius: 5.5 },
]

function check(width?: number) {
  const geometry = judgeTrendGeometry(markers, {
    gap: 4,
    availableWidth: width,
  })
  const lengths = geometry.segments.map((s) =>
    Math.hypot(s.x2 - s.x1, s.y2 - s.y1)
  )
  for (const length of lengths) expect(length).toBeCloseTo(lengths[0], 8)
  geometry.segments.forEach((s, index) => {
    // The rounded cap consumes 1px; the remaining clearance must be 4px.
    expect(
      Math.hypot(s.x1 - geometry.xs[index], s.y1 - markers[index].y) -
        markers[index].radius - 1,
    ).toBeCloseTo(4, 8)
    expect(
      Math.hypot(s.x2 - geometry.xs[index + 1], s.y2 - markers[index + 1].y) -
        markers[index + 1].radius - 1,
    ).toBeCloseTo(4, 8)
  })
  return geometry
}

describe('judge trend equal-length connectors', () => {
  it('keeps horizontal and sloping connectors equal with mixed rings', () => {
    check()
  })
  it('fits a narrower card while preserving equal lengths and clearance', () => {
    expect(check(270).width).toBeCloseTo(270, 6)
  })
  it('allows scrolling before nodes become unreadably crowded', () => {
    expect(check(100).width).toBeGreaterThan(100)
  })
  it('keeps a two-beat plot compact instead of filling its container', () => {
    const pair = [markers[0], markers[2]]
    expect(judgeTrendGeometry(pair, { availableWidth: 500 }).width).toBeCloseTo(
      80,
      6,
    )
  })
})
