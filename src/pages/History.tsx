import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Timer, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLifeAreas, computeStreak } from '@/hooks/useDashboardData'
import { LIFE_AREAS, type LifeAreaKey } from '@/lib/lifeAreas'

// ── Data hooks ────────────────────────────────────────────────────────

function useSessionsHistory() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['sessions_history', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data } = await supabase
        .from('focus_sessions')
        .select('completed_at, duration_minutes')
        .eq('user_id', user!.id)
        .gte('completed_at', since.toISOString())
        .order('completed_at', { ascending: false })
      return (data ?? []) as { completed_at: string; duration_minutes: number }[]
    },
  })
}

function useMissionsHistory() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['missions_history', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - 6)
      const { data } = await supabase
        .from('missions')
        .select('id, mission_date, completed_at, area')
        .eq('user_id', user!.id)
        .gte('mission_date', since.toISOString().slice(0, 10))
      return (data ?? []) as { id: string; mission_date: string; completed_at: string | null; area: LifeAreaKey }[]
    },
  })
}

// ── Sub-components ────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-3"
    >
      <div>{icon}</div>
      <p className="font-display text-2xl font-bold leading-none text-foreground">{value}</p>
      <p className="font-body text-[11px] leading-tight text-muted-foreground">{label}</p>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────

export default function History() {
  const { data: sessions = [] } = useSessionsHistory()
  const { data: scores = {} } = useLifeAreas()
  const { data: missions = [] } = useMissionsHistory()

  const streak = computeStreak(sessions)

  // Group sessions by day for the last 14 days
  const last14 = useMemo(() => {
    const days: { date: string; count: number; minutes: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ date: d.toISOString().slice(0, 10), count: 0, minutes: 0 })
    }
    for (const s of sessions) {
      const dateStr = s.completed_at.slice(0, 10)
      const day = days.find(d => d.date === dateStr)
      if (day) {
        day.count++
        day.minutes += s.duration_minutes ?? 25
      }
    }
    return days
  }, [sessions])

  // This week totals (last 7 days inclusive)
  const weekCutoff = new Date()
  weekCutoff.setDate(weekCutoff.getDate() - 6)
  weekCutoff.setHours(0, 0, 0, 0)
  const sessionsThisWeek = sessions.filter(s => new Date(s.completed_at) >= weekCutoff)
  const minutesThisWeek = sessionsThisWeek.reduce((acc, s) => acc + (s.duration_minutes ?? 25), 0)

  // Missions completion rate (last 7 days)
  const totalMissions = missions.length
  const completedMissions = missions.filter(m => m.completed_at).length
  const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0

  const maxBarCount = Math.max(...last14.map(d => d.count), 1)

  // Life areas sorted highest → lowest score
  const sortedAreas = LIFE_AREAS
    .filter(a => scores[a.key] !== undefined)
    .sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <header className="px-5 pt-10 pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Histórico</h1>
        <p className="font-body text-sm text-muted-foreground">O teu percurso em números.</p>
      </header>

      {/* ── Stat cards ── */}
      <section className="px-5 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Flame className="h-4 w-4 text-sunflower-dark" />}
            value={streak}
            label={streak === 1 ? 'dia seguido' : 'dias seguidos'}
          />
          <StatCard
            icon={<Timer className="h-4 w-4 text-sunflower-dark" />}
            value={minutesThisWeek}
            label="min esta semana"
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-sunflower-dark" />}
            value={`${completionRate}%`}
            label="missões (7 dias)"
          />
        </div>
      </section>

      {/* ── Bar chart: focus sessions ── */}
      <section className="px-5 pb-6">
        <h2 className="font-display text-base font-semibold text-foreground mb-3">
          Sessões de foco — 14 dias
        </h2>
        <div className="rounded-2xl border border-border bg-card px-4 pt-4 pb-3">
          {/* Bars */}
          <div className="flex items-end gap-[3px]" style={{ height: '80px' }}>
            {last14.map((day, i) => (
              <div
                key={day.date}
                className="flex flex-1 items-end"
                style={{ height: '80px' }}
                title={`${day.date}: ${day.count} sessão${day.count !== 1 ? 'ões' : ''}`}
              >
                {day.count > 0 ? (
                  <motion.div
                    className="w-full rounded-t-[3px] bg-sunflower"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((day.count / maxBarCount) * 80, 6)}px` }}
                    transition={{ delay: i * 0.04, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                ) : (
                  <div className="w-full rounded-t-[3px] bg-muted" style={{ height: '3px' }} />
                )}
              </div>
            ))}
          </div>
          {/* Anchor labels */}
          <div className="mt-1.5 flex justify-between">
            <span className="font-body text-[10px] text-muted-foreground">há 2 semanas</span>
            <span className="font-body text-[10px] text-muted-foreground">hoje</span>
          </div>
        </div>
        {sessions.length === 0 && (
          <p className="mt-2 text-center font-body text-xs text-muted-foreground">
            Ainda sem sessões registadas. Começa o teu primeiro foco! 🌱
          </p>
        )}
      </section>

      {/* ── Missions ── */}
      {totalMissions > 0 && (
        <section className="px-5 pb-6">
          <h2 className="font-display text-base font-semibold text-foreground mb-3">
            Missões — últimos 7 dias
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <p className="font-body text-sm text-foreground">
                <span className="font-semibold text-sunflower-dark">{completedMissions}</span>
                <span className="text-muted-foreground"> de {totalMissions} concluídas</span>
              </p>
              <span className="font-display text-xl font-bold text-sunflower-dark">
                {completionRate}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-sunflower"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            {completionRate === 100 && (
              <p className="mt-2 text-center font-body text-xs font-semibold text-sunflower-dark">
                🌻 Semana perfeita!
              </p>
            )}
          </motion.div>
        </section>
      )}

      {/* ── Life areas (Roda da Vida) ── */}
      {sortedAreas.length > 0 && (
        <section className="px-5 pb-6">
          <h2 className="font-display text-base font-semibold text-foreground mb-3">
            Roda da Vida
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-3.5"
          >
            {sortedAreas.map((area, i) => {
              const score = scores[area.key] ?? 0
              return (
                <div key={area.key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-body text-sm text-foreground">
                      {area.emoji} {area.label}
                    </span>
                    <span className="font-body text-xs font-semibold text-muted-foreground">
                      {score}/10
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: area.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 10}%` }}
                      transition={{ delay: 0.25 + i * 0.05, duration: 0.55, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </motion.div>
        </section>
      )}

      {/* Empty state */}
      {sessions.length === 0 && sortedAreas.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="text-5xl">🌱</div>
          <p className="font-display text-lg font-semibold text-foreground">
            Ainda não há dados
          </p>
          <p className="font-body text-sm text-muted-foreground">
            Completa o onboarding e faz a tua primeira sessão de foco para ver o teu histórico aqui.
          </p>
        </div>
      )}
    </div>
  )
}
