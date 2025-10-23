import useSWR from 'swr'

// Types
interface AvailableDatesPayload {
  months: Array<{
    year: number
    month: number
    count: number
  }>
  total: number
}

interface AvailableDatesResponse {
  success: boolean
  data: AvailableDatesPayload
  message?: string
  meta?: Record<string, unknown>
}

interface AvailableDatesFilters {
  location?: string
}

// Fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch available dates')
  }
  return response.json()
}

// Hook for fetching available dates
export function useAvailableDates(filters: AvailableDatesFilters = {}) {
  const queryParams = new URLSearchParams()
  
  if (filters.location && filters.location !== 'all') {
    queryParams.append('location', filters.location)
  }

  const queryString = queryParams.toString()
  const url = `/api/rainfall/available-dates${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<AvailableDatesResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0, // No auto-refresh by default
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  return {
    data: data?.data?.months || [],
    total: data?.data?.total || 0,
    error,
    isLoading,
    refetch: mutate,
  }
}

// Helper function to get available years
export function getAvailableYears(months: Array<{ year: number; month: number; count: number }>) {
  const years = [...new Set(months.map(m => m.year))].sort((a, b) => b - a)
  return years
}

// Helper function to get available months for a specific year
export function getAvailableMonthsForYear(
  months: Array<{ year: number; month: number; count: number }>,
  year: number
) {
  return months
    .filter(m => m.year === year)
    .sort((a, b) => b.month - a.month) // Sort months descending
}

// Helper function to get month name in Indonesian
export function getIndonesianMonthName(month: number): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return monthNames[month - 1] || 'Unknown'
}
