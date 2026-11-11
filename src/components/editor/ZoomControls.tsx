import { Focus, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-5 right-4 z-30 flex items-center rounded-xl border border-[#e2e3eb] bg-white/95 p-1 shadow-lg backdrop-blur sm:bottom-6 sm:right-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        className="h-9 w-9 rounded-lg"
        title="Diminuir zoom"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-14 text-center text-xs font-semibold text-[#696a7c]">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        className="h-9 w-9 rounded-lg"
        title="Aumentar zoom"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onFit}
        className="ml-1 h-9 w-9 rounded-lg border-l border-[#ededf3]"
        title="Ajustar à tela"
      >
        <Focus className="h-4 w-4" />
      </Button>
    </div>
  )
}
