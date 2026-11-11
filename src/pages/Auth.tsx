import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/get-error-message'

export default function Auth() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'signup'>(
    location.pathname.includes('cadastro') ? 'signup' : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMode(location.pathname.includes('cadastro') ? 'signup' : 'login')
    setError('')
  }, [location.pathname])

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (mode === 'signup' && name.trim().length < 2) {
      setError('Digite seu nome para criar a conta.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') await signIn(email.trim(), password)
      else await signUp(name.trim(), email.trim(), password)
      navigate('/', { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next: 'login' | 'signup') {
    navigate(next === 'login' ? '/entrar' : '/cadastro')
  }

  return (
    <main className="min-h-screen bg-[#f5f6fb] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(31,35,64,0.12)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#24243e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-28 top-24 h-80 w-80 rounded-full bg-[#7657f6]/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-[#25c2d4]/20 blur-3xl" />
          <div className="relative flex items-center gap-3 text-xl font-bold tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Sparkles className="h-5 w-5 text-[#9f8cff]" />
            </span>
            Mente Clara
          </div>
          <div className="relative max-w-xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-[#a99aff]">
              Ideias que ganham forma
            </p>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-6xl">
              Organize seus pensamentos em um só lugar.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-white/65">
              Transforme ideias soltas em mapas visuais claros, conectados e prontos para evoluir
              com você.
            </p>
          </div>
          <div className="relative grid h-56 grid-cols-5 grid-rows-3 gap-4 opacity-90">
            <div className="col-start-1 row-start-2 h-px self-center bg-gradient-to-r from-transparent to-[#38bdf8]" />
            <div className="col-start-2 row-start-2 self-center rounded-xl border border-white/15 bg-white/10 p-3 text-center text-sm">
              Projetos
            </div>
            <div className="col-start-3 row-start-2 self-center rounded-2xl bg-[#7257e8] p-4 text-center font-medium shadow-xl shadow-[#7257e8]/30">
              Minha ideia
            </div>
            <div className="col-start-4 row-start-1 self-end rounded-xl border border-white/15 bg-white/10 p-3 text-center text-sm">
              Pesquisa
            </div>
            <div className="col-start-4 row-start-3 self-start rounded-xl border border-white/15 bg-white/10 p-3 text-center text-sm">
              Próximos passos
            </div>
            <div className="col-start-5 row-start-1 mb-5 h-px self-end bg-gradient-to-r from-[#a78bfa] to-transparent" />
            <div className="col-start-5 row-start-3 mt-5 h-px self-start bg-gradient-to-r from-[#2dd4bf] to-transparent" />
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-9 flex items-center gap-3 text-xl font-bold text-[#24243e] lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ede9ff]">
                <Sparkles className="h-5 w-5 text-[#6c55dd]" />
              </span>
              Mente Clara
            </div>
            <p className="text-sm font-semibold text-[#6c55dd]">
              {mode === 'login' ? 'QUE BOM TER VOCÊ DE VOLTA' : 'COMECE SUA JORNADA'}
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#202036]">
              {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
            </h2>
            <p className="mt-3 text-[#77788d]">
              {mode === 'login'
                ? 'Continue de onde parou e dê vida às suas ideias.'
                : 'Seu primeiro mapa mental está a poucos passos.'}
            </p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    placeholder="Como podemos chamar você?"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-12 rounded-xl border-[#e2e3eb] bg-[#fafaff]"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-12 rounded-xl border-[#e2e3eb] bg-[#fafaff]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="Mínimo de 8 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-12 rounded-xl border-[#e2e3eb] bg-[#fafaff] pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8c9f]"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#6250ca] text-base font-semibold shadow-lg shadow-[#6250ca]/20 hover:bg-[#5544b8]"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Entrar' : 'Criar conta'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-[#77788d]">
              {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="font-semibold text-[#6250ca] hover:underline"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Entre agora'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
