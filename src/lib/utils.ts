import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isPast, isFuture, differenceInDays, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  if (!dateString) return '-';
  // Standardize to Thai format: DD MMM YYYY (e.g., 10 เม.ย. 2026)
  return format(new Date(dateString), 'dd MMM yyyy', { locale: th });
}

export function getDateStatus(dateString: string) {
  const date = startOfDay(new Date(dateString));
  const today = startOfDay(new Date());
  
  if (isToday(date)) return 'TODAY';
  if (isPast(date)) return 'OVERDUE';
  return 'FUTURE';
}

export function getDaysDiff(dateString: string) {
  const date = startOfDay(new Date(dateString));
  const today = startOfDay(new Date());
  return differenceInDays(date, today);
}
