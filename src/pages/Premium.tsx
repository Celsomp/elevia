import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Crown, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUpgradeToPremium } from '@/hooks/usePremium'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const FEATURES = [
  { label: 'Missões diárias', free: '2/dia', premium: 'Ilimitadas' },
  { label: 'Reflexões', free: '3/semana', premium: 'Ilimitadas' },
  { label: 'Mensagens Helia', free: '5/dia', premium: 'Ilimitadas' },
  { label: 'Sessões de foco', free: '25 e 45 min', premium: '25, 45 e 60 min' },
  { label: 'Análise avançada', free: '—', premium: 'Em breve' },
]

export default function Premium() {
  const { profile } = useAuth()
  const isPremium = profile?.plan === 'premium'
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isSuccess = params.get('success') === 'true'
  const { startCheckout, isLoading, error } = useUpgradeToPremium()

  // On success, the webhook will update the plan asynchronously.
  // Redirect to dashboard after a short celebration.
  useEffect(() => {
    if (!isSuccess) return
    const t = setTimeout(() => navigate('/dashboard', { replace: true }), 4000)
    return () => clearTimeout(t)
  }, [isSuccess, navigate])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-1.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground flex-1">Elevia Premium</h1>
        <Crown className="h-5 w-5 text-sunflower" />
      </header>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          /* ── SUCCESS STATE ── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center"
          >
            <motion.div
              className="text-8xl"
              animate={{ rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              🌻
            </motion.div>
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">Bem-vindo ao Premium!</h2>
              <p className="mt-2 font-body text-muted-foreground">
                O teu girassol vai crescer mais do que nunca.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {['Missões ilimitadas', 'Helia ilimitada', '60 min de foco'].map(tag => (
                <span
                  key={tag}
                  className="rounded-full bg-sunflower/15 px-3 py-1 font-body text-sm font-medium text-sunflower-dark"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
            <p className="font-body text-xs text-muted-foreground">A redirecionar…</p>
          </motion.div>
        ) : (
          /* ── UPGRADE PAGE ── */
          <motion.div
            key="upgrade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col"
          >
            {/* Hero */}
            <div className="px-5 pb-6 text-center">
              <div className="mb-4 text-6xl">🌻</div>
              <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
                Faz crescer o teu potencial
              </h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Remove os limites e deixa a Helia acompanhar-te sem restrições.
              </p>
            </div>

            {/* Feature comparison */}
            <div className="mx-5 mb-6 rounded-2xl border bg-card overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-3 border-b bg-muted/50 px-4 py-2.5">
                <span className="font-body text-xs font-semibold text-muted-foreground">Funcionalidade</span>
                <span className="text-center font-body text-xs font-semibold text-muted-foreground">Grátis</span>
                <span className="text-center font-body text-xs font-semibold text-sunflower-dark">Premium</span>
              </div>
              {FEATURES.map((f, i) => (
                <div
                  key={f.label}
                  className={cn(
                    'grid grid-cols-3 items-center px-4 py-3',
                    i < FEATURES.length - 1 && 'border-b'
                  )}
                >
                  <span className="font-body text-sm text-foreground">{f.label}</span>
                  <span className="text-center font-body text-xs text-muted-foreground">{f.free}</span>
                  <span className="text-center font-body text-xs font-semibold text-sunflower-dark">{f.premium}</span>
                </div>
              ))}
            </div>

            {/* Pricing card */}
            <div className="mx-5 mb-6 rounded-2xl border-2 border-sunflower/40 bg-sunflower/5 p-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-display text-4xl font-bold text-foreground">€4,99</span>
                  <span className="font-body text-sm text-muted-foreground">/mês</span>
                </div>
                <div className="rounded-full bg-sunflower/20 px-3 py-1">
                  <span className="font-body text-xs font-semibold text-sunflower-dark">Cancela quando quiseres</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {['Tudo ilimitado', 'Sem anúncios', 'Suporte prioritário'].map(item => (
                  <li key={item} className="flex items-center gap-2 font-body text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-sunflower-dark" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="px-5 pb-4">
              {isPremium ? (
                <div className="rounded-2xl bg-sunflower/10 px-5 py-4 text-center">
                  <Crown className="mx-auto mb-1 h-5 w-5 text-sunflower-dark" />
                  <p className="font-body text-sm font-semibold text-sunflower-dark">
                    Já és membro Premium 🌟
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    variant="warm"
                    size="xl"
                    className="w-full gap-2"
                    onClick={startCheckout}
                    disabled={isLoading}
                  >
                    <Crown className="h-4 w-4" />
                    {isLoading ? 'A redirecionar…' : 'Ativar Premium'}
                  </Button>
                  {error && (
                    <p className="mt-2 text-center font-body text-xs text-destructive">{error}</p>
                  )}
                </>
              )}
            </div>

            <p className="pb-8 text-center font-body text-xs text-muted-foreground px-5">
              Pagamento seguro via Stripe · Sem compromisso
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
