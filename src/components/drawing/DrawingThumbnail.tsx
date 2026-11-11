import { PenLine } from 'lucide-react'
import { strokeBounds, strokePath } from '@/lib/drawing-geometry'
import type { DrawingStroke } from '@/types/drawing'

interface DrawingThumbnailProps {
  strokes: DrawingStroke[]
  className?: string
}

export function DrawingThumbnail({ strokes, className = '' }: DrawingThumbnailProps) {
  const bounds = strokeBounds(strokes)
  if (!bounds) {
    return (
      <div className={`grid place-items-center bg-[#fbfbfd] ${className}`}>
        <PenLine className="h-12 w-12 text-[#6250ca]/40" />
      </div>
    )
  }

  const pad = 40
  const x = bounds.minX - pad
  const y = bounds.minY - pad
  const width = Math.max(bounds.maxX - bounds.minX, 1) + pad * 2
  const height = Math.max(bounds.maxY - bounds.minY, 1) + pad * 2

  return (
    <div className={`overflow-hidden bg-[#fbfbfd] ${className}`}>
      <svg
        viewBox={`${x} ${y} ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label="Miniatura do desenho"
      >
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
      </svg>
    </div>
  )
}
