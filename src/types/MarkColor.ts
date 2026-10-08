export const MARK_COLORS = [
  'RED',
  'BLUE',
  'GREEN',
  'YELLOW',
  'ORANGE',
  'PURPLE',
  'BLACK',
  'WHITE',
] as const

export type MarkColor = (typeof MARK_COLORS)[number]
