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

export const DATE_FORMATS = {
  SHORT: { month: 'short' as const, day: 'numeric' as const },
  LONG: { year: 'numeric' as const, month: 'long' as const, day: 'numeric' as const },
  MONTH_YEAR: { month: 'long' as const, year: 'numeric' as const },
} as const
