import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { STAGE_NAMES, type SunflowerStage } from '@/lib/solarEnergy'

interface SunflowerProps {
  stage: SunflowerStage  // 0–6
  className?: string
  size?: number
}

type PetalConfig = { count: number; ry: number; rx: number; dist: number }

const STAGE_PETALS: Record<SunflowerStage, PetalConfig> = {
  0: { count: 0,  ry: 0,     rx: 0,     dist: 0     },
  1: { count: 0,  ry: 0,     rx: 0,     dist: 0     },
  2: { count: 8,  ry: 0.095, rx: 0.036, dist: 0.082 },
  3: { count: 10, ry: 0.130, rx: 0.046, dist: 0.112 },
  4: { count: 12, ry: 0.155, rx: 0.052, dist: 0.132 },
  5: { count: 14, ry: 0.175, rx: 0.058, dist: 0.148 },
  6: { count: 16, ry: 0.182, rx: 0.062, dist: 0.155 },
}

const STEM_HEIGHT: Record<SunflowerStage, number> = {
  0: 0,    1: 0.22, 2: 0.48, 3: 0.66,
  4: 0.83, 5: 1.0,  6: 1.0,
}

const CENTER_SCALE: Record<SunflowerStage, number> = {
  0: 0.15, 1: 0.2,  2: 0.32, 3: 0.50,
  4: 0.64, 5: 0.80, 6: 0.88,
}

export function Sunflower({ stage, className, size = 220 }: SunflowerProps) {
  const petal      = STAGE_PETALS[stage]
  const stemHeight = STEM_HEIGHT[stage]
  const cScale     = CENTER_SCALE[stage]
  const isGarden   = stage === 6

  const cx        = size / 2
  const stemMaxH  = size * 0.55
  const stemY2    = size * 0.96
  const stemY1    = stemY2 - stemMaxH * stemHeight
  const flowerY   = stemY1

  const pr  = size * petal.ry
  const pd  = size * petal.dist
  const prx = size * petal.rx

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Girassol: ${STAGE_NAMES[stage]}`}
        style={{ overflow: 'visible' }}
      >
        {/* Stage 6: golden aura behind flower */}
        {isGarden && (
          <>
            <defs>
              <radialGradient id="goldAura">
                <stop offset="0%"   stopColor="#E8B931" stopOpacity="0.45" />
                <stop offset="60%"  stopColor="#E8B931" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#E8B931" stopOpacity="0" />
              </radialGradient>
            </defs>
            <motion.circle
              cx={cx} cy={flowerY}
              r={size * 0.44}
              fill="url(#goldAura)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.06, 1], opacity: 1 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{ originX: `${cx}px`, originY: `${flowerY}px` }}
            />
          </>
        )}

        {/* Stem */}
        <motion.line
          x1={cx} y1={stemY2}
          x2={cx} y2={stemY1}
          stroke="hsl(100 45% 35%)"
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
              fill="hsl(100 45% 42%)"
              transform={`rotate(-35, ${cx - size * 0.12}, ${stemY2 - stemMaxH * 0.3})`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />
            {stemHeight >= 0.66 && (
              <motion.ellipse
                cx={cx + size * 0.12} cy={stemY2 - stemMaxH * 0.5}
                rx={size * 0.1} ry={size * 0.055}
                fill="hsl(100 45% 42%)"
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
          <motion.g>
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
                  fill={isGarden ? 'hsl(43 90% 58%)' : 'hsl(43 82% 56%)'}
                  transform={`rotate(${deg}, ${cx + Math.sin(rad) * pd}, ${flowerY - Math.cos(rad) * pd})`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.03, duration: 0.35, ease: 'backOut' }}
                />
              )
            })}

            {/* Centre disc */}
            <motion.circle
              cx={cx} cy={flowerY}
              r={size * cScale * 0.18}
              fill={isGarden ? 'hsl(25 65% 28%)' : 'hsl(25 62% 30%)'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', damping: 10 }}
            />
            {/* Centre highlight */}
            <motion.circle
              cx={cx - size * 0.02} cy={flowerY - size * 0.02}
              r={size * cScale * 0.07}
              fill="hsla(0 0% 100% / 0.18)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35 }}
            />

            {/* Stage 6: star sparkles */}
            {isGarden && (
              <>
                {[[-0.28, -0.28], [0.28, -0.28], [0, -0.38]].map(([dx, dy], i) => (
                  <motion.text
                    key={i}
                    x={cx + size * dx}
                    y={flowerY + size * dy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={size * 0.1}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
                    style={{ originX: `${cx + size * dx}px`, originY: `${flowerY + size * dy}px` }}
                  >
                    ✦
                  </motion.text>
                ))}
              </>
            )}
          </motion.g>
        )}

        {/* Seed */}
        {stage === 0 && (
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

      <p className="font-body text-xs font-medium text-muted-foreground">{STAGE_NAMES[stage]}</p>
    </div>
  )
}
