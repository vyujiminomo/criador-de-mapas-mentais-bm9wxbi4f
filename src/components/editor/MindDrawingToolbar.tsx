import { useState } from 'react'
import { Eraser, Hand, PenLine, Redo2, Sparkles, Trash2, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DRAWING_COLORS, STROKE_WIDTHS, type DrawingTool } from '@/types/drawing'

interface MindDrawingToolbarProps {
  tool: DrawingTool
  color: string
  width: number
  strokeCount: number
  canUndo: boolean
  canRedo: boolean
  isConverting: boolean
  onToolChange: (tool: DrawingTool) => void
  onColorChange: (color: string) => void
  onWidthChange: (width: number) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onClose: () => void
  onConvert: (hint?: string) => void
}

const toolClass = (active: boolean) =>
  `h-9 w-9 rounded-xl ${active ? 'bg-[#ece9ff] text-[#5c49c2]' : 'text-[#5f6073]'}`

function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-[#e4e5ed]" aria-hidden />
}

export function MindDrawingToolbar({
  tool,
  color,
  width,
  strokeCount,
  canUndo,
  canRedo,
  isConverting,
  onToolChange,
  onColorChange,
  onWidthChange,
  onUndo,
  onRedo,
  onClear,
  onClose,
  onConvert,
}: MindDrawingToolbarProps) {
  const [hint, setHint] = useState('')
  const [showHintInput, setShowHintInput] = useState(false)

  return (
    <div className="absolute left-1/2 top-4 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-[#d8d9e8] bg-white/95 p-1.5 shadow-[0_14px_40px_rgba(35,36,65,0.18)] backdrop-blur-xl">
        {/* Fechar modo desenho */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100"
          onClick={onClose}
          aria-label="Sair do modo desenho"
          title="Sair do modo desenho"
        >
          <X className="h-4 w-4" />
        </Button>

        <Divider />

        {/* Ferramentas de desenho */}
        <Button
          variant="ghost"
          size="icon"
          className={toolClass(tool === 'pen')}
          onClick={() => onToolChange('pen')}
          aria-label="Caneta"
          title="Caneta (desenhar nós ou rabiscos)"
        >
          <PenLine className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={toolClass(tool === 'eraser')}
          onClick={() => onToolChange('eraser')}
          aria-label="Borracha"
          title="Borracha"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={toolClass(tool === 'pan')}
          onClick={() => onToolChange('pan')}
          aria-label="Mover tela"
          title="Mover tela"
        >
          <Hand className="h-4 w-4" />
        </Button>

        <Divider />

        {/* Cores */}
        <div className="flex items-center gap-1 px-1">
          {DRAWING_COLORS.slice(0, 5).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onColorChange(item.value)}
              aria-label={`Cor ${item.name}`}
              className={`h-6 w-6 shrink-0 rounded-full border-2 transition ${
                color === item.value
                  ? 'scale-110 border-[#24243e] ring-2 ring-[#5c49c2]/40'
                  : 'border-white ring-1 ring-[#e2e3eb]'
              }`}
              style={{ backgroundColor: item.value }}
            />
          ))}
        </div>

        <Divider />

        {/* Espessuras */}
        <div className="flex items-center gap-0.5">
          {STROKE_WIDTHS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onWidthChange(item.value)}
              aria-label={`Espessura ${item.label}`}
              className={`grid h-8 w-8 place-items-center rounded-lg ${
                width === item.value ? 'bg-[#ece9ff]' : 'hover:bg-[#f3f3f8]'
              }`}
            >
              <span
                className="rounded-full bg-[#24243e]"
                style={{ width: item.value * 1.4 + 3, height: item.value * 1.4 + 3 }}
              />
            </button>
          ))}
        </div>

        <Divider />

        {/* Histórico */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-[#5f6073]"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Desfazer"
          title="Desfazer traço"
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
          title="Refazer traço"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onClear}
          disabled={strokeCount === 0}
          aria-label="Limpar rascunho"
          title="Limpar rascunho"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Divider />

        {/* Botão de conversão com IA */}
        <Button
          size="sm"
          className="h-9 rounded-xl bg-gradient-to-r from-[#6250ca] to-[#8b5cf6] px-3 font-semibold text-white shadow-md transition hover:from-[#5341b5] hover:to-[#7c3aed]"
          disabled={strokeCount === 0 || isConverting}
          onClick={() => onConvert(hint)}
        >
          <Sparkles className="mr-1.5 h-4 w-4 animate-pulse" />
          {isConverting ? 'IA convertendo...' : 'Converter em Nós com IA'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-xl px-2 text-xs text-[#6250ca]"
          onClick={() => setShowHintInput((v) => !v)}
          title="Adicionar instrução para a IA"
        >
          {showHintInput ? 'Ocultar dica' : '+ Dica'}
        </Button>
      </div>

      {showHintInput && (
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-[#d8d9e8] bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Ex: O que está escrito é 'Estratégia 2025' com 3 ramos..."
            className="w-full bg-transparent text-xs text-[#24243e] outline-none placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && strokeCount > 0 && !isConverting) {
                onConvert(hint)
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
