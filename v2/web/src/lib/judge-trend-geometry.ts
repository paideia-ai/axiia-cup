interface Marker {
  y: number
  radius: number
}

// Equal visible connector lengths require different horizontal spacing when
// vertical changes or ring radii differ. Keep the original vertical encoding.
export function judgeTrendGeometry(
  markers: Marker[],
  { gap = 4, availableWidth }: { gap?: number; availableWidth?: number } = {},
) {
  const pad = 18
  const clearance = Math.max(0, gap) + 1 // rounded 2px stroke extends 1px
  const edges = markers.slice(1).map((end, index) => ({
    start: markers[index],
    end,
    dy: end.y - markers[index].y,
    inset: markers[index].radius + end.radius + clearance * 2,
  }))
  const minimum = Math.max(
    12,
    ...edges.map((edge) => Math.hypot(edge.dy, 20) - edge.inset),
  )
  const natural = Math.max(
    minimum,
    ...edges.map((edge) => Math.hypot(edge.dy, 44) - edge.inset),
  )
  const span = (length: number) =>
    pad * 2 +
    edges.reduce(
      (sum, edge) =>
        sum + Math.sqrt(Math.max(0, (length + edge.inset) ** 2 - edge.dy ** 2)),
      0,
    )
  let length = natural
  if (availableWidth != null && span(natural) > availableWidth) {
    let low = minimum
    let high = natural
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2
      if (span(mid) > availableWidth) high = mid
      else low = mid
    }
    length = low
  }
  const xs = markers.length ? [pad] : []
  const segments = edges.map((edge, index) => {
    const distance = length + edge.inset
    const dx = Math.sqrt(Math.max(0, distance ** 2 - edge.dy ** 2))
    const startX = xs[index]
    const endX = startX + dx
    xs.push(endX)
    const from = edge.start.radius + clearance
    const to = edge.end.radius + clearance
    return {
      x1: startX + dx * from / distance,
      y1: edge.start.y + edge.dy * from / distance,
      x2: endX - dx * to / distance,
      y2: edge.end.y - edge.dy * to / distance,
    }
  })
  return { xs, segments, width: (xs.at(-1) ?? pad) + pad }
}
