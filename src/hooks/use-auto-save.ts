import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'saved' | 'saving' | 'error'

export function useAutoSave() {
  const pendingRef = useRef(new Map<string, () => Promise<unknown>>())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushingRef = useRef(false)
  const [status, setStatus] = useState<SaveStatus>('saved')

  const flush = useCallback(async () => {
    if (flushingRef.current || pendingRef.current.size === 0) return
    flushingRef.current = true
    setStatus('saving')
    const jobs = [...pendingRef.current.values()]
    pendingRef.current.clear()
    try {
      await Promise.all(jobs.map((job) => job()))
      setStatus('saved')
    } catch {
      setStatus('error')
    } finally {
      flushingRef.current = false
      if (pendingRef.current.size > 0) void flush()
    }
  }, [])

  const schedule = useCallback(
    (key: string, job: () => Promise<unknown>, delay = 650) => {
      pendingRef.current.set(key, job)
      setStatus('saving')
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => void flush(), delay)
    },
    [flush],
  )

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      void flush()
    },
    [flush],
  )

  return { status, schedule, flush }
}
