import { Loader2, Network, PenLine, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NewItemMenuProps {
  creating: 'map' | 'drawing' | null
  onCreateMap: () => void
  onCreateDrawing: () => void
}

export function NewItemMenu({ creating, onCreateMap, onCreateDrawing }: NewItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={creating !== null}
          className="h-12 rounded-xl bg-[#6250ca] px-5 text-base font-semibold shadow-lg shadow-[#6250ca]/20 hover:bg-[#5544b8]"
        >
          {creating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Plus className="mr-2 h-5 w-5" />
          )}
          Criar novo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl p-1.5">
        <DropdownMenuItem onSelect={onCreateMap} className="items-start gap-3 rounded-lg py-2.5">
          <Network className="mt-0.5 h-5 w-5 shrink-0 text-[#6250ca]" />
          <span className="flex flex-col">
            <span className="font-semibold">Mapa mental</span>
            <span className="text-xs text-[#9293a3]">Organize ideias em tópicos conectados</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onCreateDrawing}
          className="items-start gap-3 rounded-lg py-2.5"
        >
          <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-[#6250ca]" />
          <span className="flex flex-col">
            <span className="font-semibold">Desenho</span>
            <span className="text-xs text-[#9293a3]">Rabisque à mão livre com caneta e cores</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
