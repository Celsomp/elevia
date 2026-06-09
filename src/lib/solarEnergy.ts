export const STAGE_THRESHOLDS = [0, 5, 25, 60, 120, 200, 300] as const

export type SunflowerStage = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const FREE_ENERGY_CAP = 100

export const STAGE_NAMES: Record<SunflowerStage, string> = {
  0: 'Semente',
  1: 'Pequeno Rebento',
  2: 'Planta Jovem',
  3: 'Em Crescimento',
  4: 'Girassol Forte',
  5: 'Girassol Florido',
  6: 'Jardim de Girassóis',
}

export function calculateStage(energy: number): SunflowerStage {
  let stage: SunflowerStage = 0
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (energy >= STAGE_THRESHOLDS[i]) stage = i as SunflowerStage
    else break
  }
  return stage
}

export function energyToNextStage(energy: number) {
  const stage = calculateStage(energy)
  if (stage >= 6) return null
  const nextThreshold = STAGE_THRESHOLDS[stage + 1] as number
  const thisThreshold = STAGE_THRESHOLDS[stage] as number
  return {
    stage,
    next: nextThreshold,
    needed: nextThreshold - energy,
    progressPercent: Math.round(
      ((energy - thisThreshold) / (nextThreshold - thisThreshold)) * 100
    ),
  }
}

export const ENERGY_REWARDS = {
  focus25: 10,
  focus45: 20,
  focus60: 30,
  mission: 10,
  reflection: 10,
} as const
