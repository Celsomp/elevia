import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Lock, Coffee, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { TimerRing } from '@/components/focus/TimerRing'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Mode = 'free' | 'pomodoro'
type TimerState = 'idle' | 'running' | 'paused' | 'completed'
type PomPhase = 'work' | 'break'

const PRESETS = [
  { minutes: 25, label: '25 min', premium: false },
  { minutes: 45, label: '45 min', premium: false },
  { minutes: 60, label: '60 min', premium: true },
]

const POM = {
  workSecs: 25 * 60,
  shortBreakSecs: 5 * 60,
  longBreakSecs: 15 * 60,
  cycleLength: 4,
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function playBell() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 528
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
    osc.start()
    osc.stop(ctx.currentTime + 2)
  } catch { /* AudioContext unavailable */ }
}

export default function Focus() {
  const { user, profile } = useAuth()
  const qc = useQueryClient()
  const isPremium = profile?.plan === 'premium'

  // ── Mode ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('free')

  // ── Free mode ─────────────────────────────────────────────────────
  const [freePreset, setFreePreset] = useState(25)
  const [freeState, setFreeState] = useState<TimerState>('idle')
  const [freeRemaining, setFreeRemaining] = useState(25 * 60)

  // ── Pomodoro ──────────────────────────────────────────────────────
  // cycleRound: 1..4 — which session we're on in the current cycle
  const [pomState, setPomState] = useState<TimerState>('idle')
  const [pomPhase, setPomPhase] = useState<PomPhase>('work')
  const [pomCycleRound, setPomCycleRound] = useState(1)
  const [pomBreakMins, setPomBreakMins] = useState(5)
  const [pomRemaining, setPomRemaining] = useState(POM.workSecs)

  const [saving, setSaving] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  // ── Unified aliases ───────────────────────────────────────────────
  const timerState = mode === 'free' ? freeState : pomState
  const remaining = mode === 'free' ? freeRemaining : pomRemaining
  const totalSeconds = mode === 'free'
    ? freePreset * 60
    : pomPhase === 'work' ? POM.workSecs : pomBreakMins * 60
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0
  const isActive = timerState === 'running' || timerState === 'paused'

  const isBreak = mode === 'pomodoro' && pomPhase === 'break'
  const ringColor = isBreak
    ? (timerState === 'paused' ? 'hsl(142 40% 65%)' : 'hsl(142 71% 45%)')
    : (timerState === 'paused' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--sunflower))')

  // ── Timer tick ────────────────────────────────────────────────────
  useEffect(() => {
    if (timerState !== 'running') return
    intervalRef.current = setInterval(() => {
      if (mode === 'free') {
        setFreeRemaining(r => {
          if (r <= 1) { clearTimer(); setFreeState('completed'); return 0 }
          return r - 1
        })
      } else {
        setPomRemaining(r => {
          if (r <= 1) { clearTimer(); setPomState('completed'); return 0 }
          return r - 1
        })
      }
    }, 1000)
    return clearTimer
  }, [timerState, mode, clearTimer])

  // ── Free: save session on completion ─────────────────────────────
  useEffect(() => {
    if (mode !== 'free' || freeState !== 'completed' || !user) return
    setSaving(true)
    supabase
      .from('focus_sessions')
      .insert({ user_id: user.id, duration_minutes: freePreset })
      .then(() => { setSaving(false); qc.invalidateQueries({ queryKey: ['focus_sessions', user.id] }) })
  }, [freeState])

  // ── Pomodoro: bell + save work session on completion ──────────────
  useEffect(() => {
    if (mode !== 'pomodoro' || pomState !== 'completed') return
    playBell()
    if (pomPhase === 'work' && user) {
      supabase
        .from('focus_sessions')
        .insert({ user_id: user.id, duration_minutes: 25 })
        .then(() => qc.invalidateQueries({ queryKey: ['focus_sessions', user.id] }))
    }
  }, [pomState, pomPhase, mode])

  // ── Handlers ──────────────────────────────────────────────────────
  function handleStart() {
    if (mode === 'free') {
      if (freeState === 'idle') setFreeRemaining(freePreset * 60)
      setFreeState('running')
    } else {
      setPomState('running')
    }
  }

  function handlePause() {
    if (mode === 'free') setFreeState('paused')
    else setPomState('paused')
  }

  function handleReset() {
    clearTimer()
    if (mode === 'free') {
      setFreeState('idle')
      setFreeRemaining(freePreset * 60)
    } else {
      setPomState('idle')
      setPomRemaining(pomPhase === 'work' ? POM.workSecs : pomBreakMins * 60)
    }
  }

  function handleSelectPreset(minutes: number, premium: boolean) {
    if (premium && !isPremium) return
    if (freeState !== 'idle') return
    setFreePreset(minutes)
    setFreeRemaining(minutes * 60)
  }

  // Called after work completes — advance to break
  function handleStartBreak() {
    const isLong = pomCycleRound === POM.cycleLength
    const mins = isLong ? 15 : 5
    setPomBreakMins(mins)
    setPomPhase('break')
    setPomRemaining(mins * 60)
    setPomState('idle')
  }

  // Called after break completes — start next work session
  function handleNextWork() {
    const nextRound = pomCycleRound === POM.cycleLength ? 1 : pomCycleRound + 1
    setPomCycleRound(nextRound)
    setPomPhase('work')
    setPomRemaining(POM.workSecs)
    setPomState('idle')
  }

  function handleModeSwitch(m: Mode) {
    clearTimer()
    setMode(m)
    setFreeState('idle')
    setFreeRemaining(freePreset * 60)
    setPomState('idle')
    setPomPhase('work')
    setPomCycleRound(1)
    setPomRemaining(POM.workSecs)
  }

  // Dots: how many sessions are "done" in the visual indicator
  // During work: cycleRound-1 filled, cycleRound is active
  // During break: cycleRound filled (just completed), rest empty/upcoming
  const dotsDone = pomPhase === 'break' ? pomCycleRound : pomCycleRound - 1

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="px-5 pt-10 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Foco</h1>
        <p className="font-body text-sm text-muted-foreground">Uma coisa de cada vez.</p>
      </header>

      {/* Mode toggle */}
      <div className="flex gap-2 px-5 pb-5">
        {(['free', 'pomodoro'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className={cn(
              'flex-1 rounded-xl py-2.5 font-body text-sm font-medium transition-all',
              mode === m
                ? 'bg-sunflower text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {m === 'free' ? 'Livre' : '🍅 Pomodoro'}
          </button>
        ))}
      </div>

      {/* Free: preset selector */}
      {mode === 'free' && (
        <div className="flex justify-center gap-3 px-5 pb-6">
          {PRESETS.map(({ minutes, label, premium }) => {
            const locked = premium && !isPremium
            return (
              <button
                key={minutes}
                onClick={() => handleSelectPreset(minutes, premium)}
                disabled={isActive || locked}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 font-body text-sm font-medium transition-all',
                  freePreset === minutes && !locked
                    ? 'bg-sunflower text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground',
                  locked && 'opacity-50 cursor-not-allowed',
                  !isActive && !locked && 'hover:bg-sunflower/20 hover:text-sunflower-dark'
                )}
              >
                {locked && <Lock className="h-3 w-3" />}
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Pomodoro: session dots */}
      {mode === 'pomodoro' && (
        <motion.div
          layout
          className="flex flex-col items-center gap-2 pb-5"
        >
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                animate={
                  i === pomCycleRound && pomPhase === 'work' && timerState === 'running'
                    ? { scale: [1, 1.3, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className={cn(
                  'h-3 w-3 rounded-full transition-colors duration-300',
                  i <= dotsDone
                    ? 'bg-sunflower'
                    : i === pomCycleRound && pomPhase === 'work'
                      ? 'bg-sunflower/50 ring-2 ring-sunflower ring-offset-1 ring-offset-background'
                      : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className="font-body text-xs text-muted-foreground">
            {pomPhase === 'work'
              ? `Sessão ${pomCycleRound} de ${POM.cycleLength}`
              : pomBreakMins === 15
                ? '☕ Pausa longa (15 min)'
                : '☕ Pausa curta (5 min)'}
          </p>
        </motion.div>
      )}

      {/* Timer */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-4">
        <AnimatePresence mode="wait">

          {/* ── Free mode: completion screen ── */}
          {mode === 'free' && freeState === 'completed' ? (
            <motion.div
              key="free-complete"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-center px-8"
            >
              <motion.div
                className="text-7xl"
                animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8 }}
              >
                🌻
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Sessão concluída!
              </h2>
              <p className="font-body text-sm text-muted-foreground">
                {freePreset} minutos de foco puro. O teu girassol cresceu.
              </p>
              {saving && <p className="font-body text-xs text-muted-foreground">A guardar…</p>}
              <Button variant="warm" size="lg" onClick={handleReset} className="mt-2 w-48">
                Nova sessão
              </Button>
            </motion.div>

          /* ── Pomodoro: work completed → prompt break ── */
          ) : mode === 'pomodoro' && pomState === 'completed' && pomPhase === 'work' ? (
            <motion.div
              key="pom-work-done"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-center px-8"
            >
              <motion.div
                className="text-6xl"
                animate={{ rotate: [0, -8, 8, -5, 5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.7 }}
              >
                {pomCycleRound === POM.cycleLength ? '🏆' : '🌻'}
              </motion.div>
              <h2 className="font-display text-xl font-bold text-foreground">
                {pomCycleRound === POM.cycleLength ? 'Ciclo completo!' : 'Sessão concluída!'}
              </h2>
              <p className="font-body text-sm text-muted-foreground">
                {pomCycleRound === POM.cycleLength
                  ? `4 sessões feitas! Mereces uma pausa longa de 15 min. 💪`
                  : `Mereces uma pausa de 5 min. Descansa um pouco.`}
              </p>
              <button
                onClick={handleStartBreak}
                className="mt-2 flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-body text-sm font-semibold text-white shadow transition-all active:scale-95 hover:bg-emerald-600"
              >
                <Coffee className="h-4 w-4" />
                Iniciar pausa de {pomCycleRound === POM.cycleLength ? '15' : '5'} min
              </button>
            </motion.div>

          /* ── Pomodoro: break completed → prompt next work ── */
          ) : mode === 'pomodoro' && pomState === 'completed' && pomPhase === 'break' ? (
            <motion.div
              key="pom-break-done"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-center px-8"
            >
              <motion.div
                className="text-6xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
              >
                ☀️
              </motion.div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Pausa terminada!
              </h2>
              <p className="font-body text-sm text-muted-foreground">
                {pomBreakMins === 15
                  ? `Novo ciclo. Vai buscar mais energia! 🌱`
                  : `Pronto para a próxima sessão?`}
              </p>
              <button
                onClick={handleNextWork}
                className="mt-2 flex items-center gap-2 rounded-2xl bg-sunflower px-6 py-3 font-body text-sm font-semibold text-primary-foreground shadow transition-all active:scale-95 hover:bg-sunflower-dark"
              >
                <Sun className="h-4 w-4" />
                Iniciar sessão {pomCycleRound === POM.cycleLength ? '1' : pomCycleRound + 1}
              </button>
            </motion.div>

          /* ── Active timer (free and pomodoro) ── */
          ) : (
            <motion.div
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <TimerRing
                progress={progress}
                color={ringColor}
              >
                <motion.span
                  className="font-display text-5xl font-bold tabular-nums text-foreground"
                  animate={{ opacity: timerState === 'paused' ? [1, 0.4, 1] : 1 }}
                  transition={{ duration: 1.2, repeat: timerState === 'paused' ? Infinity : 0 }}
                >
                  {formatTime(remaining)}
                </motion.span>
                <span className="font-body text-sm text-muted-foreground mt-1">
                  {timerState === 'idle'
                    ? 'pronto'
                    : timerState === 'paused'
                      ? 'pausado'
                      : isBreak ? 'em pausa' : 'em foco'}
                </span>
              </TimerRing>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {isActive && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    className="h-12 w-12 rounded-full"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                )}

                <button
                  onClick={timerState === 'running' ? handlePause : handleStart}
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95',
                    isBreak
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-sunflower hover:bg-sunflower-dark text-primary-foreground'
                  )}
                >
                  {timerState === 'running'
                    ? <Pause className="h-8 w-8" />
                    : <Play className="h-8 w-8 translate-x-0.5" />
                  }
                </button>

                {isActive && <div className="h-12 w-12" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium upsell (free mode only) */}
      {!isPremium && mode === 'free' && (
        <div className="px-5 pb-8">
          <p className="text-center font-body text-xs text-muted-foreground">
            🔒 Sessões de 60 min disponíveis no{' '}
            <Link to="/premium" className="font-semibold text-sunflower-dark underline-offset-2 hover:underline">
              Premium
            </Link>
          </p>
        </div>
      )}

      {/* Pomodoro info footer */}
      {mode === 'pomodoro' && (
        <div className="px-5 pb-8">
          <p className="text-center font-body text-xs text-muted-foreground">
            25 min foco · 5 min pausa · pausa longa de 15 min a cada 4 sessões
          </p>
        </div>
      )}
    </div>
  )
}
