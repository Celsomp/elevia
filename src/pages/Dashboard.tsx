import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, CheckCircle2, Circle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Sunflower } from '@/components/sunflower/Sunflower'
import { ComebackModal } from '@/components/dashboard/ComebackModal'
import { PushBell } from '@/components/dashboard/PushBell'
import {
  useLifeAreas,
  useFocusSessions,
  useTodayMissions,
  useCompleteMission,
  useGenerateMissions,
  computeStreak,
  computeSunflowerHealth,
} from '@/hooks/useDashboardData'
import { cn } from '@/lib/utils'
import { LIFE_AREAS } from '@/lib/lifeAreas'

export default function Dashboard() {
  const { profile } = useAuth()
  const { data: scores = {} } = useLifeAreas()
  const { data: sessions = [] } = useFocusSessions()
  const { data: missions = [], isLoading: missionsLoading } = useTodayMissions()
  const completeMission = useCompleteMission()
  const generateMissions = useGenerateMissions()

  const [comeback, setComeback] = useState<{ days: number } | null>(null)

  // Detect comeback: user has past sessions but hasn't been active for 2+ days
  useEffect(() => {
    if (!profile?.id || !sessions.length) return
    const storageKey = `elevia_comeback_${profile.id}`
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(storageKey) === today) return // already shown today

    const lastDate = new Date(sessions[0].completed_at)
    const days = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    if (days >= 2) setComeback({ days })
  }, [sessions, profile?.id])

  function dismissComeback() {
    if (profile?.id) {
      localStorage.setItem(`elevia_comeback_${profile.id}`, new Date().toISOString().slice(0, 10))
    }
    setComeback(null)
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'Olá'
  const streak = computeStreak(sessions)

  const sessionsLast7 = sessions.filter(s => {
    const d = new Date(s.completed_at)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    return d >= cutoff
  }).length

  const doneMissions = missions.filter(m => m.completed_at).length
  const health = computeSunflowerHealth({
    streak,
    sessionsLast7,
    todayMissionsTotal: missions.length,
    todayMissionsDone: doneMissions,
  })

  // Generate today's missions if none exist yet (and we have scores)
  useEffect(() => {
    if (!missionsLoading && missions.length === 0 && Object.keys(scores).length > 0) {
      generateMissions.mutate({ scores, streak, name: firstName })
    }
  }, [missionsLoading, missions.length, Object.keys(scores).length])

  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AnimatePresence>
        {comeback && (
          <ComebackModal
            key="comeback"
            daysSince={comeback.days}
            onDismiss={dismissComeback}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="px-5 pt-10 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-body text-sm text-muted-foreground">{todayCapitalized}</p>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Olá, {firstName} 👋
            </h1>
          </div>
          <PushBell />
        </div>
      </header>

      {/* Sunflower + Streak */}
      <section className="flex flex-col items-center py-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 16, delay: 0.1 }}
        >
          <Sunflower health={health} size={200} />
        </motion.div>

        {/* Streak badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-1 flex items-center gap-1.5 rounded-full bg-sunflower/15 px-4 py-1.5"
        >
          <Flame className="h-4 w-4 text-sunflower-dark" />
          <span className="font-body text-sm font-semibold text-sunflower-dark">
            {streak} {streak === 1 ? 'dia' : 'dias'} seguidos
          </span>
        </motion.div>

        {/* Health bar */}
        <div className="mt-3 w-40">
          <div className="flex justify-between font-body text-xs text-muted-foreground mb-1">
            <span>Energia</span>
            <span>{health}/100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-sunflower"
              initial={{ width: 0 }}
              animate={{ width: `${health}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </section>

      {/* Missions */}
      <section className="flex-1 px-5 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Missões de hoje</h2>
          <span className="font-body text-sm text-muted-foreground">
            {doneMissions}/{missions.length}
          </span>
        </div>

        {missionsLoading || generateMissions.isPending ? (
          <div className="space-y-3">
            {[0, 1].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="font-body text-sm text-muted-foreground">
              As tuas missões estão a ser preparadas…
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map((mission, i) => {
              const done = !!mission.completed_at
              const area = LIFE_AREAS.find(a => a.key === mission.area)
              return (
                <motion.button
                  key={mission.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  onClick={() => !done && completeMission.mutate(mission.id)}
                  disabled={done}
                  className={cn(
                    'w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-all active:scale-[0.98]',
                    done ? 'opacity-60' : 'hover:border-sunflower/40 hover:shadow-md cursor-pointer'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {done
                        ? <CheckCircle2 className="h-5 w-5 text-sunflower" />
                        : <Circle className="h-5 w-5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        'font-body text-sm font-medium',
                        done ? 'text-muted-foreground line-through' : 'text-foreground'
                      )}>
                        {mission.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {area && (
                          <p className="font-body text-xs text-muted-foreground">
                            {area.emoji} {area.label}
                          </p>
                        )}
                        {mission.source === 'helia' && (
                          <span className="rounded-full bg-sunflower/15 px-2 py-0.5 font-body text-xs font-semibold text-sunflower-dark">
                            ✦ Helia
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* All missions done celebration */}
        {missions.length > 0 && doneMissions === missions.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 rounded-2xl bg-sunflower/10 p-4 text-center"
          >
            <p className="font-body text-sm font-semibold text-sunflower-dark">
              🌻 Missões completas! O teu girassol agradece.
            </p>
          </motion.div>
        )}
      </section>
    </div>
  )
}
