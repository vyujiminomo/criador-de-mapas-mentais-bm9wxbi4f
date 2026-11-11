import { memo, useEffect, useMemo, useRef } from 'react'
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
  editingId: string | null
  zoom: number
  pan: { x: number; y: number }
  canvasRef: React.RefObject<HTMLDivElement>
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onNodePointerDown: (event: ReactPointerEvent<HTMLDivElement>, node: MindNode) => void
  onNodeClick: (node: MindNode) => void
  onNodeDoubleClick: (node: MindNode) => void
  onCommitNodeText: (node: MindNode, text: string) => void
  onCancelNodeEdit: (node: MindNode) => void
  onAddChild: (node: MindNode) => void
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void
}

export const EditorCanvas = memo(function EditorCanvas({
  nodes,
  selectedId,
  editingId,
  zoom,
  pan,
  canvasRef,
  onCanvasPointerDown,
  onNodePointerDown,
  onNodeClick,
  onNodeDoubleClick,
  onCommitNodeText,
  onCancelNodeEdit,
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
          const editing = editingId === node.id
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
              {editing ? (
                <InlineNodeEditor
                  node={node}
                  isRoot={isRoot}
                  onCommit={onCommitNodeText}
                  onCancel={onCancelNodeEdit}
                />
              ) : (
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
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

interface InlineNodeEditorProps {
  node: MindNode
  isRoot: boolean
  onCommit: (node: MindNode, text: string) => void
  onCancel: (node: MindNode) => void
}

/** Editor de texto embutido no próprio balão (sem pop-up). */
function InlineNodeEditor({ node, isRoot, onCommit, onCancel }: InlineNodeEditorProps) {
  const draftRef = useRef<HTMLTextAreaElement | null>(null)
  const draftValue = useRef(node.text)

  useEffect(() => {
    const element = draftRef.current
    if (!element) return
    element.focus()
    element.select()
  }, [])

  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      className={cn(
        'relative flex min-h-[62px] items-center border-2 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(37,39,70,0.12)] ring-4 ring-white ring-offset-2',
        node.shape === 'pill' && 'rounded-full',
        node.shape === 'rounded' && 'rounded-2xl',
        node.shape === 'rectangle' && 'rounded-md',
        isRoot && 'min-h-[74px]',
      )}
      style={{ backgroundColor: node.color, borderColor: node.color }}
    >
      <textarea
        ref={draftRef}
        rows={2}
        maxLength={280}
        defaultValue={node.text}
        onChange={(event) => {
          draftValue.current = event.target.value
          event.target.style.height = 'auto'
          event.target.style.height = `${event.target.scrollHeight}px`
        }}
        onBlur={() => onCommit(node, draftValue.current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onCommit(node, draftValue.current)
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            onCancel(node)
          }
        }}
        className="max-h-40 w-full resize-none border-0 bg-transparent text-center text-[15px] font-semibold leading-snug text-white outline-none placeholder:text-white/60 focus:ring-0"
        placeholder="Digite o texto do tópico"
      />
    </div>
  )
}
