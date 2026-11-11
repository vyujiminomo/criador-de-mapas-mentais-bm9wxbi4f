import { memo, useMemo } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MindNode } from '@/types/mindmap'

export const CANVAS_WIDTH = 2400
export const CANVAS_HEIGHT = 1500
export const NODE_WIDTH = 210
export const NODE_HEIGHT = 62

interface EditorCanvasProps {
  nodes: MindNode[]
  selectedId: string | null
  zoom: number
  pan: { x: number; y: number }
  canvasRef: React.RefObject<HTMLDivElement>
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onNodePointerDown: (event: ReactPointerEvent<HTMLDivElement>, node: MindNode) => void
  onNodeClick: (node: MindNode) => void
  onNodeDoubleClick: (node: MindNode) => void
  onAddChild: (node: MindNode) => void
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void
}

export const EditorCanvas = memo(function EditorCanvas({
  nodes,
  selectedId,
  zoom,
  pan,
  canvasRef,
  onCanvasPointerDown,
  onNodePointerDown,
  onNodeClick,
  onNodeDoubleClick,
  onAddChild,
  onWheel,
}: EditorCanvasProps) {
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])

  return (
    <div
      ref={canvasRef}
      className="editor-canvas absolute inset-0 cursor-grab overflow-hidden bg-[#f7f8fc] active:cursor-grabbing"
      onPointerDown={onCanvasPointerDown}
      onWheel={onWheel}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <filter id="connectionShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.06" />
            </filter>
          </defs>
          {nodes.map((node) => {
            const parent = node.parent ? nodeById.get(node.parent) : undefined
            if (!parent) return null
            const goesRight = node.x >= parent.x
            const startX = parent.x + (goesRight ? NODE_WIDTH / 2 : -NODE_WIDTH / 2)
            const endX = node.x + (goesRight ? -NODE_WIDTH / 2 : NODE_WIDTH / 2)
            const midX = (startX + endX) / 2
            return (
              <path
                key={`connection-${node.id}`}
                d={`M ${startX} ${parent.y} C ${midX} ${parent.y}, ${midX} ${node.y}, ${endX} ${node.y}`}
                fill="none"
                stroke={node.color}
                strokeWidth={selectedId === node.id ? 5 : 4}
                strokeLinecap="round"
                opacity={selectedId === node.id ? 0.95 : 0.65}
                filter="url(#connectionShadow)"
              />
            )
          })}
        </svg>

        {nodes.map((node) => {
          const selected = selectedId === node.id
          const isRoot = !node.parent
          return (
            <div
              key={node.id}
              className="absolute touch-none select-none"
              style={{
                left: node.x,
                top: node.y,
                transform: 'translate(-50%, -50%)',
                width: NODE_WIDTH,
                zIndex: selected ? 20 : 10,
              }}
              onPointerDown={(event) => onNodePointerDown(event, node)}
              onClick={(event) => {
                event.stopPropagation()
                onNodeClick(node)
              }}
              onDoubleClick={(event) => {
                event.stopPropagation()
                onNodeDoubleClick(node)
              }}
            >
              <div
                className={cn(
                  'relative flex min-h-[62px] items-center justify-center border-2 px-5 py-3 text-center text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(37,39,70,0.12)] transition-[box-shadow,transform]',
                  node.shape === 'pill' && 'rounded-full',
                  node.shape === 'rounded' && 'rounded-2xl',
                  node.shape === 'rectangle' && 'rounded-md',
                  isRoot && 'min-h-[74px] text-[17px]',
                  selected && 'ring-4 ring-white ring-offset-2',
                )}
                style={{
                  backgroundColor: node.color,
                  borderColor: selected ? node.color : 'transparent',
                  boxShadow: selected ? `0 12px 35px ${node.color}40` : undefined,
                }}
              >
                <span className="line-clamp-3 leading-snug">{node.text}</span>
                {selected && (
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation()
                      onAddChild(node)
                    }}
                    className="absolute -right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[#28283e] text-white shadow-lg transition hover:scale-110"
                    aria-label={`Adicionar subtópico a ${node.text}`}
                    title="Adicionar subtópico"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
