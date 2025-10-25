// Centralized type definitions

// Export API route types
export * from './api'

export interface RainfallData {
  date: string
  rainfall: number
  location: string
}

// Database compatible rainfall data type
export interface RainfallDataDB {
  id: string
  date: string | Date
  rainfall: number
  notes?: string | null
  location: {
    id: string
    code: string
    name: string
    status: string
  }
  user?: {
    id: string
    username: string
    name?: string | null
  }
  createdAt: string | Date
  updatedAt: string | Date
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
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  coordinates?: {
    lat: number
    lng: number
  }
  status: 'active' | 'inactive' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  createdAt: Date | string
  updatedAt?: Date | string
  _count?: {
    rainfallData?: number
  }
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

export type ExportMode = 'monthly' | 'yearly'

export interface MonthlyStats {
  month: number
  monthName: string
  total: number
  average: number
  peak: number
  rainDays: number
  wetDays: number
  dataCount: number
}

export interface YearlyExportData {
  year: number
  locations: string[]
  monthlyStats: MonthlyStats[]
  locationStats: {
    [locationCode: string]: {
      monthlyData: {
        month: number
        total: number
        average: number
        peak: number
      }[]
      yearlyTotal: number
      yearlyAverage: number
      yearlyPeak: number
    }
  }
}
