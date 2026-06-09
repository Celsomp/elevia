import { motion } from 'framer-motion'
import { LIFE_AREAS, type ScoresMap } from '@/lib/lifeAreas'

const N = LIFE_AREAS.length
const SIZE = 280
const CX = SIZE / 2
const CY = SIZE / 2
const R = 96          // max data radius
const LABEL_R = 123   // emoji label radius

function angle(i: number) {
  return (i / N) * 2 * Math.PI - Math.PI / 2
}

function polar(r: number, i: number) {
  const a = angle(i)
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

function gridPoints(level: number) {
  return LIFE_AREAS.map((_, i) => {
    const { x, y } = polar((level / 10) * R, i)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

interface LifeWheelChartProps {
  scores: ScoresMap
  animated?: boolean
  className?: string
}

export function LifeWheelChart({ scores, animated = true, className }: LifeWheelChartProps) {
  const dataPoints = LIFE_AREAS.map((area, i) => {
    const score = scores[area.key] ?? 0
    return { ...polar((score / 10) * R, i), score, area, i }
  })

  const dataPolygon = dataPoints.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      aria-label="Roda da Vida"
      style={{ overflow: 'visible' }}
    >
      {/* Grid rings */}
      {[2, 4, 6, 8, 10].map(lvl => (
        <polygon
          key={lvl}
          points={gridPoints(lvl)}
          fill="none"
          stroke="currentColor"
          strokeWidth={lvl === 10 ? 1 : 0.5}
          opacity={lvl === 10 ? 0.25 : 0.15}
          className="text-foreground"
        />
      ))}

      {/* Spokes */}
      {LIFE_AREAS.map((_, i) => {
        const end = polar(R, i)
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={end.x} y2={end.y}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.18"
            className="text-foreground"
          />
        )
      })}

      {/* Data polygon */}
      {animated ? (
        <motion.polygon
          points={dataPolygon}
          fill="#E8B931"
          fillOpacity="0.22"
          stroke="#E8B931"
          strokeWidth="2.5"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ originX: `${CX}px`, originY: `${CY}px` }}
          transition={{ duration: 0.6, ease: [0.34, 1.2, 0.64, 1] }}
        />
      ) : (
        <polygon
          points={dataPolygon}
          fill="#E8B931"
          fillOpacity="0.22"
          stroke="#E8B931"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}

      {/* Score dots */}
      {dataPoints.map(p => (
        <motion.circle
          key={p.area.key}
          cx={p.x} cy={p.y}
          r="5"
          fill="#E8B931"
          stroke="white"
          strokeWidth="1.5"
          initial={animated ? { scale: 0, opacity: 0 } : undefined}
          animate={animated ? { scale: 1, opacity: 1 } : undefined}
          transition={{ delay: p.i * 0.05 + 0.3, duration: 0.3, type: 'spring' }}
        />
      ))}

      {/* Emoji labels */}
      {LIFE_AREAS.map((area, i) => {
        const { x, y } = polar(LABEL_R, i)
        return (
          <text
            key={area.key}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
          >
            {area.emoji}
          </text>
        )
      })}

      {/* Score labels (small, just outside each dot) */}
      {dataPoints.map(p => {
        if (p.score === 0) return null
        const a = angle(p.i)
        const lr = (p.score / 10) * R + 13
        const lx = CX + lr * Math.cos(a)
        const ly = CY + lr * Math.sin(a)
        return (
          <motion.text
            key={p.area.key}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fontWeight="700"
            fill="#B8871C"
            initial={animated ? { opacity: 0 } : undefined}
            animate={animated ? { opacity: 1 } : undefined}
            transition={{ delay: p.i * 0.05 + 0.5 }}
          >
            {p.score}
          </motion.text>
        )
      })}
    </svg>
  )
}
