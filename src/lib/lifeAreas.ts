export type LifeAreaKey =
  | 'career'
  | 'health'
  | 'relationships'
  | 'finances'
  | 'personal_growth'
  | 'leisure'
  | 'environment'
  | 'family'

export interface LifeArea {
  key: LifeAreaKey
  label: string
  emoji: string
  description: string
  color: string
}

export const LIFE_AREAS: LifeArea[] = [
  { key: 'career',          label: 'Carreira',            emoji: '💼', description: 'Trabalho, propósito e realização profissional',     color: 'hsl(220 70% 60%)' },
  { key: 'health',          label: 'Saúde',               emoji: '💪', description: 'Corpo, energia e bem-estar físico',                 color: 'hsl(100 55% 48%)' },
  { key: 'relationships',   label: 'Relações',             emoji: '❤️', description: 'Amizades, parceiro e vida social',                  color: 'hsl(350 75% 58%)' },
  { key: 'finances',        label: 'Finanças',             emoji: '💰', description: 'Segurança financeira e gestão do dinheiro',         color: 'hsl(43 80% 52%)' },
  { key: 'personal_growth', label: 'Crescimento Pessoal',  emoji: '🌱', description: 'Aprendizagem, espiritualidade e auto-conhecimento', color: 'hsl(160 55% 42%)' },
  { key: 'leisure',         label: 'Lazer',                emoji: '🎨', description: 'Hobbies, descanso e diversão',                     color: 'hsl(280 60% 60%)' },
  { key: 'environment',     label: 'Ambiente',             emoji: '🏡', description: 'Casa, espaço e ambiente de vida',                  color: 'hsl(28 80% 55%)' },
  { key: 'family',          label: 'Família',              emoji: '👨‍👩‍👧', description: 'Relações familiares próximas',                   color: 'hsl(200 65% 52%)' },
]

export type ScoresMap = Partial<Record<LifeAreaKey, number>>

/** Returns the 3 areas with the lowest scores */
export function getWeakestAreas(scores: ScoresMap, count = 3): LifeArea[] {
  return LIFE_AREAS
    .filter(a => scores[a.key] !== undefined)
    .sort((a, b) => (scores[a.key] ?? 10) - (scores[b.key] ?? 10))
    .slice(0, count)
}
