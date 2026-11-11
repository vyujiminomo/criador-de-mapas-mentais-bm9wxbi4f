export type NodeShape = 'rounded' | 'pill' | 'rectangle'

export interface MindNode {
  id: string
  map: string
  parent: string | null
  text: string
  x: number
  y: number
  color: string
  shape: NodeShape
  sortOrder: number
}

export interface MindMap {
  id: string
  owner: string
  title: string
  primaryColor: string
  favorite: boolean
  created: string
  updated: string
}

export interface UserAccount {
  id: string
  name: string
  email: string
}

export const MAP_COLORS = [
  '#5B5BD6',
  '#0EA5E9',
  '#14B8A6',
  '#F59E0B',
  '#F05A8A',
  '#8B5CF6',
] as const
