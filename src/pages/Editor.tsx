import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'
import { EditorCanvas, CANVAS_HEIGHT, CANVAS_WIDTH } from '@/components/editor/EditorCanvas'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
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
import { useEditorHistory } from '@/hooks/use-editor-history'
import {
  createNode,
  deleteMap,
  deleteNodeBranch,
  getMap,
  listNodes,
  updateMap,
  updateNode,
} from '@/services/mindmaps'
import type { MindMap, MindNode, NodeShape } from '@/types/mindmap'
import { getErrorMessage } from '@/lib/get-error-message'

interface DragState {
  type: 'node' | 'pan'
  nodeId?: string
  startClientX: number
  startClientY: number
  startX: number
  startY: number
  moved: boolean
  snapshot: MindNode[]
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export default function Editor() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const nodesRef = useRef<MindNode[]>([])
  const [map, setMap] = useState<MindMap | null>(null)
  const [nodes, setNodes] = useState<MindNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.72)
  const [pan, setPan] = useState({ x: -250, y: -300 })
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [deleteMapOpen, setDeleteMapOpen] = useState(false)
  const [deleteBranchOpen, setDeleteBranchOpen] = useState(false)
  const { status, schedule, flush } = useAutoSave()
  const history = useEditorHistory()

  const setNodesSynced = useCallback(
    (value: MindNode[] | ((current: MindNode[]) => MindNode[])) => {
      setNodes((current) => {
        const next = typeof value === 'function' ? value(current) : value
        nodesRef.current = next
        history.syncCurrent(next)
        return next
      })
    },
    [history],
  )

  useEffect(() => {
    let active = true
    Promise.all([getMap(id), listNodes(id)])
      .then(([loadedMap, loadedNodes]) => {
        if (!active) return
        setMap(loadedMap)
        setTitleDraft(loadedMap.title)
        setNodesSynced(loadedNodes)
        history.reset(loadedNodes)
        setSelectedId(loadedNodes.find((node) => !node.parent)?.id ?? loadedNodes[0]?.id ?? null)
        setLoading(false)
        requestAnimationFrame(() => fitToScreen(loadedNodes))
      })
      .catch((error) => {
        if (!active) return
        toast({
          variant: 'destructive',
          title: 'Não foi possível abrir este mapa',
          description: getErrorMessage(error),
        })
        navigate('/', { replace: true })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const selected = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? null,
    [nodes, selectedId],
  )

  const fitToScreen = useCallback((items = nodesRef.current) => {
    const element = canvasRef.current
    if (!element || !items.length) return
    const minX = Math.min(...items.map((node) => node.x)) - 180
    const maxX = Math.max(...items.map((node) => node.x)) + 180
    const minY = Math.min(...items.map((node) => node.y)) - 110
    const maxY = Math.max(...items.map((node) => node.y)) + 110
    const nextZoom = clamp(
      Math.min(element.clientWidth / (maxX - minX), element.clientHeight / (maxY - minY)) * 0.82,
      0.32,
      1.25,
    )
    setZoom(nextZoom)
    setPan({
      x: (element.clientWidth - (minX + maxX) * nextZoom) / 2,
      y: (element.clientHeight - (minY + maxY) * nextZoom) / 2,
    })
  }, [])

  const persistSnapshot = useCallback(
    (before: MindNode[], after: MindNode[]) => {
      const previousById = new Map(before.map((node) => [node.id, node]))
      const afterById = new Map(after.map((node) => [node.id, node]))
      for (const node of after) {
        const old = previousById.get(node.id)
        if (!old) continue
        if (
          old.text !== node.text ||
          old.x !== node.x ||
          old.y !== node.y ||
          old.color !== node.color ||
          old.shape !== node.shape ||
          old.parent !== node.parent ||
          old.sortOrder !== node.sortOrder
        ) {
          schedule(`node-${node.id}`, () =>
            updateNode(
              node.id,
              {
                text: node.text,
                x: node.x,
                y: node.y,
                color: node.color,
                shape: node.shape,
                parent: node.parent,
                sortOrder: node.sortOrder,
              },
              node.map,
            ),
          )
        }
      }
      for (const old of before) {
        if (!afterById.has(old.id)) void deleteNodeBranch(old.id, before)
      }
    },
    [schedule],
  )

  function applyHistory(next: MindNode[] | null) {
    if (!next) return
    const before = nodesRef.current
    setNodesSynced(next)
    persistSnapshot(before, next)
    if (selectedId && !next.some((node) => node.id === selectedId))
      setSelectedId(next[0]?.id ?? null)
  }

  async function addChild(parent = selected) {
    if (!parent || !map) return
    history.checkpoint(nodesRef.current)
    const siblings = nodesRef.current.filter((node) => node.parent === parent.id)
    const side = parent.x >= 1100 ? 1 : -1
    const index = siblings.length
    const child = await createNode({
      mapId: map.id,
      parent: parent.id,
      text: 'Novo tópico',
      x: clamp(parent.x + side * 350, 140, CANVAS_WIDTH - 140),
      y: clamp(
        parent.y + (index - (siblings.length - 1) / 2) * 130 + (index % 2 === 0 ? 80 : -80),
        90,
        CANVAS_HEIGHT - 90,
      ),
      color: parent.color,
      shape: parent.shape,
      sortOrder: nodesRef.current.length,
    })
    setNodesSynced((current) => [...current, child])
    setSelectedId(child.id)
    setEditingId(child.id)
  }

  async function duplicateSelected() {
    if (!selected || !map) return
    history.checkpoint(nodesRef.current)
    const duplicate = await createNode({
      mapId: map.id,
      parent: selected.parent,
      text: `${selected.text} — cópia`,
      x: clamp(selected.x + 70, 140, CANVAS_WIDTH - 140),
      y: clamp(selected.y + 90, 90, CANVAS_HEIGHT - 90),
      color: selected.color,
      shape: selected.shape,
      sortOrder: nodesRef.current.length,
    })
    setNodesSynced((current) => [...current, duplicate])
    setSelectedId(duplicate.id)
  }

  async function confirmDeleteBranch() {
    if (!selected || !selected.parent) return
    const before = nodesRef.current
    history.checkpoint(before)
    const deleted = await deleteNodeBranch(selected.id, before)
    setNodesSynced(before.filter((node) => !deleted.has(node.id)))
    setSelectedId(selected.parent)
    setDeleteBranchOpen(false)
  }

  function changeSelected(changes: Partial<MindNode>) {
    if (!selected) return
    history.checkpoint(nodesRef.current)
    const next = nodesRef.current.map((node) =>
      node.id === selected.id ? { ...node, ...changes } : node,
    )
    setNodesSynced(next)
    schedule(`node-${selected.id}`, () => updateNode(selected.id, changes, selected.map))
  }

  function startEditing(node: MindNode) {
    setSelectedId(node.id)
    setEditingId(node.id)
  }

  function commitNodeText(node: MindNode, text: string) {
    setEditingId((current) => (current === node.id ? null : current))
    const next = text.trim() || 'Novo tópico'
    const current = nodesRef.current.find((item) => item.id === node.id)
    if (!current || current.text === next) return
    history.checkpoint(nodesRef.current)
    setNodesSynced(
      nodesRef.current.map((item) => (item.id === node.id ? { ...item, text: next } : item)),
    )
    schedule(`node-${node.id}`, () => updateNode(node.id, { text: next }, node.map))
  }

  function cancelNodeEdit(node: MindNode) {
    setEditingId((current) => (current === node.id ? null : current))
  }

  async function saveTitle() {
    if (!map) return
    const title = titleDraft.trim() || 'Mapa sem título'
    setEditingTitle(false)
    setMap({ ...map, title })
    schedule(`map-${map.id}`, () => updateMap(map.id, { title }))
    const root = nodesRef.current.find((node) => !node.parent)
    if (root && root.text === map.title) {
      const next = nodesRef.current.map((node) =>
        node.id === root.id ? { ...node, text: title } : node,
      )
      setNodesSynced(next)
      schedule(`node-${root.id}`, () => updateNode(root.id, { text: title }, root.map))
    }
  }

  async function toggleFavorite() {
    if (!map) return
    const favorite = !map.favorite
    setMap({ ...map, favorite })
    try {
      const updated = await updateMap(map.id, { favorite })
      setMap(updated)
    } catch (error) {
      setMap(map)
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar o favorito',
        description: getErrorMessage(error),
      })
    }
  }

  function handleNodePointerDown(event: ReactPointerEvent<HTMLDivElement>, node: MindNode) {
    if (event.button !== 0) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      type: 'node',
      nodeId: node.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: node.x,
      startY: node.y,
      moved: false,
      snapshot: nodesRef.current.map((item) => ({ ...item })),
    }
    setSelectedId(node.id)
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.button !== 1) return
    if (event.target !== event.currentTarget) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      type: 'pan',
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: pan.x,
      startY: pan.y,
      moved: false,
      snapshot: [],
    }
    setSelectedId(null)
  }

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag) return
      const dx = event.clientX - drag.startClientX
      const dy = event.clientY - drag.startClientY
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
      if (drag.type === 'pan') setPan({ x: drag.startX + dx, y: drag.startY + dy })
      else if (drag.nodeId) {
        setNodesSynced((current) =>
          current.map((node) =>
            node.id === drag.nodeId
              ? {
                  ...node,
                  x: clamp(drag.startX + dx / zoom, 120, CANVAS_WIDTH - 120),
                  y: clamp(drag.startY + dy / zoom, 70, CANVAS_HEIGHT - 70),
                }
              : node,
          ),
        )
      }
    }
    function onPointerUp() {
      const drag = dragRef.current
      if (drag?.type === 'node' && drag.nodeId && drag.moved) {
        const moved = nodesRef.current.find((node) => node.id === drag.nodeId)
        if (moved) {
          history.checkpoint(drag.snapshot)
          schedule(`node-${moved.id}`, () =>
            updateNode(moved.id, { x: moved.x, y: moved.y }, moved.map),
          )
        }
      }
      dragRef.current = null
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [history, schedule, setNodesSynced, zoom])

  // Enter coloca o nó selecionado em edição direto no balão
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return
      if (event.key !== 'Enter' || !selectedId) return
      const node = nodesRef.current.find((item) => item.id === selectedId)
      if (!node) return
      event.preventDefault()
      setEditingId(node.id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      const element = canvasRef.current
      if (!element) return
      const rect = element.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top
      const nextZoom = clamp(zoom * (event.deltaY > 0 ? 0.9 : 1.1), 0.28, 1.8)
      const canvasX = (pointerX - pan.x) / zoom
      const canvasY = (pointerY - pan.y) / zoom
      setPan({ x: pointerX - canvasX * nextZoom, y: pointerY - canvasY * nextZoom })
      setZoom(nextZoom)
    } else {
      setPan((current) => ({ x: current.x - event.deltaX, y: current.y - event.deltaY }))
    }
  }

  async function confirmDeleteMap() {
    if (!map) return
    await flush()
    try {
      await deleteMap(map.id)
      navigate('/')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir o mapa',
        description: getErrorMessage(error),
      })
    }
  }

  if (loading || !map)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f8fc]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6250ca]" />
      </div>
    )

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
          aria-label="Voltar para meus mapas"
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
                  setTitleDraft(map.title)
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
              <span className="truncate font-semibold">{map.title}</span>
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
          aria-label={map.favorite ? 'Remover dos favoritos' : 'Favoritar mapa'}
        >
          <Star
            className={`h-5 w-5 ${map.favorite ? 'fill-[#f7b83b] text-[#f7b83b]' : 'text-[#77788d]'}`}
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
              onSelect={() => setDeleteMapOpen(true)}
              className="rounded-lg text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir mapa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="relative min-h-0 flex-1">
        <EditorCanvas
          nodes={nodes}
          selectedId={selectedId}
          zoom={zoom}
          pan={pan}
          canvasRef={canvasRef}
          onCanvasPointerDown={handleCanvasPointerDown}
          onNodePointerDown={handleNodePointerDown}
          onNodeClick={(node) => setSelectedId(node.id)}
          onNodeDoubleClick={startEditing}
          editingId={editingId}
          onCommitNodeText={commitNodeText}
          onCancelNodeEdit={cancelNodeEdit}
          onAddChild={(node) => void addChild(node)}
          onWheel={handleWheel}
        />
        <EditorToolbar
          selected={selected}
          canDelete={Boolean(selected?.parent)}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onAdd={() => void addChild()}
          onDuplicate={() => void duplicateSelected()}
          onDelete={() => setDeleteBranchOpen(true)}
          onColor={(color) => changeSelected({ color })}
          onShape={(shape: NodeShape) => changeSelected({ shape })}
          onUndo={() => applyHistory(history.undo())}
          onRedo={() => applyHistory(history.redo())}
        />
        <ZoomControls
          zoom={zoom}
          onZoomIn={() => setZoom((value) => clamp(value + 0.1, 0.28, 1.8))}
          onZoomOut={() => setZoom((value) => clamp(value - 0.1, 0.28, 1.8))}
          onFit={() => fitToScreen()}
        />
        <div className="pointer-events-none absolute bottom-6 left-5 z-20 hidden rounded-xl bg-white/80 px-3 py-2 text-xs text-[#8c8d9e] shadow-sm backdrop-blur sm:block">
          Arraste o fundo para navegar · Duplo clique para editar
        </div>
      </main>

      <Dialog open={deleteBranchOpen} onOpenChange={setDeleteBranchOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir este ramo?</DialogTitle>
            <DialogDescription>
              “{selected?.text}” e todos os subtópicos conectados a ele serão removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBranchOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDeleteBranch()}
              className="rounded-xl"
            >
              Excluir ramo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteMapOpen} onOpenChange={setDeleteMapOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir este mapa?</DialogTitle>
            <DialogDescription>
              Todos os tópicos de “{map.title}” serão apagados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteMapOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDeleteMap()}
              className="rounded-xl"
            >
              Excluir mapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
