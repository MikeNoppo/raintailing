import { dailyData } from "./rainfall-data"
import { RAINFALL_CATEGORIES } from '@/lib/constants'
import type { RainfallCategory, RainfallData } from '@/lib/types'

export const rainfallCategories = RAINFALL_CATEGORIES
export type { RainfallCategory }

// Classify single rainfall amount
export function classifyRainfall(amount: number): RainfallCategory {
  if (amount === 0) return "tidakHujan"
  if (amount > 0 && amount <= 20) return "ringan"
  if (amount > 20 && amount <= 50) return "sedang"
  return "lebat"
}

// Get rainfall statistics by location
export function getRainfallStatsByLocation(data: RainfallData[] = dailyData) {
  const locationStats = new Map<string, {
    location: string
    totalDays: number
    categories: Record<RainfallCategory, number>
    totalRainfall: number
    avgRainfall: number
    maxRainfall: number
    minRainfall: number
  }>()

  // Group data by location
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.location]) {
      acc[item.location] = []
    }
    acc[item.location].push(item)
    return acc
  }, {} as Record<string, RainfallData[]>)

  // Calculate stats for each location
  Object.entries(groupedData).forEach(([location, locationData]: [string, RainfallData[]]) => {
    const categories: Record<RainfallCategory, number> = {
      tidakHujan: 0,
      ringan: 0,
      sedang: 0,
      lebat: 0
    }

    let totalRainfall = 0
    let maxRainfall = 0
    let minRainfall = Infinity

    locationData.forEach((item: RainfallData) => {
      const category = classifyRainfall(item.rainfall)
      categories[category]++
      
      totalRainfall += item.rainfall
      maxRainfall = Math.max(maxRainfall, item.rainfall)
      minRainfall = Math.min(minRainfall, item.rainfall)
    })

    locationStats.set(location, {
      location,
      totalDays: locationData.length,
      categories,
      totalRainfall,
      avgRainfall: totalRainfall / locationData.length,
      maxRainfall,
      minRainfall: minRainfall === Infinity ? 0 : minRainfall
    })
  })

  return Array.from(locationStats.values())
}

// Get overall rainfall statistics
export function getOverallRainfallStats(data: RainfallData[] = dailyData) {
  const categories: Record<RainfallCategory, number> = {
    tidakHujan: 0,
    ringan: 0,
    sedang: 0,
    lebat: 0
  }

  let totalRainfall = 0
  let maxRainfall = 0
  let minRainfall = Infinity
  const rainfallAmounts: number[] = []

  data.forEach(item => {
    const category = classifyRainfall(item.rainfall)
    categories[category]++
    
    totalRainfall += item.rainfall
    maxRainfall = Math.max(maxRainfall, item.rainfall)
    minRainfall = Math.min(minRainfall, item.rainfall)
    rainfallAmounts.push(item.rainfall)
  })

  // Calculate percentiles
  const sortedAmounts = rainfallAmounts.sort((a, b) => a - b)
  const p25 = sortedAmounts[Math.floor(sortedAmounts.length * 0.25)]
  const p50 = sortedAmounts[Math.floor(sortedAmounts.length * 0.5)] // median
  const p75 = sortedAmounts[Math.floor(sortedAmounts.length * 0.75)]

  return {
    totalDays: data.length,
    categories,
    totalRainfall,
    avgRainfall: totalRainfall / data.length,
    maxRainfall,
    minRainfall: minRainfall === Infinity ? 0 : minRainfall,
    percentiles: { p25, p50, p75 }
  }
}

// Get rainfall trends (daily changes)
export function getRainfallTrends(data: RainfallData[] = dailyData, location?: string) {
  let filteredData = data
  
  if (location) {
    filteredData = data.filter(item => item.location === location)
  }

  // Sort by date
  const sortedData = filteredData.sort((a, b) => a.date.localeCompare(b.date))
  
  const trends = []
  for (let i = 1; i < sortedData.length; i++) {
    const current = sortedData[i]
    const previous = sortedData[i - 1]
    
    if (current.location === previous.location) {
      const change = current.rainfall - previous.rainfall
      const changePercent = previous.rainfall > 0 ? (change / previous.rainfall) * 100 : 0
      
      trends.push({
        date: current.date,
        location: current.location,
        currentRainfall: current.rainfall,
        previousRainfall: previous.rainfall,
        change,
        changePercent,
        trend: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable'
      })
    }
  }

  return trends
}

// Get monthly summary
export function getMonthlyClassificationSummary(data: RainfallData[] = dailyData) {
  const monthlyData = new Map<string, {
    month: string
    categories: Record<RainfallCategory, number>
    totalDays: number
    totalRainfall: number
  }>()

  data.forEach(item => {
    const date = new Date(item.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        month: monthName,
        categories: { tidakHujan: 0, ringan: 0, sedang: 0, lebat: 0 },
        totalDays: 0,
        totalRainfall: 0
      })
    }

    const monthData = monthlyData.get(monthKey)!
    const category = classifyRainfall(item.rainfall)
    
    monthData.categories[category]++
    monthData.totalDays++
    monthData.totalRainfall += item.rainfall
  })

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month))
}

// Format percentage
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%"
  return `${((value / total) * 100).toFixed(1)}%`
}

// Get dominant category
export function getDominantCategory(categories: Record<RainfallCategory, number>): {
  category: RainfallCategory
  count: number
  percentage: number
} {
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0)
  let maxCount = 0
  let dominantCategory: RainfallCategory = "tidakHujan"

  Object.entries(categories).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count
      dominantCategory = category as RainfallCategory
    }
  })

  return {
    category: dominantCategory,
    count: maxCount,
    percentage: total > 0 ? (maxCount / total) * 100 : 0
  }
}
