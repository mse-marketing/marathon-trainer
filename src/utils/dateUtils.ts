import { format, differenceInDays, isToday, isTomorrow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'dd. MMM yyyy', { locale: de });
}

export function formatWeekday(isoString: string): string {
  return format(parseISO(isoString), 'EEEE', { locale: de });
}

export function formatShortWeekday(dayIndex: number): string {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  return days[dayIndex] || '';
}

export function getDaysUntil(isoString: string): number {
  return differenceInDays(parseISO(isoString), new Date());
}

export function isWorkoutToday(isoString: string): boolean {
  return isToday(parseISO(isoString));
}

export function isWorkoutTomorrow(isoString: string): boolean {
  return isTomorrow(parseISO(isoString));
}

export function getRelativeDay(isoString: string): string {
  if (isWorkoutToday(isoString)) return 'Heute';
  if (isWorkoutTomorrow(isoString)) return 'Morgen';
  return formatWeekday(isoString);
}
