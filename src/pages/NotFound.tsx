import { ArrowLeft, Home, Map } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7fb] p-6 text-center text-[#24243e]">
      <section className="max-w-md">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#ebe7ff] text-[#6250ca] shadow-sm">
          <Map className="h-9 w-9" />
        </span>
        <p className="mt-8 text-sm font-bold tracking-[0.22em] text-[#6c55dd]">ERRO 404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Esta ideia saiu do mapa</h1>
        <p className="mt-4 leading-7 text-[#818294]">
          A página que você procura não existe ou mudou de endereço.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button asChild className="rounded-xl bg-[#6250ca] hover:bg-[#5544b8]">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Meus mapas
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
