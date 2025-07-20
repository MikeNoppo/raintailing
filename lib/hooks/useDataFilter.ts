import { useState, useCallback, useMemo } from 'react'
import type { RainfallData, FilterOptions, DateRange } from '@/lib/types'

/**
 * Custom hook for managing filter state and data filtering
 */
export function useDataFilter(data: RainfallData[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    location: 'all'
  })

  // Memoized filtered data
  const filteredData = useMemo(() => {
    let result = data

    // Apply location filter
    if (filters.location && filters.location !== 'all') {
      result = result.filter(item => item.location === filters.location)
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange.from && filters.dateRange.to) {
      result = result.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= filters.dateRange!.from && itemDate <= filters.dateRange!.to
      })
    }

    return result
  }, [data, filters])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [])

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({ location: 'all' })
  }, [])

  // Set location filter
  const setLocationFilter = useCallback((location: string) => {
    updateFilters({ location })
  }, [updateFilters])

  // Set date range filter
  const setDateRangeFilter = useCallback((dateRange: DateRange | undefined) => {
    updateFilters({ dateRange })
  }, [updateFilters])

  // Quick date filters
  const applyQuickDateFilter = useCallback((days: number) => {
    const today = new Date()
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    setDateRangeFilter({ from: startDate, to: today })
  }, [setDateRangeFilter])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.location !== 'all' || !!filters.dateRange
  }, [filters])

  return {
    filters,
    filteredData,
    updateFilters,
    resetFilters,
    setLocationFilter,
    setDateRangeFilter,
    applyQuickDateFilter,
    hasActiveFilters
  }
}
