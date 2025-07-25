import { SWRConfig } from 'swr'
import React from 'react'

// Global SWR configuration for better performance
export const swrConfig = {
  refreshInterval: 0, // Disable auto-refresh by default
  revalidateOnFocus: false, // Disable revalidation on window focus to reduce delays
  revalidateOnReconnect: true, // Keep revalidation on reconnect
  revalidateIfStale: true, // Revalidate if data is stale
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  loadingTimeout: 3000, // Loading timeout of 3 seconds
  errorRetryInterval: 5000, // Retry interval on error
  errorRetryCount: 3, // Max retry count
  fallbackData: undefined,
  onLoadingSlow: () => {
    console.warn('SWR request is taking longer than expected')
  },
  onError: (error: Error) => {
    console.error('SWR Error:', error)
  }
}

// Fetcher function with timeout
export const fetcher = async (url: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection')
    }
    throw error
  }
}

// Wrapper component for SWR configuration
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(
    SWRConfig,
    { value: swrConfig },
    children
  )
}
