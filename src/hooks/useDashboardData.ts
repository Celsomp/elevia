import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { LIFE_AREAS, type LifeAreaKey, type ScoresMap } from '@/lib/lifeAreas'

interface WeakArea { key: LifeAreaKey; label: string; score: number }
interface GenerateParams { scores: ScoresMap; streak: number; name: string }

// ─── LIFE AREAS ───────────────────────────────────────────────────
export function useLifeAreas() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['life_areas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_areas')
        .select('area, score')
        .eq('user_id', user!.id)
      if (error) throw error
      const map: ScoresMap = {}
      for (const row of data ?? []) map[row.area as LifeAreaKey] = row.score
      return map
    },
  })
}

// ─── STREAK & FOCUS SESSIONS ──────────────────────────────────────
export function useFocusSessions() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['focus_sessions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('completed_at')
        .eq('user_id', user!.id)
        .gte('completed_at', since.toISOString())
        .order('completed_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

/** Computes current streak in days from focus_sessions */
export function computeStreak(sessions: { completed_at: string }[]): number {
  if (!sessions.length) return 0
  const days = new Set(sessions.map(s => s.completed_at.slice(0, 10)))
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (days.has(d.toISOString().slice(0, 10))) streak++
    else if (i > 0) break  // gap found; stop (allow today to be empty)
  }
  return streak
}

/** 0-100 sunflower health score */
export function computeSunflowerHealth(params: {
  streak: number
  sessionsLast7: number
  todayMissionsTotal: number
  todayMissionsDone: number
}): number {
  const { streak, sessionsLast7, todayMissionsTotal, todayMissionsDone } = params
  const streakScore    = Math.min(streak * 5, 30)               // max 30
  const sessionScore   = Math.min(sessionsLast7 * 10, 40)       // max 40
  const missionScore   = todayMissionsTotal > 0
    ? Math.round((todayMissionsDone / todayMissionsTotal) * 30) // max 30
    : 0
  return Math.min(streakScore + sessionScore + missionScore, 100)
}

// ─── MISSIONS ─────────────────────────────────────────────────────
export function useTodayMissions() {
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)

  return useQuery({
    queryKey: ['missions', user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, title, area, mission_date, completed_at, source')
        .eq('user_id', user!.id)
        .eq('mission_date', today)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCompleteMission() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)

  return useMutation({
    mutationFn: async (missionId: string) => {
      const { error } = await supabase
        .from('missions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', missionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['missions', user?.id, today] }),
  })
}

export function useGenerateMissions() {
  const qc = useQueryClient()
  const { user, session } = useAuth()
  const today = new Date().toISOString().slice(0, 10)

  return useMutation({
    mutationFn: async ({ scores, streak, name }: GenerateParams) => {
      const weakest: WeakArea[] = LIFE_AREAS
        .filter(a => scores[a.key] !== undefined)
        .sort((a, b) => (scores[a.key] ?? 10) - (scores[b.key] ?? 10))
        .slice(0, 3)
        .map(a => ({ key: a.key, label: a.label, score: scores[a.key] ?? 5 }))

      let selected: { title: string; area: LifeAreaKey }[] = []
      let source: 'helia' | 'static' = 'static'

      // Try AI generation via Helia
      if (session) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-missions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ weakAreas: weakest, streak, profileName: name }),
            }
          )
          if (res.ok) {
            const { missions } = await res.json()
            if (Array.isArray(missions) && missions.length >= 1) {
              selected = missions as { title: string; area: LifeAreaKey }[]
              source = 'helia'
            }
          }
        } catch { /* fallback below */ }
      }

      // Fallback to static pool if AI unavailable or returned too few
      if (selected.length < 2) {
        selected = generateStaticMissions(weakest)
        source = 'static'
      }

      const rows = selected.slice(0, 2).map(m => ({
        user_id: user!.id,
        title: m.title,
        area: m.area,
        mission_date: today,
        source,
      }))

      const { error } = await supabase.from('missions').insert(rows)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['missions', user?.id, today] }),
  })
}

function generateStaticMissions(weakAreas: WeakArea[]): { title: string; area: LifeAreaKey }[] {
  const pool = getMissionPool()
  const selected: { title: string; area: LifeAreaKey }[] = []
  const used = new Set<string>()
  for (const area of weakAreas) {
    const options = pool[area.key] ?? []
    const available = options.filter(t => !used.has(t))
    if (!available.length) continue
    const pick = available[Math.floor(Math.random() * available.length)]
    selected.push({ title: pick, area: area.key })
    used.add(pick)
    if (selected.length === 2) break
  }
  return selected
}

// Static mission pool per area (used until Helia generates them)
function getMissionPool(): Partial<Record<LifeAreaKey, string[]>> {
  return {
    career: [
      'Dedica 25 minutos a uma tarefa que tens adiado',
      'Escreve 3 metas profissionais para este mês',
      'Envia um email de follow-up que tens pendente',
      'Aprende algo novo relacionado com a tua área hoje',
      'Organiza a tua lista de tarefas por prioridade',
    ],
    health: [
      'Faz 10 minutos de movimento (caminhada, alongamentos)',
      'Bebe 8 copos de água hoje',
      'Dorme antes da meia-noite esta noite',
      'Prepara uma refeição saudável em casa',
      'Faz 5 minutos de respiração consciente',
    ],
    relationships: [
      'Envia uma mensagem genuína a alguém que não falas há tempo',
      'Passa 20 minutos sem telemóvel com alguém importante',
      'Diz algo de positivo e específico a alguém hoje',
      'Marca um encontro com um amigo para esta semana',
      'Escreve 3 coisas que aprecias nas pessoas à tua volta',
    ],
    finances: [
      'Revê os teus gastos dos últimos 7 dias',
      'Cancela uma subscrição que não usas',
      'Define um objetivo de poupança para este mês',
      'Lê 10 minutos sobre educação financeira',
      'Prepara o orçamento da próxima semana',
    ],
    personal_growth: [
      'Lê 15 minutos de um livro que te inspira',
      'Escreve 3 aprendizagens desta semana',
      'Ouve um podcast educativo durante o almoço',
      'Aprende 5 palavras de um idioma que queres dominar',
      'Reflete 5 minutos sobre quem queres ser daqui a 1 ano',
    ],
    leisure: [
      'Faz algo que gostas só porque sim — sem produtividade',
      'Passa 20 minutos ao ar livre sem telemóvel',
      'Ouve a tua música favorita de forma consciente',
      'Experimenta um hobby que queres explorar há tempo',
      'Assiste a algo que te faça rir',
    ],
    environment: [
      'Arruma uma área pequena da tua casa (mesa, secretária)',
      'Desfaz-te de 3 objetos que já não precisas',
      'Limpa e organiza o teu espaço de trabalho',
      'Decora o teu espaço com algo que te faça sentir bem',
      'Abre as janelas e deixa entrar luz natural',
    ],
    family: [
      'Liga para um familiar com quem não falas há tempo',
      'Partilha uma refeição sem distrações com a família',
      'Expressa gratidão a um familiar hoje',
      'Organiza uma atividade simples com a família para breve',
      'Escreve uma mensagem de carinho a alguém da família',
    ],
  }
}
