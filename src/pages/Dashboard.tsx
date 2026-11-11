import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Loader2, LogOut, Plus, Search, Sparkles, Star, X } from 'lucide-react'
import { EmptyMaps } from '@/components/EmptyMaps'
import { MapCard } from '@/components/MapCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { createMap, deleteMap, duplicateMap, listMaps, updateMap } from '@/services/mindmaps'
import type { MindMap } from '@/types/mindmap'
import { getErrorMessage } from '@/lib/get-error-message'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [maps, setMaps] = useState<MindMap[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all')
  const [renameMap, setRenameMap] = useState<MindMap | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MindMap | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadMaps = useCallback(async () => {
    setLoading(true)
    try {
      setMaps(await listMaps())
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar seus mapas',
        description: getErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadMaps()
  }, [loadMaps])

  const filteredMaps = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    return maps.filter((map) => {
      const matchesSearch = !normalized || map.title.toLocaleLowerCase('pt-BR').includes(normalized)
      const matchesFilter = activeFilter === 'all' || map.favorite
      return matchesSearch && matchesFilter
    })
  }, [activeFilter, maps, query])

  async function handleCreate() {
    setCreating(true)
    try {
      const map = await createMap()
      navigate(`/mapas/${map.id}`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível criar o mapa',
        description: getErrorMessage(error),
      })
    } finally {
      setCreating(false)
    }
  }

  async function handleFavorite(map: MindMap) {
    setMaps((current) =>
      current.map((item) => (item.id === map.id ? { ...item, favorite: !item.favorite } : item)),
    )
    try {
      const updated = await updateMap(map.id, { favorite: !map.favorite })
      setMaps((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      setMaps((current) => current.map((item) => (item.id === map.id ? map : item)))
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar o favorito',
        description: getErrorMessage(error),
      })
    }
  }

  async function handleDuplicate(map: MindMap) {
    try {
      const copy = await duplicateMap(map)
      setMaps((current) => [copy, ...current])
      toast({ title: 'Mapa duplicado', description: `“${copy.title}” está pronto para editar.` })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível duplicar',
        description: getErrorMessage(error),
      })
    }
  }

  async function submitRename() {
    if (!renameMap) return
    setActionLoading(true)
    try {
      const updated = await updateMap(renameMap.id, { title: renameTitle })
      setMaps((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setRenameMap(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível renomear',
        description: getErrorMessage(error),
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await deleteMap(deleteTarget.id)
      setMaps((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast({ title: 'Mapa excluído' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: getErrorMessage(error),
      })
    } finally {
      setActionLoading(false)
    }
  }

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'por aqui'

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#24243e]">
      <header className="sticky top-0 z-30 border-b border-[#e8e8f0]/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center gap-4 px-5 sm:px-8 lg:px-12">
          <button
            onClick={() => {
              setActiveFilter('all')
              setQuery('')
            }}
            className="flex shrink-0 items-center gap-3"
            aria-label="Ir para todos os mapas"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#6250ca] text-white shadow-lg shadow-[#6250ca]/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight sm:block">Mente Clara</span>
          </button>
          <div className="relative mx-auto w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999aac]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar mapas..."
              className="h-11 rounded-xl border-transparent bg-[#f3f3f8] pl-11 pr-10 focus-visible:border-[#7262d3] focus-visible:ring-2 focus-visible:ring-[#7262d3]/15"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999aac]"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-11 shrink-0 gap-2 rounded-xl px-2 sm:px-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ded8ff] text-sm font-bold text-[#5946bc]">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-[#8b8c9d] sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <div className="px-2 py-2">
                <p className="truncate text-sm font-semibold">{user?.name || 'Minha conta'}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={signOut}
                className="rounded-lg text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-[#6b58d0]">SEU ESPAÇO DE IDEIAS</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Olá, {firstName} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-[#858697]">
              Capture, conecte e transforme suas ideias em planos.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="h-12 rounded-xl bg-[#6250ca] px-5 text-base font-semibold shadow-lg shadow-[#6250ca]/20 hover:bg-[#5544b8]"
          >
            {creating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            Novo mapa
          </Button>
        </div>

        <div className="mt-11 flex items-center justify-between border-b border-[#e4e5ed]">
          <div className="flex gap-7">
            <button
              onClick={() => setActiveFilter('all')}
              className={`relative pb-4 text-sm font-semibold transition ${activeFilter === 'all' ? 'text-[#5c49c2]' : 'text-[#898a9c] hover:text-[#4d4d60]'}`}
            >
              Todos os mapas
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#6250ca] transition ${activeFilter === 'all' ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
            <button
              onClick={() => setActiveFilter('favorites')}
              className={`relative flex items-center gap-2 pb-4 text-sm font-semibold transition ${activeFilter === 'favorites' ? 'text-[#5c49c2]' : 'text-[#898a9c] hover:text-[#4d4d60]'}`}
            >
              <Star className={`h-4 w-4 ${activeFilter === 'favorites' ? 'fill-current' : ''}`} />
              Favoritos
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#6250ca] transition ${activeFilter === 'favorites' ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
          </div>
          <span className="pb-4 text-sm text-[#aaaabb]">
            {filteredMaps.length} {filteredMaps.length === 1 ? 'mapa' : 'mapas'}
          </span>
        </div>

        {loading ? (
          <div className="grid min-h-[420px] place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#6250ca]" />
          </div>
        ) : (
          <section className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredMaps.map((map) => (
              <MapCard
                key={map.id}
                map={map}
                onOpen={() => navigate(`/mapas/${map.id}`)}
                onRename={() => {
                  setRenameMap(map)
                  setRenameTitle(map.title)
                }}
                onDuplicate={() => void handleDuplicate(map)}
                onFavorite={() => void handleFavorite(map)}
                onDelete={() => setDeleteTarget(map)}
              />
            ))}
            {!filteredMaps.length && (
              <EmptyMaps
                searching={Boolean(query) || activeFilter === 'favorites'}
                onCreate={handleCreate}
                onClearSearch={() => {
                  setQuery('')
                  setActiveFilter('all')
                }}
              />
            )}
          </section>
        )}
      </main>

      <Dialog open={Boolean(renameMap)} onOpenChange={(open) => !open && setRenameMap(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear mapa</DialogTitle>
            <DialogDescription>
              Escolha um nome claro para encontrar seu mapa rapidamente.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            maxLength={120}
            value={renameTitle}
            onChange={(event) => setRenameTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void submitRename()}
            className="h-11 rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameMap(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={submitRename}
              disabled={actionLoading || !renameTitle.trim()}
              className="rounded-xl bg-[#6250ca] hover:bg-[#5544b8]"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir “{deleteTarget?.title}”?</DialogTitle>
            <DialogDescription>
              O mapa e todos os seus tópicos serão removidos. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={actionLoading}
              variant="destructive"
              className="rounded-xl"
            >
              Excluir mapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
