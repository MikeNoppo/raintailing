import useSWR from 'swr'

// Types
interface ClassificationDataResponse {
  success: boolean
  data: {
    chartData: Array<{
      name: string
      value: number
      percentage: number
      color: string
      emoji: string
      description: string
      category: string
    }>
    summary: {
      totalDays: number
      totalRainfall: number
      averageRainfall: number
      mostCommonCategory: string
      distributionCounts: {
        tidakHujan: number
        ringan: number
        sedang: number
        lebat: number
      }
    }
    filters: {
      location: string
      startDate?: string
      endDate?: string
      appliedFilters: {
        hasLocationFilter: boolean
        hasDateFilter: boolean
      }
    }
  }
}

interface ClassificationFilters {
  location?: string
  startDate?: string
  endDate?: string
}

// Fetcher function
const fetcher = async (url: string): Promise<ClassificationDataResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// Hook to fetch rainfall classification data
export function useRainfallClassification(filters: ClassificationFilters = {}) {
  // Build query parameters
  const params = new URLSearchParams()
  
  if (filters.location && filters.location !== 'all') {
    params.append('location', filters.location)
  }
  
  if (filters.startDate) {
    params.append('startDate', filters.startDate)
  }
  
  if (filters.endDate) {
    params.append('endDate', filters.endDate)
  }

  // Create the API URL
  const url = `/api/analytics/classification${params.toString() ? `?${params.toString()}` : ''}`

  // Use SWR for data fetching with auto-refresh
  const { data, error, isLoading, mutate } = useSWR<ClassificationDataResponse>(
    url,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      errorRetryCount: 3,
      errorRetryInterval: 2000,
    }
  )

  return {
    data: data?.data,
    error,
    isLoading,
    mutate,
    // Convenience properties
    chartData: data?.data?.chartData || [],
    summary: data?.data?.summary,
    hasData: (data?.data?.chartData?.length || 0) > 0,
    isEmpty: !isLoading && !error && (data?.data?.chartData?.length || 0) === 0
  }
}

// Hook for real-time classification statistics
export function useClassificationStats(filters: ClassificationFilters = {}) {
  const { data, error, isLoading, summary } = useRainfallClassification(filters)

  return {
    isLoading,
    error,
    stats: summary ? {
      totalDays: summary.totalDays,
      totalRainfall: summary.totalRainfall,
      averageRainfall: summary.averageRainfall,
      mostCommonCategory: summary.mostCommonCategory,
      distributionCounts: summary.distributionCounts,
      // Additional calculated stats
      rainyDays: summary.distributionCounts.ringan + summary.distributionCounts.sedang + summary.distributionCounts.lebat,
      dryDays: summary.distributionCounts.tidakHujan,
      heavyRainDays: summary.distributionCounts.lebat,
      rainyDaysPercentage: summary.totalDays > 0 
        ? parseFloat((((summary.distributionCounts.ringan + summary.distributionCounts.sedang + summary.distributionCounts.lebat) / summary.totalDays) * 100).toFixed(1))
        : 0
    } : null
  }
}
