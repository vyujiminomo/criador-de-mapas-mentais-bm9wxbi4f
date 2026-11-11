import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, Network } from 'lucide-react'
import type { MindNode } from '@/types/mindmap'

interface AiNodeCreatorDialogProps {
  open: boolean
  selectedNode: MindNode | null
  isGenerating: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (prompt: string, attachToId: string | null) => Promise<void>
}

export function AiNodeCreatorDialog({
  open,
  selectedNode,
  isGenerating,
  onOpenChange,
  onSubmit,
}: AiNodeCreatorDialogProps) {
  const [text, setText] = useState('')
  const [connectToSelected, setConnectToSelected] = useState(true)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!text.trim() || isGenerating) return
    const targetParent = connectToSelected && selectedNode ? selectedNode.id : null
    await onSubmit(text.trim(), targetParent)
    setText('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#6250ca]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eeebff]">
              <Sparkles className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Criar Nó com IA</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-500">
            Escreva o conteúdo, uma ideia ou um resumo. O assistente de IA estruturará e criará os
            balões como nós reais no mapa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Definir objetivos do Q3: aumentar receita em 15%, contratar 2 devs sênior e lançar a versão mobile do aplicativo."
            rows={4}
            className="rounded-xl border-[#dcdde7] text-sm focus-visible:ring-[#6250ca]"
            autoFocus
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void handleSubmit()
              }
            }}
          />

          {selectedNode && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                id="connectNode"
                checked={connectToSelected}
                onChange={(e) => setConnectToSelected(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#6250ca] focus:ring-[#6250ca]"
              />
              <label htmlFor="connectNode" className="flex items-center gap-1 cursor-pointer">
                <Network className="h-3.5 w-3.5 text-[#6250ca]" />
                Conectar ao nó selecionado:{' '}
                <strong className="text-gray-800">“{selectedNode.text}”</strong>
              </label>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!text.trim() || isGenerating}
              className="rounded-xl bg-gradient-to-r from-[#6250ca] to-[#8b5cf6] font-semibold text-white shadow hover:from-[#5341b5] hover:to-[#7c3aed]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando nós...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Criar no Mapa
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
