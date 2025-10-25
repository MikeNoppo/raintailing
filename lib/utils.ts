import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Re-export date helpers for convenience
export * from './utils/date-helpers'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to local ISO string (YYYY-MM-DD)
 * This function handles timezone offset, useful for form inputs
 * For UTC-based date formatting, use formatDateOnly from date-helpers
 */
export function formatDateToLocalISO(date?: Date | null): string | undefined {
  if (!date || Number.isNaN(date.getTime())) {
    return undefined
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().split("T")[0]
}
