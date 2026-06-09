import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type SunflowerHealth = 'seed' | 'sprout' | 'young' | 'growing' | 'blooming' | 'full' | 'wilting'

interface SunflowerProps {
  health: number   // 0–100
  className?: string
  size?: number
}

export function getSunflowerHealth(health: number): SunflowerHealth {
  if (health <= 5)  return 'seed'
  if (health <= 20) return 'sprout'
  if (health <= 40) return 'young'
  if (health <= 60) return 'growing'
  if (health <= 75) return 'blooming'
  if (health <= 100) return 'full'
  return 'full'
}

const STATE_LABELS: Record<SunflowerHealth, string> = {
  seed:     'Semente',
  sprout:   'Broto',
  young:    'A crescer',
  growing:  'Em crescimento',
  blooming: 'A florescer',
  full:     'Em pleno florescimento',
  wilting:  'A murchar',
}

export function Sunflower({ health, className, size = 220 }: SunflowerProps) {
  const state = getSunflowerHealth(health)
  const isWilting = state === 'wilting'

  // Visual parameters per state
  const stemHeight   = { seed: 0,    sprout: 0.2, young: 0.45, growing: 0.65, blooming: 0.82, full: 1.0,  wilting: 1.0  }[state]
  const petalCount   = { seed: 0,    sprout: 0,   young: 4,    growing: 8,    blooming: 10,   full: 13,   wilting: 8    }[state]
  const centerScale  = { seed: 0.15, sprout: 0.2, young: 0.35, growing: 0.5,  blooming: 0.65, full: 0.8,  wilting: 0.7  }[state]
  const stemDroop    = isWilting ? -18 : 0
  const saturation   = isWilting ? 0.3 : 1

  const svgH = size
  const svgW = size
  const cx = svgW / 2
  const stemMaxH = svgH * 0.55
  const stemY2 = svgH * 0.96
  const stemY1 = stemY2 - stemMaxH * stemHeight
  const flowerY = stemY1

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <motion.svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        aria-label={`Girassol: ${STATE_LABELS[state]}`}
      >
        {/* Stem */}
        <motion.line
          x1={cx} y1={stemY2}
          x2={cx} y2={stemY1}
          stroke={`hsl(100 ${Math.round(45 * saturation)}% 35%)`}
          strokeWidth={size * 0.035}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: stemHeight > 0 ? 1 : 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Leaves (only from 'young' onwards) */}
        {stemHeight >= 0.45 && (
          <>
            <motion.ellipse
              cx={cx - size * 0.12} cy={stemY2 - stemMaxH * 0.3}
              rx={size * 0.1} ry={size * 0.055}
              fill={`hsl(100 ${Math.round(45 * saturation)}% 42%)`}
              transform={`rotate(-35, ${cx - size * 0.12}, ${stemY2 - stemMaxH * 0.3})`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />
            {stemHeight >= 0.65 && (
              <motion.ellipse
                cx={cx + size * 0.12} cy={stemY2 - stemMaxH * 0.5}
                rx={size * 0.1} ry={size * 0.055}
                fill={`hsl(100 ${Math.round(45 * saturation)}% 42%)`}
                transform={`rotate(35, ${cx + size * 0.12}, ${stemY2 - stemMaxH * 0.5})`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              />
            )}
          </>
        )}

        {/* Flower head group */}
        {petalCount > 0 && (
          <motion.g
            style={{ originX: `${cx}px`, originY: `${flowerY}px` }}
            animate={{ rotate: stemDroop }}
            transition={{ type: 'spring', damping: 12 }}
          >
            {/* Petals */}
            {Array.from({ length: petalCount }, (_, i) => {
              const angle = (i / petalCount) * 360
              const pr = size * 0.175
              const pd = size * 0.145
              return (
                <motion.ellipse
                  key={i}
                  cx={cx + Math.sin((angle * Math.PI) / 180) * pd}
                  cy={flowerY - Math.cos((angle * Math.PI) / 180) * pd}
                  rx={size * 0.055}
                  ry={pr}
                  fill={`hsl(43 ${Math.round(80 * saturation)}% ${isWilting ? 50 : 58}%)`}
                  transform={`rotate(${angle}, ${cx + Math.sin((angle * Math.PI) / 180) * pd}, ${flowerY - Math.cos((angle * Math.PI) / 180) * pd})`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.35, ease: 'backOut' }}
                />
              )
            })}

            {/* Centre disc */}
            <motion.circle
              cx={cx} cy={flowerY}
              r={size * centerScale * 0.18}
              fill={`hsl(25 ${Math.round(60 * saturation)}% 30%)`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            />
            {/* Centre highlight */}
            <motion.circle
              cx={cx - size * 0.02} cy={flowerY - size * 0.02}
              r={size * centerScale * 0.07}
              fill="hsla(0 0% 100% / 0.18)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
            />
          </motion.g>
        )}

        {/* Seed state */}
        {state === 'seed' && (
          <motion.ellipse
            cx={cx} cy={stemY2 - size * 0.04}
            rx={size * 0.06} ry={size * 0.04}
            fill="hsl(43 60% 45%)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          />
        )}
      </motion.svg>

      {/* State label */}
      <p className="font-body text-xs font-medium text-muted-foreground">{STATE_LABELS[state]}</p>
    </div>
  )
}
