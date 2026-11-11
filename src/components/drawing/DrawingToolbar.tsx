import { Eraser, Hand, PenLine, Redo2, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DRAWING_COLORS, STROKE_WIDTHS, type DrawingTool } from '@/types/drawing'

interface DrawingToolbarProps {
  tool: DrawingTool
  color: string
  width: number
  canUndo: boolean
  canRedo: boolean
  onToolChange: (tool: DrawingTool) => void
  onColorChange: (color: string) => void
  onWidthChange: (width: number) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}

const toolClass = (active: boolean) =>
  `h-9 w-9 rounded-xl ${active ? 'bg-[#ece9ff] text-[#5c49c2]' : 'text-[#5f6073]'}`

function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-[#e4e5ed]" aria-hidden />
}

export function DrawingToolbar({
  tool,
  color,
  width,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onWidthChange,
  onUndo,
  onRedo,
  onClear,
}: DrawingToolbarProps) {
  return (
    <div className="absolute left-1/2 top-4 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-2xl border border-[#e2e3eb] bg-white/95 p-1.5 shadow-lg backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className={toolClass(tool === 'pen')}
        onClick={() => onToolChange('pen')}
        aria-label="Caneta"
        aria-pressed={tool === 'pen'}
        title="Caneta"
      >
        <PenLine className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={toolClass(tool === 'eraser')}
        onClick={() => onToolChange('eraser')}
        aria-label="Borracha"
        aria-pressed={tool === 'eraser'}
        title="Borracha"
      >
        <Eraser className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={toolClass(tool === 'pan')}
        onClick={() => onToolChange('pan')}
        aria-label="Mover a folha"
        aria-pressed={tool === 'pan'}
        title="Mover a folha"
      >
        <Hand className="h-4 w-4" />
      </Button>

      <Divider />

      {DRAWING_COLORS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onColorChange(item.value)}
          aria-label={`Cor ${item.name}`}
          aria-pressed={color === item.value}
          title={item.name}
          className={`h-6 w-6 shrink-0 rounded-full border-2 transition ${
            color === item.value
              ? 'scale-110 border-[#24243e]'
              : 'border-white ring-1 ring-[#e2e3eb]'
          }`}
          style={{ backgroundColor: item.value }}
        />
      ))}

      <Divider />

      {STROKE_WIDTHS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onWidthChange(item.value)}
          aria-label={`Espessura ${item.label}`}
          aria-pressed={width === item.value}
          title={item.label}
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            width === item.value ? 'bg-[#ece9ff]' : 'hover:bg-[#f3f3f8]'
          }`}
        >
          <span
            className="rounded-full bg-[#24243e]"
            style={{ width: item.value * 1.6 + 4, height: item.value * 1.6 + 4 }}
          />
        </button>
      ))}

      <Divider />

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl text-[#5f6073]"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Desfazer"
        title="Desfazer"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl text-[#5f6073]"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Refazer"
        title="Refazer"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl text-red-600 hover:text-red-700"
        onClick={onClear}
        aria-label="Limpar tudo"
        title="Limpar tudo"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
