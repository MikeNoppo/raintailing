/**
 * Date utility functions for handling date parsing and formatting
 * All dates are handled in UTC to avoid timezone issues
 */

/**
 * Parse date string (YYYY-MM-DD) to Date object in UTC
 * @param value - Date string in YYYY-MM-DD format
 * @param options - Options for parsing
 * @returns Date object in UTC or undefined if invalid
 */
export function parseDateOnly(
  value: string | null | undefined,
  options?: { endOfDay?: boolean }
): Date | undefined {
  if (!value) {
    return undefined
  }

  const parts = value.split('-').map(Number)
  const [year, month, day] = parts

  if (!year || !month || !day) {
    return undefined
  }

  if (options?.endOfDay) {
    // Set to end of day (23:59:59.999)
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
  }

  // Set to start of day (00:00:00.000)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

/**
 * Parse ISO date string to Date object
 * @param value - ISO date string
 * @returns Date object or undefined if invalid
 */
export function parseISODate(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return isNaN(date.getTime()) ? undefined : date
}

/**
 * Get start of day in UTC
 * @param date - Date object or date string
 * @returns Date object set to start of day
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    0, 0, 0, 0
  ))
}

/**
 * Get end of day in UTC
 * @param date - Date object or date string
 * @returns Date object set to end of day
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    23, 59, 59, 999
  ))
}

/**
 * Get start of month in UTC
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Date object set to start of month
 */
export function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
}

/**
 * Get end of month in UTC
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Date object set to end of month
 */
export function endOfMonth(year: number, month: number): Date {
  // Get last day of month by getting day 0 of next month
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999))
}

/**
 * Get start of year in UTC
 * @param year - Year
 * @returns Date object set to start of year
 */
export function startOfYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
}

/**
 * Get end of year in UTC
 * @param year - Year
 * @returns Date object set to end of year
 */
export function endOfYear(year: number): Date {
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
}

/**
 * Format date to YYYY-MM-DD string
 * @param date - Date object or date string
 * @returns Formatted date string
 */
export function formatDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format date to Indonesian locale string
 * @param date - Date object or date string
 * @returns Formatted date string (e.g., "25 Oktober 2024")
 */
export function formatDateIndonesian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Format date to short Indonesian locale string
 * @param date - Date object or date string
 * @returns Formatted date string (e.g., "25/10/2024")
 */
export function formatDateShortIndonesian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID')
}

/**
 * Check if date is valid
 * @param date - Date object or date string
 * @returns True if date is valid
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = typeof date === 'string' ? new Date(date) : date
  return !isNaN(d.getTime())
}

/**
 * Get current timestamp in ISO format
 * @returns ISO timestamp string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns Date string
 */
export function getCurrentDateString(): string {
  return formatDateOnly(new Date())
}

/**
 * Add days to a date
 * @param date - Date object or date string
 * @param days - Number of days to add (can be negative)
 * @returns New Date object
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

/**
 * Get difference between two dates in days
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days difference
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Parse date range from strings
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Object with start and end Date objects or undefined
 */
export function parseDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): { start?: Date; end?: Date } {
  return {
    start: parseDateOnly(startDate),
    end: parseDateOnly(endDate, { endOfDay: true })
  }
}
