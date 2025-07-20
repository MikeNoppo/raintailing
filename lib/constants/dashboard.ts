// Rainfall status constants
export const RAINFALL_THRESHOLDS = {
  NORMAL: 10,
  MODERATE: 30,
} as const

export const RAINFALL_STATUS = {
  NORMAL: {
    color: "bg-green-500",
    text: "Normal",
    threshold: RAINFALL_THRESHOLDS.NORMAL
  },
  MODERATE: {
    color: "bg-yellow-500", 
    text: "Sedang",
    threshold: RAINFALL_THRESHOLDS.MODERATE
  },
  HIGH: {
    color: "bg-red-500",
    text: "Tinggi"
  }
} as const

// Dashboard configuration
export const DASHBOARD_CONFIG = {
  TOTAL_STATIONS: 6,
  DEFAULT_TAB: "dashboard"
} as const

// UI Constants
export const TAB_IDS = {
  DASHBOARD: "dashboard",
  DATA: "data",
  ADMIN: "admin"
} as const

export type TabId = keyof typeof TAB_IDS
