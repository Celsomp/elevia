import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Trash2, Lock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  useReflections,
  useWeeklyReflectionCount,
  useCanReflect,
  useSaveReflection,
  useDeleteReflection,
  getWeeklyPrompt,
  FREE_WEEKLY_LIMIT,
  type Reflection,
} from '@/hooks/useReflections'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type View = 'list' | 'write' | 'detail'

export default function Reflections() {
  const { profile } = useAuth()
  const isPremium = profile?.plan === 'premium'
  const { data: reflections = [], isLoading } = useReflections()
  const { data: weekCount = 0 } = useWeeklyReflectionCount()
  const canReflect = useCanReflect(isPremium)

  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<Reflection | null>(null)

  function openDetail(r: Reflection) {
    setSelected(r)
    setView('detail')
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <ListView
            key="list"
            reflections={reflections}
            isLoading={isLoading}
            weekCount={weekCount}
            isPremium={isPremium}
            canReflect={canReflect}
            onWrite={() => setView('write')}
            onDetail={openDetail}
          />
        )}
        {view === 'write' && (
          <WriteView
            key="write"
            onBack={() => setView('list')}
            onSaved={() => setView('list')}
          />
        )}
        {view === 'detail' && selected && (
          <DetailView
            key="detail"
            reflection={selected}
            onBack={() => setView('list')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── LIST ─────────────────────────────────────────────────────────
interface ListViewProps {
  reflections: Reflection[]
  isLoading: boolean
  weekCount: number
  isPremium: boolean
  canReflect: boolean
  onWrite: () => void
  onDetail: (r: Reflection) => void
}

function ListView({ reflections, isLoading, weekCount, isPremium, canReflect, onWrite, onDetail }: ListViewProps) {
  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <header className="px-5 pt-10 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Reflexões</h1>
        <p className="font-body text-sm text-muted-foreground">
          O teu diário de crescimento interior.
        </p>
      </header>

      {/* Weekly limit indicator */}
      {!isPremium && (
        <div className="mx-5 mb-4 flex items-center justify-between rounded-xl bg-muted/60 px-4 py-2.5">
          <span className="font-body text-xs text-muted-foreground">
            Esta semana: {weekCount}/{FREE_WEEKLY_LIMIT} reflexões
          </span>
          <div className="flex gap-1">
            {Array.from({ length: FREE_WEEKLY_LIMIT }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full',
                  i < weekCount ? 'bg-sunflower' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Write button */}
      <div className="px-5 mb-5">
        {canReflect ? (
          <Button variant="warm" size="lg" className="w-full gap-2" onClick={onWrite}>
            <Plus className="h-4 w-4" />
            Nova reflexão
          </Button>
        ) : (
          <Link to="/premium" className="block rounded-2xl border border-dashed border-sunflower/30 bg-sunflower/5 p-4 text-center transition-colors hover:border-sunflower/50">
            <Lock className="mx-auto mb-1.5 h-4 w-4 text-sunflower-dark" />
            <p className="font-body text-sm font-medium text-sunflower-dark">
              Limite semanal atingido
            </p>
            <p className="mt-0.5 font-body text-xs text-muted-foreground">
              Toca para fazer upgrade Premium →
            </p>
          </Link>
        )}
      </div>

      {/* List */}
      <div className="flex-1 px-5 pb-8">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : reflections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 text-5xl">📓</div>
            <p className="font-display text-lg font-semibold text-foreground">Sem reflexões ainda</p>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Escreve a tua primeira reflexão guiada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reflections.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onDetail(r)}
                className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm hover:border-sunflower/30 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {r.prompt && (
                      <p className="font-body text-xs font-medium text-sunflower-dark mb-1 truncate">
                        {r.prompt}
                      </p>
                    )}
                    <p className="font-body text-sm text-foreground line-clamp-2">{r.content}</p>
                    <p className="mt-2 font-body text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('pt-PT', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── WRITE ────────────────────────────────────────────────────────
function WriteView({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const prompt = getWeeklyPrompt()
  const [content, setContent] = useState('')
  const [usePrompt, setUsePrompt] = useState(true)
  const saveReflection = useSaveReflection()

  async function handleSave() {
    if (!content.trim()) return
    await saveReflection.mutateAsync({
      prompt: usePrompt ? prompt : null,
      content: content.trim(),
    })
    onSaved()
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground flex-1">Nova reflexão</h1>
        <span className="font-body text-xs text-muted-foreground">{wordCount} palavras</span>
      </header>

      {/* Prompt toggle */}
      <div className="mx-5 mb-4 rounded-2xl bg-sunflower/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-sunflower-dark mb-1">
              Prompt da semana
            </p>
            <p className={cn('font-display text-sm font-medium text-foreground italic', !usePrompt && 'opacity-40')}>
              "{prompt}"
            </p>
          </div>
          <button
            onClick={() => setUsePrompt(u => !u)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 font-body text-xs font-medium transition-colors',
              usePrompt ? 'bg-sunflower text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {usePrompt ? 'Usar' : 'Ignorar'}
          </button>
        </div>
      </div>

      {/* Text area */}
      <div className="flex-1 px-5 pb-6">
        <textarea
          autoFocus
          placeholder="Escreve livremente, sem julgamento…"
          value={content}
          onChange={e => setContent(e.target.value)}
          className="h-full min-h-[240px] w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
        />
      </div>

      {/* Save */}
      <div className="px-5 pb-8">
        <Button
          variant="warm"
          size="lg"
          className="w-full"
          disabled={!content.trim() || saveReflection.isPending}
          onClick={handleSave}
        >
          {saveReflection.isPending ? 'A guardar…' : 'Guardar reflexão'}
        </Button>
      </div>
    </motion.div>
  )
}

// ─── DETAIL ───────────────────────────────────────────────────────
function DetailView({ reflection, onBack }: { reflection: Reflection; onBack: () => void }) {
  const deleteReflection = useDeleteReflection()

  async function handleDelete() {
    await deleteReflection.mutateAsync(reflection.id)
    onBack()
  }

  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
    >
      <header className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <p className="flex-1 font-body text-sm text-muted-foreground">
          {new Date(reflection.created_at).toLocaleDateString('pt-PT', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
        <button
          onClick={handleDelete}
          disabled={deleteReflection.isPending}
          className="rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 px-5 pb-8">
        {reflection.prompt && (
          <div className="mb-4 rounded-2xl bg-sunflower/10 px-4 py-3">
            <p className="font-display text-sm italic font-medium text-sunflower-dark">
              "{reflection.prompt}"
            </p>
          </div>
        )}
        <p className="font-body text-base leading-relaxed text-foreground whitespace-pre-wrap">
          {reflection.content}
        </p>
      </div>
    </motion.div>
  )
}
