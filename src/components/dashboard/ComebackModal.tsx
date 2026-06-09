import { motion } from 'framer-motion'
import { Sunflower } from '@/components/sunflower/Sunflower'
import { Button } from '@/components/ui/button'

const HELIA_MESSAGES = [
  'Voltaste. Isso é tudo o que importa — não onde paraste, mas que decidiste voltar.',
  'O teu girassol inclinou-se um pouco, mas as raízes continuam fortes. Vamos crescer juntos de novo?',
  'Ausências fazem parte do caminho. O que importa é este momento: escolhiste voltar.',
  'Nenhum julgamento aqui — só alegria por te ver de volta. Recomeçamos?',
  'Até os girassóis têm dias de chuva. O teu voltou para ficar.',
]

const FIRST_STEPS = [
  'Faz apenas 5 minutos de foco — só isso.',
  'Escreve uma palavra sobre como te sentes agora.',
  'Respira fundo 3 vezes e volta ao ritmo.',
  'Bebe um copo de água e marca presença.',
  'Diz a ti mesmo: "Voltei, e isso é suficiente."',
]

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

interface ComebackModalProps {
  daysSince: number
  onDismiss: () => void
}

export function ComebackModal({ daysSince, onDismiss }: ComebackModalProps) {
  const seed = daysSince
  const message = pick(HELIA_MESSAGES, seed)
  const firstStep = pick(FIRST_STEPS, seed + 1)

  return (
    /* Backdrop */
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Bottom sheet card */}
      <motion.div
        className="mb-6 w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      >
        {/* Sunflower */}
        <div className="flex justify-center mb-4">
          <Sunflower health={8} size={120} />
        </div>

        {/* Days away */}
        <motion.p
          className="text-center font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {daysSince} {daysSince === 1 ? 'dia' : 'dias'} depois…
        </motion.p>

        {/* Title */}
        <motion.h2
          className="text-center font-display text-2xl font-bold text-foreground mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Voltaste. 🌱
        </motion.h2>

        {/* Helia message */}
        <motion.div
          className="mb-4 rounded-2xl bg-sunflower/10 px-4 py-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-start gap-2">
            <span className="text-base shrink-0">🌻</span>
            <p className="font-body text-sm text-foreground leading-relaxed italic">
              "{message}"
            </p>
          </div>
        </motion.div>

        {/* First step */}
        <motion.div
          className="mb-5 rounded-2xl border border-dashed border-border px-4 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Primeiro passo de hoje
          </p>
          <p className="font-body text-sm text-foreground">{firstStep}</p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            variant="warm"
            size="lg"
            className="w-full"
            onClick={onDismiss}
          >
            Aceitar o recomeço 🌻
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
