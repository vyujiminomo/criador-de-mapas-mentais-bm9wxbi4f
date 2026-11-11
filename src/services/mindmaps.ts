import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { MindMap, MindNode, NodeShape } from '@/types/mindmap'

const MAPS = 'mind_maps'
const NODES = 'mind_nodes'

async function touchMap(mapId: string) {
  await pb.collection(MAPS).update(mapId, {}, { requestKey: null })
}

function requireUserId() {
  const id = pb.authStore.record?.id
  if (!id) throw new Error('Você precisa entrar para continuar.')
  return id
}

function toMap(record: RecordModel): MindMap {
  return {
    id: record.id,
    owner: String(record.owner),
    title: String(record.title),
    primaryColor: String(record.primary_color),
    favorite: Boolean(record.favorite),
    created: String(record.created),
    updated: String(record.updated),
  }
}

function toNode(record: RecordModel): MindNode {
  return {
    id: record.id,
    map: String(record.map),
    parent: record.parent ? String(record.parent) : null,
    text: String(record.text),
    x: Number(record.x),
    y: Number(record.y),
    color: String(record.color),
    shape: String(record.shape) as NodeShape,
    sortOrder: Number(record.sort_order),
  }
}

export async function listMaps() {
  const records = await pb.collection(MAPS).getFullList({
    sort: '-updated',
    requestKey: null,
  })
  return records.map(toMap)
}

export async function getMap(id: string) {
  return toMap(await pb.collection(MAPS).getOne(id, { requestKey: null }))
}

async function createBareMap(title: string, primaryColor: string) {
  return toMap(
    await pb.collection(MAPS).create(
      {
        owner: requireUserId(),
        title: title.trim() || 'Mapa sem título',
        primary_color: primaryColor,
        favorite: false,
      },
      { requestKey: null },
    ),
  )
}

export async function createMap(title = 'Meu novo mapa', primaryColor = '#5B5BD6') {
  const map = await createBareMap(title, primaryColor)
  try {
    await createNode({
      mapId: map.id,
      parent: null,
      text: title,
      x: 1100,
      y: 700,
      color: primaryColor,
      shape: 'rounded',
      sortOrder: 0,
    })
    return map
  } catch (error) {
    await pb.collection(MAPS).delete(map.id, { requestKey: null })
    throw error
  }
}

export async function updateMap(
  id: string,
  changes: Partial<Pick<MindMap, 'title' | 'primaryColor' | 'favorite'>>,
) {
  const payload: Record<string, unknown> = {}
  if (changes.title !== undefined) payload.title = changes.title.trim() || 'Mapa sem título'
  if (changes.primaryColor !== undefined) payload.primary_color = changes.primaryColor
  if (changes.favorite !== undefined) payload.favorite = changes.favorite
  return toMap(await pb.collection(MAPS).update(id, payload, { requestKey: null }))
}

export async function deleteMap(id: string) {
  await pb.collection(MAPS).delete(id, { requestKey: null })
}

export async function listNodes(mapId: string) {
  const records = await pb.collection(NODES).getFullList({
    filter: `map = "${mapId}"`,
    sort: 'sort_order',
    requestKey: null,
  })
  return records.map(toNode)
}

interface CreateNodeInput {
  mapId: string
  parent: string | null
  text: string
  x: number
  y: number
  color: string
  shape: NodeShape
  sortOrder: number
}

export async function createNode(input: CreateNodeInput) {
  const created = toNode(
    await pb.collection(NODES).create(
      {
        owner: requireUserId(),
        map: input.mapId,
        parent: input.parent ?? '',
        text: input.text,
        x: input.x,
        y: input.y,
        color: input.color,
        shape: input.shape,
        sort_order: input.sortOrder,
      },
      { requestKey: null },
    ),
  )
  await touchMap(input.mapId).catch(() => undefined)
  return created
}
export async function updateNode(
  id: string,
  changes: Partial<Pick<MindNode, 'text' | 'x' | 'y' | 'color' | 'shape' | 'parent' | 'sortOrder'>>,
  mapId?: string,
) {
  const payload: Record<string, unknown> = {}
  if (changes.text !== undefined) payload.text = changes.text.trim() || 'Novo tópico'
  if (changes.x !== undefined) payload.x = changes.x
  if (changes.y !== undefined) payload.y = changes.y
  if (changes.color !== undefined) payload.color = changes.color
  if (changes.shape !== undefined) payload.shape = changes.shape
  if (changes.parent !== undefined) payload.parent = changes.parent ?? ''
  if (changes.sortOrder !== undefined) payload.sort_order = changes.sortOrder
  const updated = toNode(await pb.collection(NODES).update(id, payload, { requestKey: null }))
  if (mapId) await touchMap(mapId).catch(() => undefined)
  return updated
}

export async function deleteNodeBranch(nodeId: string, nodes: MindNode[]) {
  const ids = new Set([nodeId])
  let changed = true
  while (changed) {
    changed = false
    for (const node of nodes) {
      if (node.parent && ids.has(node.parent) && !ids.has(node.id)) {
        ids.add(node.id)
        changed = true
      }
    }
  }
  await Promise.all([...ids].map((id) => pb.collection(NODES).delete(id, { requestKey: null })))
  const mapId = nodes.find((node) => node.id === nodeId)?.map
  if (mapId) await touchMap(mapId).catch(() => undefined)
  return ids
}

export async function duplicateMap(source: MindMap) {
  const originalNodes = await listNodes(source.id)
  const copy = await createBareMap(`${source.title} — cópia`, source.primaryColor)
  const idMap = new Map<string, string>()

  try {
    for (const node of originalNodes) {
      const created = await createNode({
        mapId: copy.id,
        parent: node.parent ? (idMap.get(node.parent) ?? null) : null,
        text: node.text,
        x: node.x,
        y: node.y,
        color: node.color,
        shape: node.shape,
        sortOrder: node.sortOrder,
      })
      idMap.set(node.id, created.id)
    }
    if (originalNodes.length === 0) {
      await createNode({
        mapId: copy.id,
        parent: null,
        text: copy.title,
        x: 1100,
        y: 700,
        color: copy.primaryColor,
        shape: 'rounded',
        sortOrder: 0,
      })
    }
    return copy
  } catch (error) {
    await deleteMap(copy.id)
    throw error
  }
}
