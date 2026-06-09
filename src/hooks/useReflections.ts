import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Reflection {
  id: string
  user_id: string
  prompt: string | null
  content: string
  created_at: string
}

const FREE_WEEKLY_LIMIT = 3

/** ISO week start (Monday) for a given date */
function weekStart(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

export function useReflections() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['reflections', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Reflection[]
    },
  })
}

export function useWeeklyReflectionCount() {
  const { user } = useAuth()
  const start = weekStart()
  return useQuery({
    queryKey: ['reflections_week', user?.id, start],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('reflections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .gte('created_at', `${start}T00:00:00.000Z`)
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useCanReflect(isPremium: boolean) {
  const { data: weekCount = 0 } = useWeeklyReflectionCount()
  return isPremium || weekCount < FREE_WEEKLY_LIMIT
}

export function useSaveReflection() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ prompt, content }: { prompt: string | null; content: string }) => {
      const { error } = await supabase
        .from('reflections')
        .insert({ user_id: user!.id, prompt, content })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reflections', user?.id] })
      qc.invalidateQueries({ queryKey: ['reflections_week', user?.id] })
    },
  })
}

export function useDeleteReflection() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reflections').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reflections', user?.id] })
      qc.invalidateQueries({ queryKey: ['reflections_week', user?.id] })
    },
  })
}

/** Rotates weekly through a list of guided prompts */
export function getWeeklyPrompt(): string {
  const PROMPTS = [
    'O que me deu mais energia esta semana?',
    'Que momento desta semana me deixou mais orgulhoso/a de mim?',
    'O que aprendi sobre mim próprio/a esta semana?',
    'Que hábito quero cultivar na próxima semana?',
    'O que teria feito de forma diferente esta semana?',
    'Que pessoa me impactou positivamente esta semana e porquê?',
    'Em que área da minha vida sinto que avancei, mesmo que pouco?',
    'O que me está a impedir de ser quem quero ser?',
    'Que coisa pequena me fez sorrir esta semana?',
    'Se esta semana fosse uma lição, qual seria o título?',
    'O que preciso de largar para avançar?',
    'Qual é o meu maior medo agora — e é racional?',
  ]
  const weekNum = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7))
  return PROMPTS[weekNum % PROMPTS.length]
}

export { FREE_WEEKLY_LIMIT }
