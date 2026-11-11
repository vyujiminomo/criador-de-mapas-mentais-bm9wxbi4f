import { useCallback, useRef, useState } from 'react'
import type { MindNode } from '@/types/mindmap'

export function useEditorHistory(initial: MindNode[] = []) {
  const undoRef = useRef<MindNode[][]>([])
  const redoRef = useRef<MindNode[][]>([])
  const [revision, setRevision] = useState(0)
  const currentRef = useRef<MindNode[]>(initial)

  const syncCurrent = useCallback((nodes: MindNode[]) => {
    currentRef.current = nodes
  }, [])

  const checkpoint = useCallback((nodes: MindNode[]) => {
    undoRef.current.push(nodes.map((node) => ({ ...node })))
    if (undoRef.current.length > 30) undoRef.current.shift()
    redoRef.current = []
    setRevision((value) => value + 1)
  }, [])

  const reset = useCallback((nodes: MindNode[]) => {
    undoRef.current = []
    redoRef.current = []
    currentRef.current = nodes
    setRevision((value) => value + 1)
  }, [])

  const undo = useCallback(() => {
    const previous = undoRef.current.pop()
    if (!previous) return null
    redoRef.current.push(currentRef.current.map((node) => ({ ...node })))
    currentRef.current = previous
    setRevision((value) => value + 1)
    return previous.map((node) => ({ ...node }))
  }, [])

  const redo = useCallback(() => {
    const next = redoRef.current.pop()
    if (!next) return null
    undoRef.current.push(currentRef.current.map((node) => ({ ...node })))
    currentRef.current = next
    setRevision((value) => value + 1)
    return next.map((node) => ({ ...node }))
  }, [])

  return {
    checkpoint,
    reset,
    syncCurrent,
    undo,
    redo,
    canUndo: undoRef.current.length > 0,
    canRedo: redoRef.current.length > 0,
    revision,
  }
}
