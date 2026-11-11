import type { Drawing } from '@/types/drawing'
import type { MindMap } from '@/types/mindmap'

export type GalleryKind = 'map' | 'drawing'

export type GalleryItem = { kind: 'map'; data: MindMap } | { kind: 'drawing'; data: Drawing }
