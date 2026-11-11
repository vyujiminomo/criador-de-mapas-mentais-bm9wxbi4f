import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { strokePath } from '@/lib/drawing-geometry'
import type { DrawingStroke, DrawingTool, StrokePoint } from '@/types/drawing'

interface MindDrawingOverlayProps {
  strokes: DrawingStroke[]
  tool: DrawingTool
  color: string
  width: number
  zoom: number
  pan: { x: number; y: number }
  onStrokeAdd: (stroke: DrawingStroke) => void
  onEraseAt: (point: StrokePoint, radius: number) => void
  onPanBy?: (dx: number, dy: number) => void
}

export function MindDrawingOverlay({
  strokes,
  tool,
  color,
  width,
  zoom,
  pan,
  onStrokeAdd,
  onEraseAt,
  onPanBy,
}: MindDrawingOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const currentPointsRef = useRef<StrokePoint[]>([])
  const currentPathRef = useRef<SVGPathElement>(null)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)

  const toWorld = (clientX: number, clientY: number): StrokePoint => {
    const rect = containerRef.current?.getBoundingClientRect()
    const sx = clientX - (rect?.left ?? 0)
    const sy = clientY - (rect?.top ?? 0)
    return [(sx - pan.x) / zoom, (sy - pan.y) / zoom]
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const [wx, wy] = toWorld(e.clientX, e.clientY)

    if (tool === 'pan' || e.button === 1) {
      panStartRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    if (tool === 'pen') {
      isDrawingRef.current = true
      currentPointsRef.current = [[wx, wy]]
      if (currentPathRef.current) {
        currentPathRef.current.setAttribute('d', strokePath([[wx, wy]]))
        currentPathRef.current.setAttribute('stroke', color)
        currentPathRef.current.setAttribute('stroke-width', String(width))
      }
    } else if (tool === 'eraser') {
      isDrawingRef.current = true
      onEraseAt([wx, wy], 18 / zoom)
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (panStartRef.current && onPanBy) {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      panStartRef.current = { x: e.clientX, y: e.clientY }
      onPanBy(dx, dy)
      return
    }

    if (!isDrawingRef.current) return
    const [wx, wy] = toWorld(e.clientX, e.clientY)

    if (tool === 'pen') {
      currentPointsRef.current.push([wx, wy])
      if (currentPathRef.current) {
        currentPathRef.current.setAttribute('d', strokePath(currentPointsRef.current))
      }
    } else if (tool === 'eraser') {
      onEraseAt([wx, wy], 18 / zoom)
    }
  }

  const handlePointerUp = () => {
    panStartRef.current = null
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    if (tool === 'pen' && currentPointsRef.current.length > 0) {
      const newStroke: DrawingStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        points: currentPointsRef.current,
        color,
        width,
      }
      onStrokeAdd(newStroke)
      currentPointsRef.current = []
      if (currentPathRef.current) {
        currentPathRef.current.setAttribute('d', '')
      }
    }
  }

  const cursor = tool === 'pan' ? 'grab' : tool === 'eraser' ? 'cell' : 'crosshair'

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 touch-none select-none bg-indigo-900/[0.03]"
      style={{ cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {strokes.map((stroke) => (
            <path
              key={stroke.id}
              d={strokePath(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* Traço que está sendo desenhado no momento */}
          <path
            ref={currentPathRef}
            d=""
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  )
}
