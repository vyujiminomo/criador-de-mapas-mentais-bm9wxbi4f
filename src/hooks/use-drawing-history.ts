import { useCallback, useState } from 'react'
import type { DrawingStroke } from '@/types/drawing'

const HISTORY_LIMIT = 100

interface HistoryState {
  current: DrawingStroke[]
  past: DrawingStroke[][]
  future: DrawingStroke[][]
}

/** Histórico de traços para desfazer/refazer. `commit(base)` registra o estado anterior a um gesto. */
export function useDrawingHistory() {
  const [state, setState] = useState<HistoryState>({ current: [], past: [], future: [] })

  const set = useCallback((value: (current: DrawingStroke[]) => DrawingStroke[]) => {
    setState((s) => ({ ...s, current: value(s.current) }))
  }, [])

  const commit = useCallback((base: DrawingStroke[]) => {
    setState((s) => ({
      current: s.current,
      past: [...s.past, base].slice(-HISTORY_LIMIT),
      future: [],
    }))
  }, [])

  /** Cancela o último gesto registrado: volta ao estado anterior a ele, sem entrar no refazer. */
  const discard = useCallback(() => {
    setState((s) => {
      const previous = s.past[s.past.length - 1]
      if (!previous) return s
      return { current: previous, past: s.past.slice(0, -1), future: [] }
    })
  }, [])

  const undo = useCallback(() => {
    setState((s) => {
      const previous = s.past[s.past.length - 1]
      if (!previous) return s
      return { current: previous, past: s.past.slice(0, -1), future: [s.current, ...s.future] }
    })
  }, [])

  const redo = useCallback(() => {
    setState((s) => {
      const next = s.future[0]
      if (!next) return s
      return { current: next, past: [...s.past, s.current], future: s.future.slice(1) }
    })
  }, [])

  const reset = useCallback((strokes: DrawingStroke[]) => {
    setState({ current: strokes, past: [], future: [] })
  }, [])

  return {
    strokes: state.current,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    set,
    commit,
    discard,
    undo,
    redo,
    reset,
  }
}
