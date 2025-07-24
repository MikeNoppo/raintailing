import type { RainfallData, RainfallDataDB } from '@/lib/types'

// Transform database format to chart format
export function transformRainfallDataForCharts(
  dbData: RainfallDataDB[]
): RainfallData[] {
  return dbData.map(item => ({
    date: typeof item.date === 'string' ? item.date : item.date.toISOString().split('T')[0],
    rainfall: item.rainfall,
    location: item.location.code
  }))
}

// Group data by location
export function groupRainfallDataByLocation(
  data: RainfallData[]
): Record<string, RainfallData[]> {
  return data.reduce((acc, item) => {
    if (!acc[item.location]) {
      acc[item.location] = []
    }
    acc[item.location].push(item)
    return acc
  }, {} as Record<string, RainfallData[]>)
}

// Filter data by date range
export function filterRainfallDataByDateRange(
  data: RainfallData[],
  startDate?: string,
  endDate?: string
): RainfallData[] {
  if (!startDate && !endDate) return data

  return data.filter(item => {
    const itemDate = item.date
    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false
    return true
  })
}

// Filter data by location
export function filterRainfallDataByLocation(
  data: RainfallData[],
  location?: string
): RainfallData[] {
  if (!location || location === 'all') return data
  return data.filter(item => item.location === location)
}

// Get date range for the last N days
export function getLastNDaysDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

// Calculate total rainfall by location
export function calculateTotalRainfallByLocation(
  data: RainfallData[]
): Array<{ location: string; rainfall: number }> {
  const grouped = groupRainfallDataByLocation(data)
  
  return Object.entries(grouped).map(([location, items]) => ({
    location,
    rainfall: items.reduce((sum, item) => sum + item.rainfall, 0)
  }))
}

// Calculate monthly aggregates
export function calculateMonthlyAggregates(
  data: RainfallData[]
): Array<{ month: string; rainfall: number; count: number; average: number }> {
  const monthlyData = data.reduce((acc, item) => {
    const date = new Date(item.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthKey]) {
      acc[monthKey] = { total: 0, count: 0, items: [] }
    }
    
    acc[monthKey].total += item.rainfall
    acc[monthKey].count += 1
    acc[monthKey].items.push(item)
    
    return acc
  }, {} as Record<string, { total: number; count: number; items: RainfallData[] }>)

  return Object.entries(monthlyData).map(([month, stats]) => ({
    month,
    rainfall: stats.total,
    count: stats.count,
    average: stats.total / stats.count
  })).sort((a, b) => a.month.localeCompare(b.month))
}
