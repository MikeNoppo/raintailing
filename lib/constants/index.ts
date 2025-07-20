import type { Location } from '@/lib/types'

// Default locations configuration
export const DEFAULT_LOCATIONS: Location[] = [
  {
    id: "1",
    name: "Gosowong Pit",
    code: "GSW-PIT",
    description: "Stasiun monitoring di area pit Gosowong",
    status: "active",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "2", 
    name: "Gosowong Helipad (DP3)",
    code: "GSW-DP3",
    description: "Stasiun monitoring di helipad Gosowong DP3",
    status: "active",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "3",
    name: "Tailing dam (TSF)",
    code: "TSF",
    description: "Stasiun monitoring di tailing storage facility",
    status: "active", 
    createdAt: new Date("2024-01-01")
  },
  {
    id: "4",
    name: "Kencana (Portal)",
    code: "KNC-PRT",
    description: "Stasiun monitoring di portal Kencana",
    status: "active",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "5",
    name: "Toguraci (Portal)",
    code: "TGR-PRT", 
    description: "Stasiun monitoring di portal Toguraci",
    status: "active",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "6",
    name: "Gosowong North",
    code: "GSW-NTH",
    description: "Stasiun monitoring di area utara Gosowong",
    status: "active",
    createdAt: new Date("2024-01-01")
  }
]

// Rainfall classification categories
export const RAINFALL_CATEGORIES = {
  tidakHujan: { 
    min: 0, 
    max: 0, 
    label: "Tidak Hujan", 
    description: "0 mm",
    color: "#94a3b8", 
    emoji: "☀️" 
  },
  ringan: { 
    min: 0.1, 
    max: 20, 
    label: "Hujan Ringan", 
    description: "0.1 - 20 mm per hari",
    color: "#22c55e", 
    emoji: "🌦️" 
  },
  sedang: { 
    min: 20, 
    max: 50, 
    label: "Hujan Sedang", 
    description: "20 - 50 mm per hari",
    color: "#f59e0b", 
    emoji: "☔" 
  },
  lebat: { 
    min: 50, 
    max: Infinity, 
    label: "Hujan Lebat", 
    description: "lebih dari 50 mm per hari",
    color: "#ef4444", 
    emoji: "🌧️" 
  },
} as const

// Chart configuration for locations
export const CHART_CONFIG = {
  "GSW-PIT": {
    label: "Gosowong Pit",
    color: "hsl(220, 70%, 50%)", // Blue
  },
  "GSW-DP3": {
    label: "Gosowong Helipad (DP3)",
    color: "hsl(142, 76%, 36%)", // Green
  },
  "TSF": {
    label: "Tailing dam (TSF)",
    color: "hsl(47, 96%, 53%)", // Yellow
  },
  "KNC-PRT": {
    label: "Kencana (Portal)",
    color: "hsl(280, 87%, 47%)", // Purple
  },
  "TGR-PRT": {
    label: "Toguraci (Portal)",
    color: "hsl(348, 83%, 47%)", // Red
  },
  "GSW-NTH": {
    label: "Gosowong North",
    color: "hsl(24, 90%, 50%)", // Orange
  },
} as const

// localStorage keys
export const STORAGE_KEYS = {
  LOCATIONS: 'rainfall-locations',
  AUTH_STATUS: 'isAuthenticated',
} as const

// Auth credentials (for demo)
export const DEMO_CREDENTIALS = {
  USERNAME: 'admin',
  PASSWORD: 'admin123',
} as const

// Date format options
export const DATE_FORMATS = {
  SHORT: { month: 'short' as const, day: 'numeric' as const },
  LONG: { year: 'numeric' as const, month: 'long' as const, day: 'numeric' as const },
  MONTH_YEAR: { month: 'long' as const, year: 'numeric' as const },
} as const
