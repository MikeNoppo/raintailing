import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateToLocalISO(date?: Date | null): string | undefined {
  if (!date || Number.isNaN(date.getTime())) {
    return undefined
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().split("T")[0]
}
