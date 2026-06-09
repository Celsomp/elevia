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

// Per-state petal geometry (as fractions of `size`)
type PetalConfig = { count: number; ry: number; rx: number; dist: number }
const PETAL: Record<SunflowerHealth, PetalConfig> = {
  seed:     { count: 0,  ry: 0,     rx: 0,     dist: 0     },
  sprout:   { count: 0,  ry: 0,     rx: 0,     dist: 0     },
  young:    { count: 8,  ry: 0.095, rx: 0.036, dist: 0.082 },
  growing:  { count: 10, ry: 0.130, rx: 0.046, dist: 0.112 },
  blooming: { count: 12, ry: 0.155, rx: 0.052, dist: 0.132 },
  full:     { count: 14, ry: 0.175, rx: 0.058, dist: 0.148 },
  wilting:  { count: 9,  ry: 0.155, rx: 0.050, dist: 0.132 },
}

export function Sunflower({ health, className, size = 220 }: SunflowerProps) {
  const state = getSunflowerHealth(health)
  const isWilting = state === 'wilting'
  const petal = PETAL[state]

  const stemHeight   = { seed: 0,    sprout: 0.22, young: 0.48, growing: 0.66, blooming: 0.83, full: 1.0,  wilting: 1.0  }[state]
  const centerScale  = { seed: 0.15, sprout: 0.2,  young: 0.32, growing: 0.50, blooming: 0.64, full: 0.80, wilting: 0.70 }[state]
  const stemDroop    = isWilting ? -18 : 0
  const saturation   = isWilting ? 0.3 : 1

  const svgH = size
  const svgW = size
  const cx = svgW / 2
  const stemMaxH = svgH * 0.55
  const stemY2 = svgH * 0.96
  const stemY1 = stemY2 - stemMaxH * stemHeight
  const flowerY = stemY1

  const pr   = size * petal.ry
  const pd   = size * petal.dist
  const prx  = size * petal.rx

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

        {/* Leaves */}
        {stemHeight >= 0.48 && (
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
            {stemHeight >= 0.66 && (
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

        {/* Flower head */}
        {petal.count > 0 && (
          <motion.g
            style={{ originX: `${cx}px`, originY: `${flowerY}px` }}
            animate={{ rotate: stemDroop }}
            transition={{ type: 'spring', damping: 12 }}
          >
            {/* Petals */}
            {Array.from({ length: petal.count }, (_, i) => {
              const deg = (i / petal.count) * 360
              const rad = (deg * Math.PI) / 180
              return (
                <motion.ellipse
                  key={i}
                  cx={cx + Math.sin(rad) * pd}
                  cy={flowerY - Math.cos(rad) * pd}
                  rx={prx}
                  ry={pr}
                  fill={`hsl(43 ${Math.round(82 * saturation)}% ${isWilting ? 48 : 56}%)`}
                  transform={`rotate(${deg}, ${cx + Math.sin(rad) * pd}, ${flowerY - Math.cos(rad) * pd})`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.035, duration: 0.35, ease: 'backOut' }}
                />
              )
            })}

            {/* Centre disc */}
            <motion.circle
              cx={cx} cy={flowerY}
              r={size * centerScale * 0.18}
              fill={`hsl(25 ${Math.round(62 * saturation)}% 30%)`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', damping: 10 }}
            />
            {/* Centre highlight */}
            <motion.circle
              cx={cx - size * 0.02} cy={flowerY - size * 0.02}
              r={size * centerScale * 0.07}
              fill="hsla(0 0% 100% / 0.18)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35 }}
            />
          </motion.g>
        )}

        {/* Seed */}
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

      <p className="font-body text-xs font-medium text-muted-foreground">{STATE_LABELS[state]}</p>
    </div>
  )
}
