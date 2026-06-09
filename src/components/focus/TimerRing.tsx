import { motion } from 'framer-motion'

interface TimerRingProps {
  progress: number   // 0–1 (1 = full, 0 = empty)
  size?: number
  color?: string
  children?: React.ReactNode
}

export function TimerRing({ progress, size = 260, color = 'hsl(43 80% 55%)', children }: TimerRingProps) {
  const stroke = size * 0.048
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const cx = size / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <motion.circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      {/* Inner content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
