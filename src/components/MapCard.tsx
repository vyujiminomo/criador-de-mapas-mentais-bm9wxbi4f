import { useEffect, useState } from 'react'
import { Copy, MoreHorizontal, Network, Pencil, Star, Trash2 } from 'lucide-react'
import { MapThumbnail } from '@/components/MapThumbnail'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { listNodes } from '@/services/mindmaps'
import type { MindMap, MindNode } from '@/types/mindmap'

interface MapCardProps {
  map: MindMap
  onOpen: () => void
  onRename: () => void
  onDuplicate: () => void
  onFavorite: () => void
  onDelete: () => void
}

function formatUpdated(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays <= 0)
    return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function MapCard({
  map,
  onOpen,
  onRename,
  onDuplicate,
  onFavorite,
  onDelete,
}: MapCardProps) {
  const [nodes, setNodes] = useState<MindNode[]>([])

  useEffect(() => {
    let active = true
    listNodes(map.id)
      .then((items) => {
        if (active) setNodes(items)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [map.id, map.updated])

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e5e6ef] bg-white shadow-[0_10px_30px_rgba(38,40,75,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(38,40,75,0.1)]">
      <div className="relative">
        <button
          type="button"
          className="block h-52 w-full cursor-pointer text-left"
          onClick={onOpen}
          aria-label={`Abrir ${map.title}`}
        >
          <MapThumbnail nodes={nodes} primaryColor={map.primaryColor} className="h-full w-full" />
        </button>
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-[#e2e3eb] bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#5c49c2] shadow-sm backdrop-blur">
          <Network className="h-3 w-3" />
          Mapa mental
        </span>
      </div>
      <div className="flex items-start gap-3 p-5">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <h3 className="truncate text-[17px] font-semibold text-[#24243e]">{map.title}</h3>
          <p className="mt-1 text-sm text-[#9293a3]">Editado {formatUpdated(map.updated)}</p>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-[#8a8b9c] opacity-60 transition group-hover:opacity-100"
              aria-label={`Menu de ${map.title}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
            <DropdownMenuItem onSelect={onRename} className="rounded-lg">
              <Pencil className="mr-2 h-4 w-4" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate} className="rounded-lg">
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onFavorite} className="rounded-lg">
              <Star
                className={`mr-2 h-4 w-4 ${map.favorite ? 'fill-[#f6b73c] text-[#f6b73c]' : ''}`}
              />
              {map.favorite ? 'Remover dos favoritos' : 'Favoritar'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="rounded-lg text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir mapa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}
