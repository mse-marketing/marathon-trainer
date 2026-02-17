/**
 * Formatiert Sekunden pro Kilometer als "m:ss"
 */
export function formatPace(secPerKm: number): string {
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formatiert eine Pace-Range als "m:ss - m:ss /km"
 */
export function formatPaceRange(min: number, max: number): string {
  return `${formatPace(min)} - ${formatPace(max)} /km`;
}

/**
 * Formatiert Minuten als "h:mm" oder "mm min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${m.toString().padStart(2, '0')}h`;
}

/**
 * Formatiert Minuten als Marathon-Zielzeit "h:mm:ss"
 */
export function formatGoalTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  const s = Math.round((totalMinutes % 1) * 60);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
