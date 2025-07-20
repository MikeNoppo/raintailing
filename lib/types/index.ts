// Centralized type definitions
export interface RainfallData {
  date: string
  rainfall: number
  location: string
}

export interface MonthlyData {
  month: string
  rainfall: number
  average: number
}

export interface Location {
  id: string
  name: string
  code: string
  description?: string
  coordinates?: {
    lat: number
    lng: number
  }
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface DateRange {
  from: Date
  to: Date
}

export interface FilterOptions {
  location: string
  dateRange?: DateRange
}

export interface RainfallStats {
  totalDays: number
  totalRainfall: number
  avgRainfall: number
  maxRainfall: number
  minRainfall: number
  percentiles: {
    p25: number
    p50: number
    p75: number
  }
}

export interface LocationStats extends RainfallStats {
  location: string
  categories: Record<RainfallCategory, number>
}

export type RainfallCategory = 'tidakHujan' | 'ringan' | 'sedang' | 'lebat'

export type ChartType = 'daily' | 'monthly' | 'location-total' | 'monthly-location-total'
export type ChartOrientation = 'vertical' | 'horizontal'
