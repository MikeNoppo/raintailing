import { useState, useEffect, useCallback } from 'react'
import { LocationStatus } from '@prisma/client'

export interface Location {
  id: string
  name: string
  code: string
  description: string | null
  status: LocationStatus
  createdAt: string
  updatedAt: string
  _count?: {
    rainfallData: number
    monthlyAggregates: number
    thresholds?: number
  }
  rainfallData?: {
    date: string
    rainfall: number
  }[]
}

export interface CreateLocationData {
  name: string
  code: string
  description?: string
  status?: LocationStatus
}

export interface UpdateLocationData {
  name?: string
  code?: string
  description?: string
  status?: LocationStatus
}

interface UseLocationsOptions {
  status?: LocationStatus
  includeInactive?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useLocations(options: UseLocationsOptions = {}) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    status,
    includeInactive = false,
    autoRefresh = false, // Disable auto-refresh by default to improve performance
    refreshInterval = 60000 // Increase interval to 60 seconds when enabled
  } = options

  const fetchLocations = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      
      if (status) params.append('status', status)
      if (includeInactive) params.append('includeInactive', 'true')

      const response = await fetch(`/api/locations?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch locations')
      }

      setLocations(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [status, includeInactive])

  useEffect(() => {
    fetchLocations()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchLocations, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchLocations, autoRefresh, refreshInterval])

  const refetch = () => {
    setLoading(true)
    fetchLocations()
  }

  return {
    locations,
    loading,
    error,
    refetch,
    count: locations.length
  }
}

export function useLocation(id: string) {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocation = useCallback(async () => {
    if (!id) return

    try {
      setError(null)
      const response = await fetch(`/api/locations/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch location')
      }

      setLocation(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  const refetch = () => {
    setLoading(true)
    fetchLocation()
  }

  return {
    location,
    loading,
    error,
    refetch
  }
}

export function useLocationMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLocation = async (data: CreateLocationData): Promise<Location> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create location')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateLocation = async (id: string, data: UpdateLocationData): Promise<Location> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update location')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateLocationStatus = async (id: string, status: LocationStatus): Promise<Location> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/locations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update location status')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteLocation = async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete location')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    createLocation,
    updateLocation,
    updateLocationStatus,
    deleteLocation,
    loading,
    error
  }
}
