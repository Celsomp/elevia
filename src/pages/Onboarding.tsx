import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { LIFE_AREAS, getWeakestAreas, type ScoresMap } from '@/lib/lifeAreas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Step = 'welcome' | 'how-it-works' | 'name' | 'areas' | 'results'

const STEP_INDEX: Record<Step, number> = {
  'welcome': 0,
  'how-it-works': 1,
  'name': 2,
  'areas': 3,
  'results': 3,
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('welcome')
  const [areaIndex, setAreaIndex] = useState(0)
  const [scores, setScores] = useState<ScoresMap>({})
  const [name, setName] = useState('')
  const [direction, setDirection] = useState(1)
  const [saving, setSaving] = useState(false)

  const currentArea = LIFE_AREAS[areaIndex]
  const weakest = getWeakestAreas(scores)
  const activeStep = STEP_INDEX[step]

  function advance(next: Step) {
    setDirection(1)
    setStep(next)
  }

  function retreat(prev: Step) {
    setDirection(-1)
    setStep(prev)
  }

  function goNext() {
    if (step === 'welcome') advance('how-it-works')
    else if (step === 'how-it-works') advance('name')
    else if (step === 'name') advance('areas')
    else if (step === 'areas') {
      if (areaIndex < LIFE_AREAS.length - 1) {
        setDirection(1)
        setAreaIndex(i => i + 1)
      } else {
        advance('results')
      }
    }
  }

  function goBack() {
    if (step === 'how-it-works') retreat('welcome')
    else if (step === 'name') retreat('how-it-works')
    else if (step === 'areas' && areaIndex === 0) retreat('name')
    else if (step === 'areas' && areaIndex > 0) {
      setDirection(-1)
      setAreaIndex(i => i - 1)
    } else if (step === 'results') {
      setDirection(-1)
      setStep('areas')
      setAreaIndex(LIFE_AREAS.length - 1)
    }
  }

  function setScore(score: number) {
    setScores(s => ({ ...s, [currentArea.key]: score }))
  }

  async function completeOnboarding() {
    if (!user) return
    setSaving(true)

    const rows = LIFE_AREAS.map(area => ({
      user_id: user.id,
      area: area.key,
      score: scores[area.key] ?? 5,
    }))

    await supabase.from('life_areas').upsert(rows, { onConflict: 'user_id,area' })
    await supabase
      .from('profiles')
      .update({ name: name.trim(), onboarding_complete: true })
      .eq('id', user.id)

    await refreshProfile()
    navigate('/home')
  }

  const canAdvanceArea = step === 'areas' ? scores[currentArea.key] !== undefined : true

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 pt-12 pb-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === activeStep
                ? 'w-6 bg-sunflower'
                : i < activeStep
                  ? 'w-2 bg-sunflower/50'
                  : 'w-2 bg-muted'
            )}
          />
        ))}
      </div>

      {/* Area sub-progress (only during areas step) */}
      {(step === 'areas' || step === 'results') && (
        <div className="h-0.5 w-full bg-muted">
          <motion.div
            className="h-full bg-sunflower/60"
            animate={{
              width: step === 'results'
                ? '100%'
                : `${((areaIndex + 1) / LIFE_AREAS.length) * 100}%`
            }}
            transition={{ type: 'spring', damping: 20 }}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 'welcome' && (
            <WelcomeStep key="welcome" onNext={goNext} />
          )}
          {step === 'how-it-works' && (
            <HowItWorksStep key="how-it-works" onNext={goNext} onBack={goBack} direction={direction} />
          )}
          {step === 'name' && (
            <NameStep
              key="name"
              value={name}
              onChange={setName}
              onNext={goNext}
              onBack={goBack}
              direction={direction}
            />
          )}
          {step === 'areas' && (
            <AreaStep
              key={`area-${areaIndex}`}
              area={currentArea}
              areaIndex={areaIndex}
              total={LIFE_AREAS.length}
              score={scores[currentArea.key]}
              onScore={setScore}
              onNext={goNext}
              onBack={goBack}
              canAdvance={canAdvanceArea}
              direction={direction}
            />
          )}
          {step === 'results' && (
            <ResultsStep
              key="results"
              scores={scores}
              weakest={weakest}
              onBack={goBack}
              onComplete={completeOnboarding}
              saving={saving}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── WELCOME ──────────────────────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="text-7xl"
        animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
        transition={{ duration: 1.2, delay: 0.4 }}
      >
        🌻
      </motion.div>
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Bem-vindo à Elevia
        </h1>
        <p className="mt-3 font-body leading-relaxed text-muted-foreground">
          A tua plataforma de crescimento pessoal. Missões diárias, foco guiado e uma IA de bolso que te conhece.
        </p>
      </div>
      <Button variant="warm" size="xl" className="w-full max-w-xs" onClick={onNext}>
        Começar →
      </Button>
    </motion.div>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────
function HowItWorksStep({
  onNext,
  onBack,
  direction,
}: {
  onNext: () => void
  onBack: () => void
  direction: number
}) {
  const features = [
    {
      emoji: '🌻',
      title: 'O teu girassol pessoal',
      body: 'Cresce com cada sessão de foco, missão cumprida e reflexão. Negligencia-o e ele murcha — tal como nós.',
    },
    {
      emoji: '🎯',
      title: 'Missões diárias',
      body: 'Todos os dias recebes missões personalizadas nas 3 áreas da tua vida que precisam de mais atenção.',
    },
    {
      emoji: '✦',
      title: 'Helia, a tua IA',
      body: 'Uma companheira empática sempre disponível para te ouvir, orientar e celebrar os teus progressos.',
    },
  ]

  return (
    <motion.div
      className="flex flex-1 flex-col px-6 pb-8 pt-4"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <h2 className="mb-6 text-center font-display text-2xl font-bold text-foreground">
        Como funciona
      </h2>

      <div className="flex-1 space-y-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.15 }}
            className="flex gap-4 rounded-2xl bg-card p-4 shadow-sm border"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sunflower/15 text-2xl">
              {f.emoji}
            </div>
            <div>
              <p className="font-body font-semibold text-foreground">{f.title}</p>
              <p className="mt-0.5 font-body text-sm text-muted-foreground">{f.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>
          ← Voltar
        </Button>
        <Button variant="warm" size="lg" className="flex-[2]" onClick={onNext}>
          Percebido →
        </Button>
      </div>
    </motion.div>
  )
}

// ─── NAME ─────────────────────────────────────────────────────────
function NameStep({
  value,
  onChange,
  onNext,
  onBack,
  direction,
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: () => void
  direction: number
}) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value.trim()) onNext()
  }

  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center px-6 pb-8"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">👋</div>
        <h2 className="font-display text-2xl font-bold text-foreground">Como te chamas?</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          A Helia vai usar o teu nome para te chamar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <Input
          type="text"
          placeholder="O teu primeiro nome"
          autoComplete="given-name"
          autoFocus
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          className="text-center text-lg"
        />

        <div className="flex gap-3">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
            ← Voltar
          </Button>
          <Button
            type="submit"
            variant="warm"
            size="lg"
            className="flex-[2]"
            disabled={!value.trim()}
          >
            Continuar →
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── AREA STEP ────────────────────────────────────────────────────
interface AreaStepProps {
  area: typeof LIFE_AREAS[0]
  areaIndex: number
  total: number
  score: number | undefined
  onScore: (s: number) => void
  onNext: () => void
  onBack: () => void
  canAdvance: boolean
  direction: number
}

function AreaStep({ area, areaIndex, total, score, onScore, onNext, onBack, canAdvance, direction }: AreaStepProps) {
  const isLast = areaIndex === total - 1
  return (
    <motion.div
      className="flex flex-1 flex-col px-6 pb-8 pt-4"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="mb-6 text-center">
        <div className="mb-2 text-5xl">{area.emoji}</div>
        <h2 className="font-display text-2xl font-bold text-foreground">{area.label}</h2>
        <p className="mt-1 font-body text-sm text-muted-foreground">{area.description}</p>
        <p className="mt-1 font-body text-xs text-muted-foreground">{areaIndex + 1} de {total}</p>
      </div>

      <div className="flex-1">
        <p className="mb-4 text-center font-body text-sm font-medium text-muted-foreground">
          Como classificas esta área hoje?
        </p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => onScore(n)}
              className={cn(
                'flex h-14 items-center justify-center rounded-xl font-body text-lg font-semibold transition-all active:scale-95',
                score === n
                  ? 'scale-105 bg-sunflower text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-sunflower/20 hover:text-sunflower-dark'
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-4 h-6 text-center">
          {score !== undefined && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-body text-sm font-medium text-sunflower-dark"
            >
              {score <= 3 ? '😔 Área que precisa de atenção' : score <= 6 ? '🙂 Área em desenvolvimento' : '😊 Área em boa forma'}
            </motion.p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>
          ← Voltar
        </Button>
        <Button
          variant="warm"
          size="lg"
          className="flex-[2]"
          disabled={!canAdvance}
          onClick={onNext}
        >
          {isLast ? 'Ver resultados →' : 'Próxima →'}
        </Button>
      </div>
    </motion.div>
  )
}

// ─── RESULTS ──────────────────────────────────────────────────────
interface ResultsStepProps {
  scores: ScoresMap
  weakest: typeof LIFE_AREAS
  onBack: () => void
  onComplete: () => void
  saving: boolean
}

function ResultsStep({ scores, weakest, onBack, onComplete, saving }: ResultsStepProps) {
  return (
    <motion.div
      className="flex flex-1 flex-col px-6 pb-8 pt-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-6 text-center">
        <div className="mb-2 text-5xl">✨</div>
        <h2 className="font-display text-2xl font-bold text-foreground">A tua Roda da Vida</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          A Elevia vai focar as tuas missões diárias nestas 3 áreas:
        </p>
      </div>

      <div className="mb-5 space-y-3">
        {weakest.map((area, i) => (
          <motion.div
            key={area.key}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sunflower/15 text-2xl">
              {area.emoji}
            </div>
            <div className="flex-1">
              <p className="font-body font-semibold text-foreground">{area.label}</p>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-sunflower"
                  initial={{ width: 0 }}
                  animate={{ width: `${((scores[area.key] ?? 0) / 10) * 100}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
            <span className="font-display text-xl font-bold text-sunflower-dark">
              {scores[area.key]}/10
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mb-5 rounded-2xl bg-muted/50 p-4">
        <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Todas as áreas
        </p>
        <div className="space-y-2">
          {LIFE_AREAS.map(area => (
            <div key={area.key} className="flex items-center gap-2">
              <span className="w-4 text-sm">{area.emoji}</span>
              <span className="w-32 font-body text-xs text-muted-foreground">{area.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-sunflower/60"
                  style={{ width: `${((scores[area.key] ?? 0) / 10) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right font-body text-xs font-medium text-foreground">
                {scores[area.key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>
          ← Rever
        </Button>
        <Button variant="warm" size="lg" className="flex-[2]" onClick={onComplete} disabled={saving}>
          {saving ? 'A guardar…' : 'Começar a Elevia 🌻'}
        </Button>
      </div>
    </motion.div>
  )
}
