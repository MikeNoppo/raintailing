import useSWR from 'swr'
import { useState } from 'react'
import { toast } from 'sonner'

// Types
interface RainfallDataResponse {
  data: Array<{
    id: string
    date: string
    rainfall: number
    notes?: string
    location: {
      id: string
      code: string
      name: string
      status: string
    }
    user?: {
      id: string
      username: string
      name?: string
    }
    createdAt: string
    updatedAt: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface RainfallFilters {
  location?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

interface CreateRainfallData {
  date: string
  rainfall: number
  locationId: string
  notes?: string
}

interface UpdateRainfallData {
  date?: string
  rainfall?: number
  locationId?: string
  notes?: string
}

// Fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch data')
  }
  return response.json()
}

// Hook for fetching rainfall data
export function useRainfallData(filters: RainfallFilters = {}) {
  const queryParams = new URLSearchParams()
  
  if (filters.location && filters.location !== 'all') {
    queryParams.append('location', filters.location)
  }
  if (filters.startDate) {
    queryParams.append('startDate', filters.startDate)
  }
  if (filters.endDate) {
    queryParams.append('endDate', filters.endDate)
  }
  if (filters.page) {
    queryParams.append('page', filters.page.toString())
  }
  if (filters.limit) {
    queryParams.append('limit', filters.limit.toString())
  }
  if (filters.sortBy) {
    queryParams.append('sortBy', filters.sortBy)
  }
  if (filters.order) {
    queryParams.append('order', filters.order)
  }

  const queryString = queryParams.toString()
  const url = `/api/rainfall${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<RainfallDataResponse>(
    url,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate
  }
}

// Hook for rainfall data mutations
export function useRainfallMutations() {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkImporting, setIsBulkImporting] = useState(false)

  const createRainfallData = async (data: CreateRainfallData) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/rainfall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create rainfall data')
      }

      toast.success('Rainfall data created successfully')
      return result.data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create rainfall data'
      toast.error(message)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const updateRainfallData = async (id: string, data: UpdateRainfallData) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/rainfall/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update rainfall data')
      }

      toast.success('Rainfall data updated successfully')
      return result.data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update rainfall data'
      toast.error(message)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteRainfallData = async (id: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/rainfall/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete rainfall data')
      }

      toast.success('Rainfall data deleted successfully')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete rainfall data'
      toast.error(message)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  const bulkImportRainfallData = async (data: CreateRainfallData[]) => {
    setIsBulkImporting(true)
    try {
      const response = await fetch('/api/rainfall/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import rainfall data')
      }

      // Show success/warning based on results
      if (result.results.failed === 0) {
        toast.success(`Successfully imported ${result.results.success} records`)
      } else {
        toast.warning(
          `Import completed with warnings: ${result.results.success} successful, ${result.results.failed} failed`
        )
      }

      return result.results
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import rainfall data'
      toast.error(message)
      throw error
    } finally {
      setIsBulkImporting(false)
    }
  }

  return {
    createRainfallData,
    updateRainfallData,
    deleteRainfallData,
    bulkImportRainfallData,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkImporting
  }
}

// Hook for fetching single rainfall data
export function useRainfallDataById(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/rainfall/${id}` : null,
    fetcher
  )

  return {
    data: data?.data,
    error,
    isLoading,
    mutate
  }
}
