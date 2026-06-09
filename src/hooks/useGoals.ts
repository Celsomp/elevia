import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { LifeAreaKey } from '@/lib/lifeAreas'

export type GoalHorizon = 'short' | 'medium' | 'long'

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  area: LifeAreaKey
  horizon: GoalHorizon
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateGoalInput {
  title: string
  description?: string
  area: LifeAreaKey
  horizon: GoalHorizon
}

export interface UpdateGoalInput {
  id: string
  title: string
  description?: string
  area: LifeAreaKey
  horizon: GoalHorizon
}

const QK = (userId: string | undefined) => ['goals', userId]

export function useGoals() {
  const { user } = useAuth()
  return useQuery({
    queryKey: QK(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Goal[]
    },
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const { error } = await supabase.from('goals').insert({
        user_id: user!.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        area: input.area,
        horizon: input.horizon,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(user?.id) }),
  })
}

export function useToggleGoal() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('goals')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(user?.id) }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: UpdateGoalInput) => {
      const { error } = await supabase
        .from('goals')
        .update({
          title: input.title.trim(),
          description: input.description?.trim() || null,
          area: input.area,
          horizon: input.horizon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(user?.id) }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(user?.id) }),
  })
}

export const HORIZON_LABELS: Record<GoalHorizon, string> = {
  short:  'Curto Prazo',
  medium: 'Médio Prazo',
  long:   'Longo Prazo',
}

export const HORIZON_DESCRIPTION: Record<GoalHorizon, string> = {
  short:  'Diário / Semanal',
  medium: '3 meses – 1 ano',
  long:   '1 – 10 anos',
}
