import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { clampZoom, strokePath, type DrawingView } from '@/lib/drawing-geometry'
import type { DrawingStroke, DrawingTool, StrokePoint } from '@/types/drawing'

const GRID_SIZE = 32
const GRID_COLOR = '#e1e4ec'

interface DrawingCanvasProps {
  strokes: DrawingStroke[]
  view: DrawingView
  tool: DrawingTool
  onViewChange: (view: DrawingView) => void
  onStrokeStart: (point: StrokePoint) => void
  onStrokePoint: (point: StrokePoint) => void
  onStrokeEnd: () => void
  onErase: (point: StrokePoint) => void
  onEraseEnd: () => void
  onGestureStart: () => void
}

type Mode = 'draw' | 'erase' | 'pan' | null

export function DrawingCanvas({
  strokes,
  view,
  tool,
  onViewChange,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onErase,
  onEraseEnd,
  onGestureStart,
}: DrawingCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef(view)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const modeRef = useRef<Mode>(null)
  const panRef = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 })
  const pinchRef = useRef<{ distance: number; midX: number; midY: number } | null>(null)

  viewRef.current = view

  // Zoom com a roda do mouse, centrado no cursor (listener nativo para permitir preventDefault).
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const current = viewRef.current
      const zoom = clampZoom(current.zoom * Math.exp(-event.deltaY * 0.002))
      const sx = event.clientX - rect.left
      const sy = event.clientY - rect.top
      const wx = (sx - current.pan.x) / current.zoom
      const wy = (sy - current.pan.y) / current.zoom
      const next = { zoom, pan: { x: sx - wx * zoom, y: sy - wy * zoom } }
      viewRef.current = next
      onViewChange(next)
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [onViewChange])

  function toWorld(clientX: number, clientY: number): StrokePoint {
    const rect = rootRef.current?.getBoundingClientRect()
    const { zoom, pan } = viewRef.current
    const sx = clientX - (rect?.left ?? 0)
    const sy = clientY - (rect?.top ?? 0)
    return [(sx - pan.x) / zoom, (sy - pan.y) / zoom]
  }

  function pinchGeometry() {
    const [a, b] = [...pointersRef.current.values()]
    const rect = rootRef.current?.getBoundingClientRect()
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      midX: (a.x + b.x) / 2 - (rect?.left ?? 0),
      midY: (a.y + b.y) / 2 - (rect?.top ?? 0),
    }
  }

  function applyPinch() {
    const prev = pinchRef.current
    const next = pinchGeometry()
    pinchRef.current = next
    if (!prev || prev.distance === 0) return
    const current = viewRef.current
    const zoom = clampZoom(current.zoom * (next.distance / prev.distance))
    const wx = (prev.midX - current.pan.x) / current.zoom
    const wy = (prev.midY - current.pan.y) / current.zoom
    const nextView = { zoom, pan: { x: next.midX - wx * zoom, y: next.midY - wy * zoom } }
    viewRef.current = nextView
    onViewChange(nextView)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 2) {
      // Segundo dedo: cancela o traço/apagar em andamento e passa a fazer pinça (zoom + pan).
      if (modeRef.current === 'draw' || modeRef.current === 'erase') onGestureStart()
      modeRef.current = null
      pinchRef.current = pinchGeometry()
      return
    }
    if (pointersRef.current.size > 2) return

    if (tool === 'pan' || event.button === 1) {
      modeRef.current = 'pan'
      panRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        panX: viewRef.current.pan.x,
        panY: viewRef.current.pan.y,
      }
      return
    }
    const point = toWorld(event.clientX, event.clientY)
    if (tool === 'pen') {
      modeRef.current = 'draw'
      onStrokeStart(point)
    } else {
      modeRef.current = 'erase'
      onErase(point)
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pointer = pointersRef.current.get(event.pointerId)
    if (!pointer) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    if (pointersRef.current.size >= 2) {
      applyPinch()
      return
    }
    const mode = modeRef.current
    if (mode === 'pan') {
      const start = panRef.current
      const current = viewRef.current
      const next = {
        zoom: current.zoom,
        pan: {
          x: start.panX + event.clientX - start.clientX,
          y: start.panY + event.clientY - start.clientY,
        },
      }
      viewRef.current = next
      onViewChange(next)
    } else if (mode === 'draw') {
      onStrokePoint(toWorld(event.clientX, event.clientY))
    } else if (mode === 'erase') {
      onErase(toWorld(event.clientX, event.clientY))
    }
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.delete(event.pointerId)) return
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) {
      const mode = modeRef.current
      modeRef.current = null
      if (mode === 'draw') onStrokeEnd()
      if (mode === 'erase') onEraseEnd()
    }
  }

  const gridSize = GRID_SIZE * view.zoom
  const cursor = tool === 'pan' ? 'grab' : tool === 'eraser' ? 'cell' : 'crosshair'

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 touch-none select-none overflow-hidden bg-[#fbfbfd]"
      style={{
        backgroundImage: `linear-gradient(to right, ${GRID_COLOR} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_COLOR} 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${view.pan.x}px ${view.pan.y}px`,
        cursor,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        role="img"
        aria-label="Área de desenho"
      >
        <g transform={`translate(${view.pan.x} ${view.pan.y}) scale(${view.zoom})`}>
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
        </g>
      </svg>
    </div>
  )
}
