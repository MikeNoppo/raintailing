import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Custom hook for handling authentication logic with NextAuth.js
 */
export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'
  const user = session?.user

  const logout = async () => {
    try {
      // Sign out in background without redirect
      signOut({ redirect: false }).then(() => {
        toast.success('Logout berhasil!')
      }).catch((error) => {
        console.error('Logout error:', error)
        toast.error('Terjadi kesalahan saat logout')
      })
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Terjadi kesalahan saat logout')
    }
  }

  const requireAuth = (callback: () => void) => {
    if (!isAuthenticated) {
      router.push('/login?return=admin')
    } else {
      callback()
    }
  }

  const hasRole = (role: string | string[]) => {
    if (!user?.role) return false
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  }

  const isAdmin = () => hasRole('ADMIN')
  const isOperator = () => hasRole(['ADMIN', 'OPERATOR'])

  return {
    session,
    user,
    isAuthenticated,
    isLoading,
    logout,
    requireAuth,
    hasRole,
    isAdmin,
    isOperator
  }
}
