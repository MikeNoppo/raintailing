import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LocalStorageManager } from '@/lib/utils/storage'
import { DEMO_CREDENTIALS } from '@/lib/constants'
import { toast } from 'sonner'

/**
 * Custom hook for handling authentication logic
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check authentication status on mount
    const authStatus = LocalStorageManager.getAuthStatus()
    setIsAuthenticated(authStatus)
    
    // Check if redirected from login with specific tab
    const tab = searchParams.get('tab')
    if (tab === 'admin' && authStatus) {
      // Will be handled by parent component
    }
  }, [searchParams])

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Simple authentication check
      if (username === DEMO_CREDENTIALS.USERNAME && password === DEMO_CREDENTIALS.PASSWORD) {
        LocalStorageManager.setAuthStatus(true)
        setIsAuthenticated(true)
        toast.success('Login berhasil!')
        
        // Redirect to appropriate page
        const returnTab = searchParams.get('return') || 'admin'
        router.push(`/?tab=${returnTab}`)
        
        return true
      } else {
        toast.error('Username atau password salah!')
        return false
      }
    } catch {
      toast.error('Terjadi kesalahan saat login')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    LocalStorageManager.setAuthStatus(false)
    setIsAuthenticated(false)
    toast.success('Logout berhasil!')
  }

  const requireAuth = (callback: () => void) => {
    if (!isAuthenticated) {
      router.push('/login?return=admin')
    } else {
      callback()
    }
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    requireAuth
  }
}
