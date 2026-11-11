import type { DrawingStroke, StrokePoint } from '@/types/drawing'

export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 4

export interface DrawingView {
  zoom: number
  pan: { x: number; y: number }
}

export function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

export function strokePath(points: StrokePoint[]) {
  const d = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
  // Um único ponto (toque) precisa de um segmento de tamanho zero para virar um pingo.
  return points.length === 1 ? `${d} l 0.01 0` : d
}

export function strokeBounds(strokes: DrawingStroke[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const stroke of strokes) {
    for (const [x, y] of stroke.points) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (minX === Infinity) return null
  return { minX, minY, maxX, maxY }
}

/** Verdadeiro se o ponto (coordenadas do mundo) toca o traço, com `radius` extra de borracha. */
export function strokeHit(stroke: DrawingStroke, point: StrokePoint, radius: number) {
  const reach = radius + stroke.width / 2
  const [px, py] = point
  return stroke.points.some(([x, y]) => Math.hypot(x - px, y - py) <= reach)
}

/** Vista que centraliza todos os traços dentro de uma área width × height. */
export function fitView(
  strokes: DrawingStroke[],
  width: number,
  height: number,
  padding = 80,
): DrawingView {
  const bounds = strokeBounds(strokes)
  if (!bounds) return { zoom: 1, pan: { x: width / 2, y: height / 2 } }
  const boxWidth = Math.max(bounds.maxX - bounds.minX, 1)
  const boxHeight = Math.max(bounds.maxY - bounds.minY, 1)
  const zoom = Math.max(
    0.01,
    Math.min((width - padding * 2) / boxWidth, (height - padding * 2) / boxHeight, 2),
  )
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  return {
    zoom,
    pan: { x: width / 2 - centerX * zoom, y: height / 2 - centerY * zoom },
  }
}
