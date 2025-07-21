import { RAINFALL_STATUS, RAINFALL_THRESHOLDS } from '@/lib/constants/dashboard'

/**
 * Determines rainfall status based on amount
 */
export function getRainfallStatus(rainfall: number) {
  if (rainfall < RAINFALL_THRESHOLDS.NORMAL) {
    return RAINFALL_STATUS.NORMAL
  }
  if (rainfall < RAINFALL_THRESHOLDS.MODERATE) {
    return RAINFALL_STATUS.MODERATE
  }
  return RAINFALL_STATUS.HIGH
}

/**
 * Calculates average rainfall from data array
 */
export function calculateAverageRainfall(data: Array<{ rainfall: number }>) {
  if (data.length === 0) return 0
  const sum = data.reduce((total, item) => total + item.rainfall, 0)
  return sum / data.length
}

/**
 * Gets current rainfall from latest data point
 */
export function getCurrentRainfall(data: Array<{ rainfall: number; date?: string }>) {
  if (data.length === 0) return 0
  
  // Jika data memiliki tanggal, ambil yang terbaru
  if (data[0]?.date) {
    const sortedData = [...data].sort((a, b) => {
      if (!a.date || !b.date) return 0
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    return sortedData[0]?.rainfall || 0
  }
  
  // Fallback ke data terakhir jika tidak ada tanggal
  return data[data.length - 1]?.rainfall || 0
}
