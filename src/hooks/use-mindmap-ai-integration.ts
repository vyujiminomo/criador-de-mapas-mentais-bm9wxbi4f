import { useCallback, useState } from 'react'
import type { DrawingStroke, DrawingTool, StrokePoint } from '@/types/drawing'
import type { MindMap, MindNode } from '@/types/mindmap'
import { createNode } from '@/services/mindmaps'
import {
  askMindmapAgent,
  extractJsonFromAiResponse,
  type ParsedAiNode,
} from '@/services/mindmap-ai'
import { describeDrawingStructure } from '@/lib/drawing-analysis'
import { strokeHit } from '@/lib/drawing-geometry'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/components/editor/EditorCanvas'

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

interface UseMindmapAiIntegrationOptions {
  map: MindMap | null
  nodes: MindNode[]
  selectedId: string | null
  nodesRef: React.MutableRefObject<MindNode[]>
  setNodesSynced: (value: MindNode[] | ((current: MindNode[]) => MindNode[])) => void
  setSelectedId: (id: string | null) => void
  checkpointHistory: (nodes: MindNode[]) => void
  showToast: (opts: {
    title: string
    description?: string
    variant?: 'default' | 'destructive'
  }) => void
}

export function useMindmapAiIntegration({
  map,
  nodes,
  selectedId,
  nodesRef,
  setNodesSynced,
  setSelectedId,
  checkpointHistory,
  showToast,
}: UseMindmapAiIntegrationOptions) {
  // Estado do modo desenho
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('pen')
  const [drawingColor, setDrawingColor] = useState('#5B5BD6')
  const [drawingWidth, setDrawingWidth] = useState(4)
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([])
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([])

  // Estado das ações de IA
  const [isConvertingDrawing, setIsConvertingDrawing] = useState(false)
  const [isGeneratingTextNode, setIsGeneratingTextNode] = useState(false)
  const [aiNodeDialogOpen, setAiNodeDialogOpen] = useState(false)

  // Gestão de histórico do desenho
  const pushDrawingHistory = useCallback((currentStrokes: DrawingStroke[]) => {
    setUndoStack((prev) => [...prev.slice(-30), currentStrokes])
    setRedoStack([])
  }, [])

  const handleStrokeAdd = useCallback(
    (stroke: DrawingStroke) => {
      setStrokes((prev) => {
        pushDrawingHistory(prev)
        return [...prev, stroke]
      })
    },
    [pushDrawingHistory],
  )

  const handleEraseAt = useCallback(
    (point: StrokePoint, radius: number) => {
      setStrokes((prev) => {
        const next = prev.filter((s) => !strokeHit(s, point, radius))
        if (next.length !== prev.length) {
          pushDrawingHistory(prev)
          return next
        }
        return prev
      })
    },
    [pushDrawingHistory],
  )

  const handleUndoDrawing = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      const previous = prev[prev.length - 1]
      setRedoStack((r) => [...r, strokes])
      setStrokes(previous)
      return prev.slice(0, -1)
    })
  }, [strokes])

  const handleRedoDrawing = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev
      const next = prev[prev.length - 1]
      setUndoStack((u) => [...u, strokes])
      setStrokes(next)
      return prev.slice(0, -1)
    })
  }, [strokes])

  const handleClearDrawing = useCallback(() => {
    if (strokes.length === 0) return
    pushDrawingHistory(strokes)
    setStrokes([])
  }, [pushDrawingHistory, strokes])

  // Helper para salvar nós no banco PocketBase e atualizar o estado
  const persistParsedNodes = useCallback(
    async (
      parsedNodes: ParsedAiNode[],
      defaultParentId: string | null,
      fallbackCenter: { x: number; y: number },
    ): Promise<MindNode[]> => {
      if (!map || parsedNodes.length === 0) return []

      checkpointHistory(nodesRef.current)
      const currentMapNodes = nodesRef.current
      const rootNode = currentMapNodes.find((n) => !n.parent) || currentMapNodes[0]
      const createdNodes: MindNode[] = []
      const tempIdToRealId = new Map<string, string>()

      // 1ª passada: identificar hierarquia
      for (let i = 0; i < parsedNodes.length; i++) {
        const pNode = parsedNodes[i]
        let parentId: string | null = null

        if (pNode.parentId && currentMapNodes.some((n) => n.id === pNode.parentId)) {
          parentId = pNode.parentId
        } else if (pNode.parentTempId && tempIdToRealId.has(pNode.parentTempId)) {
          parentId = tempIdToRealId.get(pNode.parentTempId)!
        } else if (defaultParentId) {
          parentId = defaultParentId
        } else if (i === 0) {
          parentId = rootNode?.id ?? null
        } else {
          parentId = createdNodes[0]?.id ?? rootNode?.id ?? null
        }

        const parentNode =
          currentMapNodes.find((n) => n.id === parentId) ||
          createdNodes.find((n) => n.id === parentId)
        const siblingCount =
          currentMapNodes.filter((n) => n.parent === parentId).length +
          createdNodes.filter((n) => n.parent === parentId).length

        let targetX = pNode.x
        let targetY = pNode.y

        if (targetX === undefined || targetY === undefined) {
          if (parentNode) {
            const side = parentNode.x >= 1100 ? 1 : -1
            targetX = parentNode.x + side * 300
            targetY = parentNode.y + (siblingCount - 1) * 110
          } else {
            targetX = fallbackCenter.x + (i % 2 === 0 ? 250 : -250)
            targetY = fallbackCenter.y + i * 90
          }
        }

        targetX = clamp(targetX, 140, CANVAS_WIDTH - 140)
        targetY = clamp(targetY, 90, CANVAS_HEIGHT - 90)

        const created = await createNode({
          mapId: map.id,
          parent: parentId,
          text: pNode.text.slice(0, 120),
          x: targetX,
          y: targetY,
          color: pNode.color || parentNode?.color || '#5B5BD6',
          shape: pNode.shape || 'rounded',
          sortOrder: currentMapNodes.length + createdNodes.length,
        })

        if (pNode.tempId) {
          tempIdToRealId.set(pNode.tempId, created.id)
        }
        createdNodes.push(created)
      }

      setNodesSynced((prev) => [...prev, ...createdNodes])
      if (createdNodes.length > 0) {
        setSelectedId(createdNodes[createdNodes.length - 1].id)
      }
      return createdNodes
    },
    [checkpointHistory, map, nodesRef, setNodesSynced, setSelectedId],
  )

  // 1. Converter desenho em nós
  const convertDrawingToNodes = useCallback(
    async (hint?: string) => {
      if (strokes.length === 0 || !map) return
      setIsConvertingDrawing(true)

      try {
        const structureDescription = describeDrawingStructure(strokes)
        const rootNode = nodesRef.current.find((n) => !n.parent) || nodesRef.current[0]
        const selectedNode = nodesRef.current.find((n) => n.id === selectedId)

        const prompt = `Converta este desenho/rascunho de mapa mental feito pelo usuário em nós do mapa mental.
Título do mapa atual: "${map.title}".
Nó raiz existente: "${rootNode ? rootNode.text : 'Ideia Central'}" (id: ${rootNode?.id ?? 'nenhum'}).
${selectedNode ? `Nó selecionado atualmente: "${selectedNode.text}" (id: ${selectedNode.id}).` : ''}

${hint ? `Observação / Dica do usuário sobre o que desenhou: "${hint}"` : ''}

${structureDescription}

Instruções:
- Crie um nó para cada elemento/palavra ou agrupamento desenhado.
- Conecte nós filhos ao nó pai de acordo com as posições relativas ou ao nó selecionado/raiz.
- Use as coordenadas estimadas (X e Y) próximas às do desenho.
- Retorne SEMPRE um JSON válido delimitado por \`\`\`json e \`\`\` com os nós a serem criados.`

        const response = await askMindmapAgent(prompt)
        const extraction = extractJsonFromAiResponse(response.content)

        if (extraction.nodes.length === 0) {
          // Se a IA não retornou nós estruturados, faz nó padrão com o hint ou texto
          const fallbackText = hint?.trim() || 'Ideia desenhada'
          const fallbackNode: ParsedAiNode = {
            text: fallbackText,
            parentId: selectedId || rootNode?.id || null,
          }
          await persistParsedNodes([fallbackNode], selectedId || rootNode?.id || null, {
            x: 1200,
            y: 800,
          })
        } else {
          // Usa o centro dos traços como fallback
          const allXs = strokes.flatMap((s) => s.points.map((p) => p[0]))
          const allYs = strokes.flatMap((s) => s.points.map((p) => p[1]))
          const avgX = allXs.length
            ? Math.round(allXs.reduce((a, b) => a + b, 0) / allXs.length)
            : 1200
          const avgY = allYs.length
            ? Math.round(allYs.reduce((a, b) => a + b, 0) / allYs.length)
            : 800

          await persistParsedNodes(extraction.nodes, selectedId || rootNode?.id || null, {
            x: avgX,
            y: avgY,
          })
        }

        // Limpa o rascunho de desenho e fecha o modo de desenho (viram nós reais)
        setStrokes([])
        setUndoStack([])
        setRedoStack([])
        setIsDrawingMode(false)

        showToast({
          title: 'Desenho convertido em nós!',
          description: 'A IA interpretou os traços e criou os balões correspondentes no mapa.',
        })
      } catch (err: unknown) {
        showToast({
          variant: 'destructive',
          title: 'Não foi possível converter o desenho',
          description: err instanceof Error ? err.message : 'Tente novamente.',
        })
      } finally {
        setIsConvertingDrawing(false)
      }
    },
    [map, nodesRef, persistParsedNodes, selectedId, showToast, strokes],
  )

  // 2. Criar nós a partir de texto digitado
  const createNodeFromText = useCallback(
    async (text: string, attachToId: string | null) => {
      if (!text.trim() || !map) return
      setIsGeneratingTextNode(true)

      try {
        const rootNode = nodesRef.current.find((n) => !n.parent) || nodesRef.current[0]
        const targetParent = nodesRef.current.find((n) => n.id === attachToId)

        const prompt = `O usuário escreveu o seguinte texto para ser adicionado como nó(s) no mapa mental "${map.title}":
"${text.trim()}"

${targetParent ? `O usuário pediu para conectar como filho de: "${targetParent.text}" (id: ${targetParent.id}).` : ''}

Instruções:
- Se o texto tiver uma ideia central com detalhes ou tópicos listados, quebre em nó pai + subnós.
- Se for uma ideia direta e única, crie um único nó com título conciso e claro.
- Retorne SEMPRE um bloco JSON válido delimitado por \`\`\`json e \`\`\` contendo { "summary": "...", "nodes": [...] }.
- Cada nó deve ter: "tempId", "parentTempId", "text", "shape", "color".`

        const response = await askMindmapAgent(prompt)
        const extraction = extractJsonFromAiResponse(response.content)

        let nodesToCreate = extraction.nodes
        if (nodesToCreate.length === 0) {
          nodesToCreate = [
            {
              tempId: 'n1',
              text: text.slice(0, 100),
              parentId: attachToId || rootNode?.id || null,
            },
          ]
        }

        const centerFallback = targetParent
          ? { x: targetParent.x, y: targetParent.y }
          : { x: 1200, y: 800 }

        await persistParsedNodes(nodesToCreate, attachToId || rootNode?.id || null, centerFallback)

        setAiNodeDialogOpen(false)
        showToast({
          title: 'Nó(s) criado(s) com sucesso!',
          description: 'A IA sintetizou seu texto e organizou os balões no mapa.',
        })
      } catch (err: unknown) {
        showToast({
          variant: 'destructive',
          title: 'Erro ao gerar nó com IA',
          description: err instanceof Error ? err.message : 'Tente novamente.',
        })
      } finally {
        setIsGeneratingTextNode(false)
      }
    },
    [map, nodesRef, persistParsedNodes, showToast],
  )

  return {
    isDrawingMode,
    setIsDrawingMode,
    drawingTool,
    setDrawingTool,
    drawingColor,
    setDrawingColor,
    drawingWidth,
    setDrawingWidth,
    strokes,
    canUndoDrawing: undoStack.length > 0,
    canRedoDrawing: redoStack.length > 0,
    handleStrokeAdd,
    handleEraseAt,
    handleUndoDrawing,
    handleRedoDrawing,
    handleClearDrawing,
    isConvertingDrawing,
    convertDrawingToNodes,
    isGeneratingTextNode,
    createNodeFromText,
    aiNodeDialogOpen,
    setAiNodeDialogOpen,
  }
}
