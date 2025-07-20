import { STORAGE_KEYS, DEFAULT_LOCATIONS } from '@/lib/constants'
import type { Location } from '@/lib/types'

/**
 * Utility functions for localStorage operations
 */

export class LocalStorageManager {
  /**
   * Get locations from localStorage with fallback to default
   */
  static getLocations(): Location[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure dates are properly parsed
        return parsed.map((loc: any) => ({
          ...loc,
          createdAt: new Date(loc.createdAt)
        }))
      }
    } catch (error) {
      console.error('Error loading locations from localStorage:', error)
    }
    return DEFAULT_LOCATIONS
  }

  /**
   * Get active locations only
   */
  static getActiveLocations(): Location[] {
    return this.getLocations().filter(loc => loc.status === 'active')
  }

  /**
   * Save locations to localStorage
   */
  static saveLocations(locations: Location[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations))
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('locationsUpdated'))
    } catch (error) {
      console.error('Error saving locations to localStorage:', error)
    }
  }

  /**
   * Get authentication status
   */
  static getAuthStatus(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_STATUS) === 'true'
    } catch (error) {
      console.error('Error getting auth status:', error)
      return false
    }
  }

  /**
   * Set authentication status
   */
  static setAuthStatus(isAuthenticated: boolean): void {
    try {
      if (isAuthenticated) {
        localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'true')
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_STATUS)
      }
    } catch (error) {
      console.error('Error setting auth status:', error)
    }
  }

  /**
   * Clear all app data
   */
  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

/**
 * Hook for listening to storage changes
 */
export function useStorageListener(key: string, callback: () => void) {
  if (typeof window === 'undefined') return

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === key) {
      callback()
    }
  }

  const handleCustomEvent = () => {
    callback()
  }

  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('locationsUpdated', handleCustomEvent)

  return () => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener('locationsUpdated', handleCustomEvent)
  }
}
