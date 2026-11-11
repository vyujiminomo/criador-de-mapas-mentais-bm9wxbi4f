export type StrokePoint = [number, number]

export interface DrawingStroke {
  id: string
  color: string
  width: number
  points: StrokePoint[]
}

export interface Drawing {
  id: string
  owner: string
  title: string
  favorite: boolean
  strokes: DrawingStroke[]
  created: string
  updated: string
}

export type DrawingTool = 'pen' | 'eraser' | 'pan'

export const DRAWING_COLORS = [
  { name: 'Roxo', value: '#7C3AED' },
  { name: 'Verde', value: '#16A34A' },
  { name: 'Preto', value: '#111827' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Azul', value: '#2563EB' },
  { name: 'Vermelho', value: '#DC2626' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Rosa', value: '#EC4899' },
] as const

export const STROKE_WIDTHS = [
  { label: 'Fina', value: 2 },
  { label: 'Média', value: 5 },
  { label: 'Grossa', value: 10 },
] as const
