import useSWR from 'swr'

interface AvailableDatesPayload {
  latestDate: string | null
  earliestDate: string | null
  latestMonth: string | null
  earliestMonth: string | null
  totalRecords: number
  months: Array<{
    year: number
    month: number
    count: number
  }>
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

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch available dates')
  }
  return response.json()
}

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
      refreshInterval: 30000,
      dedupingInterval: 10000,
    }
  )

  return {
    data: data?.data || null,
    months: data?.data?.months || [],
    latestMonth: data?.data?.latestMonth || null,
    earliestMonth: data?.data?.earliestMonth || null,
    latestDate: data?.data?.latestDate || null,
    earliestDate: data?.data?.earliestDate || null,
    totalRecords: data?.data?.totalRecords || 0,
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
