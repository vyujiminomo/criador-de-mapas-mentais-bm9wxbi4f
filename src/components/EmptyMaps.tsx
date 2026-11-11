import { Plus, SearchX, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyMapsProps {
  searching: boolean
  onCreate: () => void
  onClearSearch: () => void
}

export function EmptyMaps({ searching, onCreate, onClearSearch }: EmptyMapsProps) {
  return (
    <div className="col-span-full flex min-h-[390px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#d8d9e5] bg-white/60 px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#ece9ff] text-[#6753d1]">
        {searching ? <SearchX className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
      </span>
      <h3 className="mt-5 text-xl font-semibold text-[#27273e]">
        {searching ? 'Nenhum mapa encontrado' : 'Sua próxima grande ideia começa aqui'}
      </h3>
      <p className="mt-2 max-w-md text-[#858697]">
        {searching
          ? 'Tente buscar por outro título ou limpe o filtro.'
          : 'Crie um mapa mental e organize seus pensamentos de um jeito simples e visual.'}
      </p>
      <Button
        onClick={searching ? onClearSearch : onCreate}
        className="mt-6 rounded-xl bg-[#6250ca] hover:bg-[#5544b8]"
      >
        {searching ? (
          'Limpar busca'
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeiro mapa
          </>
        )}
      </Button>
    </div>
  )
}
