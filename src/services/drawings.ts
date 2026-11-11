import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Drawing, DrawingStroke } from '@/types/drawing'

const DRAWINGS = 'drawings'

function requireUserId() {
  const id = pb.authStore.record?.id
  if (!id) throw new Error('Você precisa entrar para continuar.')
  return id
}

function toStrokes(value: unknown): DrawingStroke[] {
  let raw = value
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      raw = []
    }
  }
  return Array.isArray(raw) ? (raw as DrawingStroke[]) : []
}

function toDrawing(record: RecordModel): Drawing {
  return {
    id: record.id,
    owner: String(record.owner),
    title: String(record.title),
    favorite: Boolean(record.favorite),
    strokes: toStrokes(record.strokes),
    created: String(record.created),
    updated: String(record.updated),
  }
}

export async function listDrawings() {
  const records = await pb.collection(DRAWINGS).getFullList({
    sort: '-updated',
    requestKey: null,
  })
  return records.map(toDrawing)
}

export async function getDrawing(id: string) {
  return toDrawing(await pb.collection(DRAWINGS).getOne(id, { requestKey: null }))
}

export async function createDrawing(title = 'Meu desenho') {
  return toDrawing(
    await pb.collection(DRAWINGS).create(
      {
        owner: requireUserId(),
        title: title.trim() || 'Desenho sem título',
        favorite: false,
        strokes: [],
      },
      { requestKey: null },
    ),
  )
}

export async function updateDrawing(
  id: string,
  changes: Partial<Pick<Drawing, 'title' | 'favorite' | 'strokes'>>,
) {
  const payload: Record<string, unknown> = {}
  if (changes.title !== undefined) payload.title = changes.title.trim() || 'Desenho sem título'
  if (changes.favorite !== undefined) payload.favorite = changes.favorite
  if (changes.strokes !== undefined) payload.strokes = changes.strokes
  return toDrawing(await pb.collection(DRAWINGS).update(id, payload, { requestKey: null }))
}

export async function deleteDrawing(id: string) {
  await pb.collection(DRAWINGS).delete(id, { requestKey: null })
}

export async function duplicateDrawing(source: Drawing) {
  return toDrawing(
    await pb.collection(DRAWINGS).create(
      {
        owner: requireUserId(),
        title: `${source.title} — cópia`,
        favorite: false,
        strokes: source.strokes,
      },
      { requestKey: null },
    ),
  )
}
