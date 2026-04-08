// Toujours utiliser UTC pour les dates de défi

export function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

export function secondsUntilMidnightUTC(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}
