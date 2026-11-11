import type { DrawingStroke } from '@/types/drawing'

export interface StrokeCluster {
  id: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  centerX: number
  centerY: number
  strokes: DrawingStroke[]
}

/** Agrupa traços próximos que provavelmente compõem uma mesma palavra ou nó visual */
export function clusterStrokes(strokes: DrawingStroke[], threshold = 120): StrokeCluster[] {
  if (strokes.length === 0) return []

  const strokeBoxes = strokes.map((stroke, i) => {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const [x, y] of stroke.points) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    return {
      index: i,
      stroke,
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    }
  })

  const clusters: StrokeCluster[] = []
  const visited = new Set<number>()

  for (let i = 0; i < strokeBoxes.length; i++) {
    if (visited.has(i)) continue
    visited.add(i)

    const memberBoxes = [strokeBoxes[i]]
    const queue = [strokeBoxes[i]]

    while (queue.length > 0) {
      const current = queue.shift()!
      for (let j = 0; j < strokeBoxes.length; j++) {
        if (visited.has(j)) continue
        const candidate = strokeBoxes[j]

        // Distância entre centros ou caixas
        const distX = Math.max(
          0,
          Math.max(current.minX, candidate.minX) - Math.min(current.maxX, candidate.maxX),
        )
        const distY = Math.max(
          0,
          Math.max(current.minY, candidate.minY) - Math.min(current.maxY, candidate.maxY),
        )
        const distance = Math.hypot(distX, distY)

        if (distance <= threshold) {
          visited.add(j)
          memberBoxes.push(candidate)
          queue.push(candidate)
        }
      }
    }

    const minX = Math.min(...memberBoxes.map((b) => b.minX))
    const maxX = Math.max(...memberBoxes.map((b) => b.maxX))
    const minY = Math.min(...memberBoxes.map((b) => b.minY))
    const maxY = Math.max(...memberBoxes.map((b) => b.maxY))

    clusters.push({
      id: `cluster_${clusters.length + 1}`,
      minX,
      maxX,
      minY,
      maxY,
      centerX: Math.round((minX + maxX) / 2),
      centerY: Math.round((minY + maxY) / 2),
      strokes: memberBoxes.map((b) => b.stroke),
    })
  }

  return clusters
}

/** Descreve a estrutura geométrica dos traços desenhados para que o agente possa inferir hierarquia e nós */
export function describeDrawingStructure(strokes: DrawingStroke[]): string {
  if (strokes.length === 0) return 'Nenhum traço fornecido.'

  const clusters = clusterStrokes(strokes)

  const descriptions = clusters.map((c, idx) => {
    const width = Math.round(c.maxX - c.minX)
    const height = Math.round(c.maxY - c.minY)
    const color = c.strokes[0]?.color || '#5B5BD6'
    return `- Agrupamento ${idx + 1} (id: "${c.id}"): posição central X=${c.centerX}, Y=${c.centerY}, tamanho aproximado ${width}x${height}px, cor predominante ${color}, contém ${c.strokes.length} traço(s).`
  })

  return `O usuário rabiscou/desenhou à mão livre no mapa mental. Total de traços: ${strokes.length}.
Estrutura identificada por proximidade espacial:
${descriptions.join('\n')}

Se houver um nó desenhado mais ao centro/alto ou com maior destaque, considere-o como nó pai ou conecte aos outros com base nas posições X e Y (itens à direita conectados ao pai central).`
}
