import {
  Circle,
  Copy,
  Palette,
  PenLine,
  Plus,
  Redo2,
  Sparkles,
  Square,
  Trash2,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { MAP_COLORS, type MindNode, type NodeShape } from '@/types/mindmap'

interface EditorToolbarProps {
  selected: MindNode | null
  canDelete: boolean
  canUndo: boolean
  canRedo: boolean
  onAdd: () => void
  onDuplicate: () => void
  onDelete: () => void
  onColor: (color: string) => void
  onShape: (shape: NodeShape) => void
  onUndo: () => void
  onRedo: () => void
  onStartDrawing?: () => void
  onOpenAiNodeDialog?: () => void
  isDrawingMode?: boolean
}

const shapes: { value: NodeShape; label: string; icon: typeof Circle }[] = [
  { value: 'rounded', label: 'Arredondado', icon: Square },
  { value: 'pill', label: 'Pílula', icon: Circle },
  { value: 'rectangle', label: 'Retangular', icon: Square },
]

export function EditorToolbar({
  selected,
  canDelete,
  canUndo,
  canRedo,
  onAdd,
  onDuplicate,
  onDelete,
  onColor,
  onShape,
  onUndo,
  onRedo,
  onStartDrawing,
  onOpenAiNodeDialog,
  isDrawingMode,
}: EditorToolbarProps) {
  return (
    <div className="absolute left-1/2 top-4 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-[#e4e5ed] bg-white/95 p-1.5 shadow-[0_14px_40px_rgba(35,36,65,0.12)] backdrop-blur-xl sm:top-5">
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        disabled={!selected}
        className="h-9 shrink-0 rounded-xl px-3"
        title="Adicionar tópico"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Tópico
      </Button>

      {onOpenAiNodeDialog && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAiNodeDialog}
          className="h-9 shrink-0 gap-1.5 rounded-xl px-2.5 font-medium text-[#6250ca] hover:bg-[#ece9ff] hover:text-[#5c49c2]"
          aria-label="Escrever texto para a IA criar nó"
          title="Escrever texto para a IA criar nó"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden text-xs font-semibold sm:inline">Nó com IA</span>
        </Button>
      )}

      {onStartDrawing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartDrawing}
          className={cn(
            'h-9 shrink-0 gap-1.5 rounded-xl px-2.5 font-medium transition',
            isDrawingMode
              ? 'bg-[#ece9ff] text-[#5c49c2] ring-1 ring-[#5c49c2]/40'
              : 'text-[#24243e] hover:bg-[#f1f2f8] hover:text-[#5c49c2]',
          )}
          aria-label="Desenhar à mão livre no mapa"
          title="Desenhar à mão livre no mapa e converter em nós com IA"
        >
          <PenLine className="h-4 w-4 text-[#6250ca]" />
          <span className="hidden text-xs font-semibold sm:inline">Desenhar</span>
        </Button>
      )}

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onDuplicate}
        disabled={!selected}
        className="h-9 w-9 shrink-0 rounded-xl"
        title="Duplicar nó"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={!selected}
            className="h-9 w-9 shrink-0 rounded-xl"
            title="Escolher cor"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-auto rounded-2xl p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cor do tópico
          </p>
          <div className="flex gap-2">
            {MAP_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColor(color)}
                aria-label={`Usar cor ${color}`}
                className={cn(
                  'h-8 w-8 rounded-full border-2 border-white shadow-sm ring-offset-2 transition hover:scale-110',
                  selected?.color === color && 'ring-2 ring-[#45445f]',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={!selected}
            className="h-9 w-9 shrink-0 rounded-xl"
            title="Escolher formato"
          >
            <Square className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-48 rounded-2xl p-2">
          {shapes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onShape(value)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-[#f2f1fa]',
                selected?.shape === value && 'bg-[#eeebff] font-semibold text-[#5d49c6]',
              )}
            >
              <Icon className={cn('h-4 w-4', value === 'rectangle' && 'rounded-none')} />
              {label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={!canDelete}
        className="h-9 w-9 shrink-0 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
        title="Excluir ramo"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-9 w-9 shrink-0 rounded-xl"
        title="Desfazer"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        className="h-9 w-9 shrink-0 rounded-xl"
        title="Refazer"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
