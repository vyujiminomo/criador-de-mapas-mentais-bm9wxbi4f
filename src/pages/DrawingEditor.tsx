import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'
import { DrawingCanvas } from '@/components/drawing/DrawingCanvas'
import { DrawingToolbar } from '@/components/drawing/DrawingToolbar'
import { ZoomControls } from '@/components/editor/ZoomControls'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useDrawingHistory } from '@/hooks/use-drawing-history'
import { clampZoom, fitView, strokeHit, type DrawingView } from '@/lib/drawing-geometry'
import { getErrorMessage } from '@/lib/get-error-message'
import { deleteDrawing, getDrawing, updateDrawing } from '@/services/drawings'
import {
  DRAWING_COLORS,
  STROKE_WIDTHS,
  type Drawing,
  type DrawingStroke,
  type DrawingTool,
  type StrokePoint,
} from '@/types/drawing'

const ERASER_RADIUS = 14 // px na tela

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export default function DrawingEditor() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const mainRef = useRef<HTMLElement>(null)
  const strokesRef = useRef<DrawingStroke[]>([])
  const activeStrokeRef = useRef<string | null>(null)
  const erasingRef = useRef(false)
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [tool, setTool] = useState<DrawingTool>('pen')
  const [color, setColor] = useState<string>(DRAWING_COLORS[0].value)
  const [width, setWidth] = useState<number>(STROKE_WIDTHS[1].value)
  const [view, setView] = useState<DrawingView>({ zoom: 1, pan: { x: 0, y: 0 } })
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [clearOpen, setClearOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { status, schedule, flush } = useAutoSave()
  const history = useDrawingHistory()
  const { strokes } = history
  strokesRef.current = strokes

  const fitToScreen = useCallback((items: DrawingStroke[]) => {
    const rect = mainRef.current?.getBoundingClientRect()
    if (!rect) return
    setView(fitView(items, rect.width, rect.height))
  }, [])

  const { reset } = history
  useEffect(() => {
    let active = true
    getDrawing(id)
      .then((loaded) => {
        if (!active) return
        setDrawing(loaded)
        setTitleDraft(loaded.title)
        reset(loaded.strokes)
        requestAnimationFrame(() => fitToScreen(loaded.strokes))
      })
      .catch((error) => {
        if (!active) return
        toast({
          variant: 'destructive',
          title: 'Não foi possível abrir este desenho',
          description: getErrorMessage(error),
        })
        navigate('/', { replace: true })
      })
    return () => {
      active = false
    }
  }, [id, navigate, toast, reset, fitToScreen])

  const persistStrokes = () =>
    schedule('strokes', () => updateDrawing(id, { strokes: strokesRef.current }))

  function handleStrokeStart(point: StrokePoint) {
    const strokeId = newId()
    history.commit(strokesRef.current)
    history.set((current) => [...current, { id: strokeId, color, width, points: [point] }])
    activeStrokeRef.current = strokeId
  }

  function handleStrokePoint(point: StrokePoint) {
    const strokeId = activeStrokeRef.current
    if (!strokeId) return
    history.set((current) =>
      current.map((stroke) =>
        stroke.id === strokeId ? { ...stroke, points: [...stroke.points, point] } : stroke,
      ),
    )
  }

  function handleStrokeEnd() {
    if (!activeStrokeRef.current) return
    activeStrokeRef.current = null
    persistStrokes()
  }

  function handleErase(point: StrokePoint) {
    const radius = ERASER_RADIUS / view.zoom
    const hits = (items: DrawingStroke[]) => items.filter((s) => !strokeHit(s, point, radius))
    if (hits(strokesRef.current).length === strokesRef.current.length) return
    if (!erasingRef.current) {
      history.commit(strokesRef.current)
      erasingRef.current = true
    }
    history.set(hits)
  }

  function handleEraseEnd() {
    if (!erasingRef.current) return
    erasingRef.current = false
    persistStrokes()
  }

  function handleGestureCancel() {
    // Segundo dedo: o gesto de desenho/apagar vira zoom e pan, então é desfeito.
    if (activeStrokeRef.current || erasingRef.current) history.discard()
    activeStrokeRef.current = null
    erasingRef.current = false
  }

  function handleUndo() {
    history.undo()
    persistStrokes()
  }

  function handleRedo() {
    history.redo()
    persistStrokes()
  }

  function confirmClear() {
    history.commit(strokesRef.current)
    history.set(() => [])
    setClearOpen(false)
    persistStrokes()
  }

  function zoomBy(factor: number) {
    const rect = mainRef.current?.getBoundingClientRect()
    if (!rect) return
    setView((current) => {
      const zoom = clampZoom(current.zoom * factor)
      const cx = rect.width / 2
      const cy = rect.height / 2
      const wx = (cx - current.pan.x) / current.zoom
      const wy = (cy - current.pan.y) / current.zoom
      return { zoom, pan: { x: cx - wx * zoom, y: cy - wy * zoom } }
    })
  }

  async function saveTitle() {
    setEditingTitle(false)
    if (!drawing) return
    const next = titleDraft.trim() || 'Desenho sem título'
    setTitleDraft(next)
    if (next === drawing.title) return
    setDrawing({ ...drawing, title: next })
    schedule('title', () => updateDrawing(id, { title: next }))
  }

  async function toggleFavorite() {
    if (!drawing) return
    const next = !drawing.favorite
    setDrawing({ ...drawing, favorite: next })
    try {
      await updateDrawing(id, { favorite: next })
    } catch (error) {
      setDrawing((current) => (current ? { ...current, favorite: !next } : current))
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar o favorito',
        description: getErrorMessage(error),
      })
    }
  }

  async function confirmDelete() {
    try {
      await deleteDrawing(id)
      toast({ title: 'Desenho excluído' })
      navigate('/', { replace: true })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: getErrorMessage(error),
      })
    }
  }

  if (!drawing) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[#f7f8fc] text-sm text-[#77788d]">
        Abrindo desenho...
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f8fc] text-[#24243e]">
      <header className="relative z-40 flex h-[68px] shrink-0 items-center border-b border-[#e2e3eb] bg-white px-3 shadow-sm sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            await flush()
            navigate('/')
          }}
          className="h-10 w-10 shrink-0 rounded-xl"
          aria-label="Voltar para meus itens"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-2 min-w-0 flex-1 sm:ml-4">
          {editingTitle ? (
            <Input
              autoFocus
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => void saveTitle()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void saveTitle()
                if (event.key === 'Escape') {
                  setTitleDraft(drawing.title)
                  setEditingTitle(false)
                }
              }}
              className="h-9 max-w-md rounded-lg border-[#dcdde7] font-semibold"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="group flex max-w-full items-center gap-2 text-left"
            >
              <span className="truncate font-semibold">{drawing.title}</span>
              <Pencil className="h-3.5 w-3.5 shrink-0 text-[#aaaabb] opacity-0 transition group-hover:opacity-100" />
            </button>
          )}
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9293a3]">
            {status === 'saving' && (
              <>
                <Cloud className="h-3 w-3" />
                Salvando...
              </>
            )}
            {status === 'saved' && (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                Salvo automaticamente
              </>
            )}
            {status === 'error' && (
              <>
                <CloudOff className="h-3 w-3 text-red-500" />
                Falha ao salvar
              </>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void toggleFavorite()}
          className="h-10 w-10 rounded-xl"
          aria-label={drawing.favorite ? 'Remover dos favoritos' : 'Favoritar desenho'}
        >
          <Star
            className={`h-5 w-5 ${drawing.favorite ? 'fill-[#f7b83b] text-[#f7b83b]' : 'text-[#77788d]'}`}
          />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
            <DropdownMenuItem onSelect={() => setEditingTitle(true)} className="rounded-lg">
              <Pencil className="mr-2 h-4 w-4" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="rounded-lg text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir desenho
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main ref={mainRef} className="relative min-h-0 flex-1 overflow-hidden">
        <DrawingCanvas
          strokes={strokes}
          view={view}
          tool={tool}
          onViewChange={setView}
          onStrokeStart={handleStrokeStart}
          onStrokePoint={handleStrokePoint}
          onStrokeEnd={handleStrokeEnd}
          onErase={handleErase}
          onEraseEnd={handleEraseEnd}
          onGestureStart={handleGestureCancel}
        />
        <DrawingToolbar
          tool={tool}
          color={color}
          width={width}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onToolChange={setTool}
          onColorChange={(value) => {
            setColor(value)
            setTool('pen')
          }}
          onWidthChange={setWidth}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={() => setClearOpen(true)}
        />
        <ZoomControls
          zoom={view.zoom}
          onZoomIn={() => zoomBy(1.25)}
          onZoomOut={() => zoomBy(0.8)}
          onFit={() => fitToScreen(strokesRef.current)}
        />
      </main>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Limpar todo o desenho?</DialogTitle>
            <DialogDescription>
              Todos os traços serão removidos. Você pode desfazer essa ação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={confirmClear} variant="destructive" className="rounded-xl">
              Limpar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir “{drawing.title}”?</DialogTitle>
            <DialogDescription>
              O desenho será removido. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={confirmDelete} variant="destructive" className="rounded-xl">
              Excluir desenho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
