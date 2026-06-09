import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2, Circle, Pencil, Trash2, X, Target } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LIFE_AREAS } from '@/lib/lifeAreas'
import type { LifeAreaKey } from '@/lib/lifeAreas'
import {
  useGoals,
  useCreateGoal,
  useToggleGoal,
  useUpdateGoal,
  useDeleteGoal,
  HORIZON_LABELS,
  HORIZON_DESCRIPTION,
  type Goal,
  type GoalHorizon,
} from '@/hooks/useGoals'
import { cn } from '@/lib/utils'

const HORIZONS: GoalHorizon[] = ['short', 'medium', 'long']

const HORIZON_COLORS: Record<GoalHorizon, string> = {
  short:  'text-blue-500',
  medium: 'text-emerald-600',
  long:   'text-purple-500',
}

const HORIZON_BG: Record<GoalHorizon, string> = {
  short:  'bg-blue-50 dark:bg-blue-950/30',
  medium: 'bg-emerald-50 dark:bg-emerald-950/30',
  long:   'bg-purple-50 dark:bg-purple-950/30',
}

// ─── Goal Form (reused in Add sheet + Edit dialog) ─────────────────────────
interface GoalFormProps {
  title: string; onTitle(v: string): void
  description: string; onDescription(v: string): void
  area: LifeAreaKey; onArea(v: LifeAreaKey): void
  horizon: GoalHorizon; onHorizon(v: GoalHorizon): void
}

function GoalForm({ title, onTitle, description, onDescription, area, onArea, horizon, onHorizon }: GoalFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Objetivo *
        </label>
        <input
          value={title}
          onChange={e => onTitle(e.target.value)}
          placeholder="Ex: Correr 5km sem parar"
          className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunflower"
          maxLength={120}
        />
      </div>

      <div>
        <label className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Descrição (opcional)
        </label>
        <textarea
          value={description}
          onChange={e => onDescription(e.target.value)}
          placeholder="Detalha o teu objetivo…"
          rows={2}
          className="mt-1 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunflower"
          maxLength={300}
        />
      </div>

      <div>
        <label className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Prazo
        </label>
        <div className="mt-1 flex gap-2">
          {HORIZONS.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => onHorizon(h)}
              className={cn(
                'flex-1 rounded-xl border py-2 font-body text-xs font-semibold transition-colors',
                h === horizon
                  ? 'border-sunflower bg-sunflower/10 text-sunflower-dark'
                  : 'border-input text-muted-foreground hover:border-sunflower/50'
              )}
            >
              {HORIZON_LABELS[h].split(' ')[0]}
            </button>
          ))}
        </div>
        <p className="mt-1 font-body text-[10px] text-muted-foreground">
          {HORIZON_DESCRIPTION[horizon]}
        </p>
      </div>

      <div>
        <label className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Área de vida
        </label>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {LIFE_AREAS.map(a => (
            <button
              key={a.key}
              type="button"
              onClick={() => onArea(a.key)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl border py-2 transition-colors',
                a.key === area
                  ? 'border-sunflower bg-sunflower/10'
                  : 'border-input hover:border-sunflower/40'
              )}
            >
              <span className="text-base">{a.emoji}</span>
              <span className="font-body text-[9px] text-muted-foreground leading-tight text-center px-0.5">
                {a.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Add Goal Sheet ─────────────────────────────────────────────────────────
interface AddSheetProps {
  defaultHorizon: GoalHorizon
  onClose(): void
}

function AddGoalSheet({ defaultHorizon, onClose }: AddSheetProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState<LifeAreaKey>('personal_growth')
  const [horizon, setHorizon] = useState<GoalHorizon>(defaultHorizon)
  const create = useCreateGoal()

  function handleSubmit() {
    if (!title.trim()) return
    create.mutate({ title, description, area, horizon }, { onSuccess: onClose })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="mb-0 w-full max-w-sm rounded-t-3xl bg-background px-5 pt-5 pb-8 shadow-2xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Novo Objetivo</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <GoalForm
          title={title} onTitle={setTitle}
          description={description} onDescription={setDescription}
          area={area} onArea={setArea}
          horizon={horizon} onHorizon={setHorizon}
        />

        <Button
          variant="warm"
          className="mt-5 w-full"
          disabled={!title.trim() || create.isPending}
          onClick={handleSubmit}
        >
          {create.isPending ? 'A guardar…' : 'Adicionar Objetivo'}
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ─── Edit Goal Dialog ────────────────────────────────────────────────────────
interface EditDialogProps {
  goal: Goal
  onClose(): void
}

function EditGoalDialog({ goal, onClose }: EditDialogProps) {
  const [title, setTitle] = useState(goal.title)
  const [description, setDescription] = useState(goal.description ?? '')
  const [area, setArea] = useState<LifeAreaKey>(goal.area)
  const [horizon, setHorizon] = useState<GoalHorizon>(goal.horizon)
  const update = useUpdateGoal()

  function handleSubmit() {
    if (!title.trim()) return
    update.mutate({ id: goal.id, title, description, area, horizon }, { onSuccess: onClose })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="mb-0 w-full max-w-sm rounded-t-3xl bg-background px-5 pt-5 pb-8 shadow-2xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Editar Objetivo</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <GoalForm
          title={title} onTitle={setTitle}
          description={description} onDescription={setDescription}
          area={area} onArea={setArea}
          horizon={horizon} onHorizon={setHorizon}
        />

        <Button
          variant="warm"
          className="mt-5 w-full"
          disabled={!title.trim() || update.isPending}
          onClick={handleSubmit}
        >
          {update.isPending ? 'A guardar…' : 'Guardar alterações'}
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ─── Delete Confirm ──────────────────────────────────────────────────────────
interface DeleteConfirmProps {
  goal: Goal
  onClose(): void
}

function DeleteConfirm({ goal, onClose }: DeleteConfirmProps) {
  const del = useDeleteGoal()

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Apagar objetivo?</h3>
        <p className="font-body text-sm text-muted-foreground mb-5">
          "{goal.title}" será eliminado permanentemente.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={del.isPending}
            onClick={() => del.mutate(goal.id, { onSuccess: onClose })}
          >
            {del.isPending ? 'A apagar…' : 'Apagar'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Goal Card ───────────────────────────────────────────────────────────────
interface GoalCardProps {
  goal: Goal
  isPremium: boolean
  index: number
  onEdit(g: Goal): void
  onDelete(g: Goal): void
}

function GoalCard({ goal, isPremium, index, onEdit, onDelete }: GoalCardProps) {
  const toggle = useToggleGoal()
  const area = LIFE_AREAS.find(a => a.key === goal.area)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-sm transition-colors',
        goal.completed && 'bg-primary/5'
      )}
      style={{ borderLeft: area ? `3px solid ${area.color}` : undefined }}
    >
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          onClick={() => toggle.mutate({ id: goal.id, completed: !goal.completed })}
          disabled={toggle.isPending}
          className="mt-0.5 shrink-0 transition-transform active:scale-90"
        >
          {goal.completed
            ? <CheckCircle2 className="h-5 w-5 text-sunflower" />
            : <Circle className="h-5 w-5 text-muted-foreground" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-body text-sm font-medium leading-snug',
            goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'
          )}>
            {goal.title}
          </p>
          {goal.description && (
            <p className="mt-0.5 font-body text-xs text-muted-foreground line-clamp-2">
              {goal.description}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {area && (
              <span className="font-body text-[10px] text-muted-foreground">
                {area.emoji} {area.label}
              </span>
            )}
          </div>
        </div>

        {/* Premium actions */}
        {isPremium && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(goal)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(goal)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Goals() {
  const { profile } = useAuth()
  const [activeHorizon, setActiveHorizon] = useState<GoalHorizon>('medium')
  const [addOpen, setAddOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null)

  const { data: allGoals = [], isLoading } = useGoals()
  const isPremium = profile?.plan === 'premium'

  const filtered = allGoals.filter(g => g.horizon === activeHorizon)
  const doneCount = filtered.filter(g => g.completed).length

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-sunflower/8 via-sunflower/4 to-transparent">
        <header className="px-5 pt-10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sunflower/15">
              <Target className="h-5 w-5 text-sunflower-dark" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Objetivos</h1>
              <p className="font-body text-xs text-muted-foreground">
                {allGoals.filter(g => !g.completed).length} ativos · {allGoals.filter(g => g.completed).length} concluídos
              </p>
            </div>
          </div>
        </header>

        {/* Horizon tabs */}
        <div className="flex gap-0 border-b border-border px-5">
          {HORIZONS.map(h => (
            <button
              key={h}
              onClick={() => setActiveHorizon(h)}
              className={cn(
                'flex-1 pb-3 pt-1 font-body text-xs font-semibold transition-colors',
                activeHorizon === h
                  ? 'border-b-2 border-sunflower text-sunflower-dark'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {HORIZON_LABELS[h].split(' ')[0]}
              <br />
              <span className="font-normal opacity-70">{HORIZON_LABELS[h].split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goal list */}
      <div className="flex-1 px-5 pb-32 pt-4">
        {/* Horizon summary */}
        <div className={cn(
          'mb-4 rounded-2xl px-4 py-3 flex items-center justify-between',
          HORIZON_BG[activeHorizon]
        )}>
          <div>
            <p className={cn('font-body text-xs font-semibold', HORIZON_COLORS[activeHorizon])}>
              {HORIZON_LABELS[activeHorizon]}
            </p>
            <p className="font-body text-[10px] text-muted-foreground">
              {HORIZON_DESCRIPTION[activeHorizon]}
            </p>
          </div>
          {filtered.length > 0 && (
            <span className={cn('font-display text-sm font-bold', HORIZON_COLORS[activeHorizon])}>
              {doneCount}/{filtered.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-12 text-center"
          >
            <span className="text-4xl">🎯</span>
            <p className="font-display text-base font-semibold text-foreground">
              Nenhum objetivo aqui ainda
            </p>
            <p className="font-body text-sm text-muted-foreground max-w-[220px]">
              Define um objetivo de {HORIZON_LABELS[activeHorizon].toLowerCase()} e dá um passo em frente.
            </p>
            <Button
              variant="warm"
              size="sm"
              className="mt-2"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Criar objetivo
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Active goals first */}
            {filtered
              .sort((a, b) => Number(a.completed) - Number(b.completed))
              .map((goal, i) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  isPremium={isPremium}
                  index={i}
                  onEdit={setEditGoal}
                  onDelete={setDeleteGoal}
                />
              ))
            }

            {/* Free plan edit/delete hint */}
            {!isPremium && filtered.length > 0 && (
              <p className="pt-1 text-center font-body text-[10px] text-muted-foreground">
                ✨ Upgrade para Premium para editar e apagar objetivos
              </p>
            )}
          </div>
        )}
      </div>

      {/* FAB add button */}
      <motion.button
        className="fixed bottom-20 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-sunflower shadow-lg shadow-sunflower/30 text-white"
        whileTap={{ scale: 0.92 }}
        onClick={() => setAddOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Sheets / dialogs */}
      <AnimatePresence>
        {addOpen && (
          <AddGoalSheet
            key="add"
            defaultHorizon={activeHorizon}
            onClose={() => setAddOpen(false)}
          />
        )}
        {editGoal && (
          <EditGoalDialog
            key="edit"
            goal={editGoal}
            onClose={() => setEditGoal(null)}
          />
        )}
        {deleteGoal && (
          <DeleteConfirm
            key="delete"
            goal={deleteGoal}
            onClose={() => setDeleteGoal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
